import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import { isAdminOrManager } from '../../utils';
import ViewersList from './ViewersList';


const initialSearchParams = {
  filters: undefined,
  first: 0,
  rows: 20,
  page: 0,
  sortField: 'id',
  sortOrder: 1
}


function PrintList(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const toast = useRef(null);

  const [loading, setLoading] = useState(false);  
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState(null);

  const [searchParams, setSearchParams] = useState({...initialSearchParams});

  const [loaded, setLoaded] = useState(false);

  const dt = useRef(null);

  const auth = core.store.getState().auth;
  const adminOrManager = isAdminOrManager(auth)

  const API_URL = core.API_URL;


  useEffect(() => {
    setLoaded(true);
    
    if (location?.state?.searchParams) {
      setSearchParams({...location.state.searchParams});
    } else {
      loadData();
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const handler = setTimeout(() => {
      loadData();
    }, 500);
    return () => {
      clearTimeout(handler);
    };    
  }, [searchParams]);
  
  const newRecord = () => {
    const state = { 
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate('/prints/create', { state });
  }

  const editRecord = (record) => {
    const state = { 
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate(`/prints/edit/${record.id}`, { state });
  }  

  const deleteSelectedRecords = () => {
    confirmDialog({
      message: ' Deseja eliminar o(s) registo(s) selecionado(s)?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      defaultFocus: 'reject',
      accept: () => {
        const provider = dataProvider(API_URL + '/portal');
        const params = {
          ids: selectedRecords.map(v => v.id)
        }
        provider.deleteMany('prints', params).then(d => {
          toast.current.show({life: 3000, severity: 'success', summary: 'Eliminar Registo(s)', detail: 'Registo(s) eliminado(s) com sucesso'});
          loadData();          
        }).catch(e => {
          toast.current.show({life: 3000, severity: 'error', summary: 'Eliminar Registo(s)', detail: 'Ocorreu um erro ao eliminar o(s) registo(s)'}); 
        }).finally(() => {
        });
      },
      reject: () =>  { }      
    });
  }

  const deleteRecord = (record) => {
    confirmDialog({
      message: ' Deseja eliminar o registo selecionado?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      defaultFocus: 'reject',
      accept: () => {
        const provider = dataProvider(API_URL + '/portal');
        const params = {
          id: record.id
        }      
        provider.delete('prints', params).then(d => {
          toast.current.show({life: 3000, severity: 'success', summary: 'Eliminar Registo', detail: 'Registo eliminado com sucesso'});
          loadData();          
        }).catch(e => {
          toast.current.show({life: 3000, severity: 'error', summary: 'Eliminar Registo', detail: 'Ocorreu um erro ao eliminar o registo'}); 
        }).finally(() => {
          //console.log('finally');
        });
      },
      reject: () =>  { }      
    });
  }  

  const exportCSV = () => {
    //TODO: implement export
    //dt.current.exportCSV();
  }

  const loadData = () => {
    const provider = dataProvider(API_URL + '/portal');
  
    const _filter = {};
    if (searchParams.filters) {
      Object.entries(searchParams.filters).forEach(([key, item]) => {
        if (item.value) {
          _filter[key] = item.value;
        }
      });
    }

    const params = {
      pagination: { page: searchParams.page + 1, perPage: searchParams.rows},
      sort: { field: searchParams.sortField, order: searchParams.sortOrder === -1 ? 'Desc' : 'Asc' },
      filter: _filter
    }

    setLoading(true);

    provider.getList('prints', params).then(d => {
      setSelectedRecords(null);
      setRecords({ ...d, page: searchParams.page });
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      toast.current && toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Plantas', detail: 'Ocorreu um erro na pesquisa'});
    });
  }

  const onPage = (event) => {
    setSearchParams({...searchParams, ...event});
  }

  const onSort = (event) => {
    setSearchParams({...searchParams, ...event});
  }

  const onFilter = (event) => {
    setSearchParams({
      ...searchParams,
      ...event,
      first: 0,
      page: 0
    });    
  }

  const onFilterClear = (event) => {
    setSearchParams({...initialSearchParams});    
  }

  const groupsTemplate = (rowData) => {
    return (
        <React.Fragment>
          { rowData.groups && rowData.groups.map( (item) => <Chip key={item.id} label={item.code} className="mr-2 mb-2" /> ) }
        </React.Fragment>
    );
  }

  const viewersTemplate = (rowData) => {
    if (!rowData?.viewers?.length) return null;

    return (
      <div className='text-center'>
        <ViewersList id={rowData.id} elementType="prints" header={`Planta - [${rowData.code}] ${rowData.title}`} />
      </div>
    );
  }

  const ownerTemplate = (rowData) => {
    let elem = <Chip label="Anónimo" icon="far fa-user" className="mr-2 mb-2" />;

    if (rowData?.owner?.id > 0) {
      if (rowData.owner.active) {
        elem = <Chip label={rowData.owner.username} icon="fas fa-user-alt" className="mr-2 mb-2" /> 
      } else {
        elem = <Chip label={rowData.owner.username} icon="fas fa-user-alt-slash" className="mr-2 mb-2" /> 
      }
    }

    return elem;
  }

  const leftToolbarTemplate = () => {
    return (
        <React.Fragment>
            <Button label="Novo" icon="pi pi-plus" className="p-button-success mr-2" onClick={newRecord} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteSelectedRecords} disabled={!selectedRecords || !selectedRecords.length} />
        </React.Fragment>
    )
  }

  const rightToolbarTemplate = () => {
      return (
          <React.Fragment>              
              <Button label="Limpar" icon="pi pi-times" className="p-button-help mr-2" onClick={onFilterClear} />
              {/*<Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />*/}
          </React.Fragment>
      )
  }

  const actionBodyTemplate = (rowData) => {
    return (
        <React.Fragment>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-success mr-2" onClick={() => editRecord(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => deleteRecord(rowData)} />
        </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="col-12"><h3>Emissão de Plantas - Plantas</h3></div>

      <div className="grid print-list">
        <Toast ref={toast} baseZIndex={2000} />
        <ConfirmDialog />
        <div className="card col-12">
          <Toolbar className="mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>

          <DataTable ref={dt} value={records ? records.data : []} lazy dataKey="id"
            selectionMode="checkbox"
            selection={selectedRecords} onSelectionChange={(e) => setSelectedRecords(e.value)}
            paginator first={searchParams.first} rows={searchParams.rows} totalRecords={records.total} onPage={onPage}
            onSort={onSort} sortField={searchParams.sortField} sortOrder={searchParams.sortOrder}  
            filterDisplay="row" filters={searchParams?.filters} onFilter={onFilter} loading={loading}
            emptyMessage="Não foram encontrados registos." >
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
              <Column field="id" header="Id" sortable filter filterPlaceholder="Id" showFilterMenu={false} headerStyle={{ width: '120px' }} />
              <Column field="code" header="Código" sortable filter filterPlaceholder="Código" showFilterMenu={false} style={{"wordBreak": "break-all"}} />
              <Column field="name" header="Nome" sortable filter filterPlaceholder="Nome" showFilterMenu={false} style={{"wordBreak": "break-all"}} />
              <Column field="title" header="Título" sortable filter filterPlaceholder="Título" showFilterMenu={false} style={{"wordBreak": "break-all"}} /> 
              <Column field="groups" header="Grupos" body={groupsTemplate} filter filterPlaceholder="Grupo" showFilterMenu={false} style={{"wordBreak": "break-all"}} />
              <Column field="viewers" header="Visualizadores" body={viewersTemplate} filter filterPlaceholder="Visualizador" showFilterMenu={false} style={{"wordBreak": "break-all"}} />
              { adminOrManager && <Column field="owner" header="Dono" body={ownerTemplate} style={{"wordBreak": "break-all"}} /> }
              <Column body={actionBodyTemplate} style={{width: '110px'}} />
          </DataTable>
        </div>
      </div>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, filters: state.filters }))(PrintList);