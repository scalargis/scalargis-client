import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import ViewersList from './ViewersList';


const initialSearchParams = {
  filters: {},
  first: 0,
  rows: 20,
  page: 0,
  sortField: 'id',
  sortOrder: 1
}


function PrintGroupList(props) {

  const {
    history,
    groupsFilter
  } = props;

  const { core } = useContext(AppContext);

  const toast = useRef(null);

  const [loading, setLoading] = useState(false);  
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState(null);

  const [searchParams, setSearchParams] = useState({...initialSearchParams});

  const loaded = useRef(false);
  const dt = useRef(null);

  const API_URL = core.API_URL;

  useEffect(() => {
    if (!loaded.current) return;

    loaded.current = true;
    if (groupsFilter) {
      setSearchParams(...groupsFilter);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [searchParams]);

    
  const newRecord = () => {
    const location = {
      pathname: '/prints/groups/create',
      state: { 
        from: history.location.pathname,
        previousSearchParams: {...searchParams}
      }
    }
    history.push(location);   
  }

  const editRecord = (record) => {
    const location = {
      pathname: `/prints/groups/edit/${record.id}`,
      state: { 
        from: history.location.pathname,
        previousSearchParams: {...searchParams}
      }
    }
    history.push(location);    
  }  

  const deleteSelectedRecords = () => {
    confirmDialog({
      message: ' Deseja eliminar o(s) registo(s) selecionado(s)?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const provider = dataProvider(API_URL + '/portal');
        const params = {
          ids: selectedRecords.map(v => v.id)
        }
        provider.deleteMany('prints/groups', params).then(d => {
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
      accept: () => {
        const provider = dataProvider(API_URL + '/portal');
        const params = {
          id: record.id
        }      
        provider.delete('prints/groups', params).then(d => {
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

  const loadData = (filters) => {
    const provider = dataProvider(API_URL + '/portal');
  
    const _filter = {};
    if (filters) {
      Object.entries(filters).forEach(([key, item]) => {
        _filter[key] = item.value;
      });
    } else if (searchParams.filters) {
      Object.entries(searchParams.filters).forEach(([key, item]) => {
        _filter[key] = item.value;
      });
    }

    const params = {
      pagination: { page: searchParams.page + 1, perPage: searchParams.rows},
      sort: { field: searchParams.sortField, order: searchParams.sortOrder === -1 ? 'Desc' : 'Asc' },
      filter: _filter
    }

    setLoading(true);

    provider.getList('prints/groups', params).then(d => {
      setSelectedRecords(null);
      setRecords({ ...d, page: searchParams.page });
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      //toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Grupos de Plantas', detail: 'Ocorreu um erro na pesquisa'});
      toast.current && toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Grupos de Plantas', detail: 'Ocorreu um erro na pesquisa'});
    });
  }

  const onPage = (event) => {
    let _searchParams = { ...searchParams, ...event };
    setSearchParams(_searchParams);
  }

  const onSort = (event) => {
    let _searchParams = { ...searchParams, ...event };
    setSearchParams(_searchParams);
  }

  const onFilter = (event) => {
    let _searchParams = { ...searchParams, ...event };
    _searchParams['first'] = 0;
    _searchParams['page'] = 0;
    setSearchParams(_searchParams);    
  }

  const onFilterClear = (event) => {
    setSearchParams({ ...initialSearchParams});    
  }

  const groupsTemplate = (rowData) => {
    return (
        <React.Fragment>
          { rowData.groups && rowData.groups.map( (item) => <Chip key={item.id} label={item.code} className="p-mr-2 p-mb-2" /> ) }
        </React.Fragment>
    );
  }

  const printsTemplate = (rowData) => {
    return (
        <React.Fragment>
          { rowData.groups && rowData.prints.map( (item) => <Chip key={item.id} label={item.code} className="p-mr-2 p-mb-2" /> ) }
        </React.Fragment>
    );
  }  

  const viewersTemplate = (rowData) => {
    if (!rowData?.viewers?.length) return null;

    return (
      <div className='p-text-center'>
        <ViewersList id={rowData.id} elementType="groups" header={`Grupo - [${rowData.code}] ${rowData.title}`} />
      </div>
    );    

    /*
    if (rowData.viewers.length > 5) {
      return (
        <div className='p-text-center'>
          <ViewersList id={rowData.id} elementType="groups" header={`Grupo - [${rowData.code}] ${rowData.title}`} />
        </div>
      )
    }

    return (
      <React.Fragment>
        { rowData.viewers && rowData.viewers.map( (item) => <Chip key={item.id} label={item.name} style={{"maxWidth": "100px"}} className="p-mr-2 p-mb-2 cut-text" /> ) }
      </React.Fragment>
    );
    */
  }

  const leftToolbarTemplate = () => {
    return (
        <React.Fragment>
            <Button label="Novo" icon="pi pi-plus" className="p-button-success p-mr-2" onClick={newRecord} />
            <Button label="Eliminar" icon="pi pi-trash" className="p-button-danger" onClick={deleteSelectedRecords} disabled={!selectedRecords || !selectedRecords.length} />
        </React.Fragment>
    )
  }

  const rightToolbarTemplate = () => {
      return (
          <React.Fragment>              
              <Button label="Limpar" icon="pi pi-times" className="p-button-help p-mr-2" onClick={onFilterClear} />
              {/*<Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />*/}
          </React.Fragment>
      )
  }

  const actionBodyTemplate = (rowData) => {
    return (
        <React.Fragment>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" onClick={() => editRecord(rowData)} />
            <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => deleteRecord(rowData)} />
        </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="p-col-12"><h3>Emissão de Plantas - Grupos</h3></div>

      <div className="p-grid p-fluid print-list">
        <Toast ref={toast} baseZIndex={2000} />
        <div className="card">
          <Toolbar className="p-mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

          <DataTable ref={dt} value={records ? records.data : []} lazy
              selectionMode="checkbox"
              selection={selectedRecords} onSelectionChange={(e) => setSelectedRecords(e.value)}
              paginator first={searchParams.first} rows={searchParams.rows} totalRecords={records.total} onPage={onPage}
              onSort={onSort} sortField={searchParams.sortField} sortOrder={searchParams.sortOrder}
              filters={searchParams.filters} onFilter={onFilter} loading={loading}
              emptyMessage="Não foram encontrados registos." >
              <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
              <Column field="id" header="Id" sortable filter filterPlaceholder="Id" headerStyle={{ width: '6rem' }} />
              <Column field="code" header="Código" sortable filter filterPlaceholder="Código" style={{"wordBreak": "break-all"}} />
              <Column field="title" header="Título" sortable filter filterPlaceholder="Título" style={{"wordBreak": "break-all"}} /> 
              <Column field="groups" header="Grupos" body={groupsTemplate} filter filterPlaceholder="Grupo" style={{"wordBreak": "break-all"}} />
              <Column field="prints" header="Plantas" body={printsTemplate} filter filterPlaceholder="Planta" style={{"wordBreak": "break-all"}} />
              <Column field="viewers" header="Visualizadores" body={viewersTemplate} filter filterPlaceholder="Visualizador" style={{"wordBreak": "break-all"}} />
              <Column body={actionBodyTemplate} />
          </DataTable>
        </div>
      </div>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, filters: state.filters }))(withRouter(PrintGroupList));