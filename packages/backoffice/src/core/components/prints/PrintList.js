import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { withRouter, Route, Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

import AppContext from '../../../AppContext'
import useFormFields from '../../useFormFields';
import dataProvider from '../../../service/DataProvider';
import { isAdminOrManager } from '../../utils';

function PrintList(props) {

  const {
    history,
    dispatch,
    printsFilter,
    savePrintsFilter
  } = props;

  const { core } = useContext(AppContext);
  //const { backoffice_set_printsfilter } = core.actions;

  const toast = useRef(null);

  const [loading, setLoading] = useState(false);  
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState(null);

  const [searchParams, setSearchParams] = useState({
    filters: {},
    first: 0,
    rows: 20,
    page: 0,
    sortField: 'id',
    sortOrder: 1
  });      

  const [isSearching, setIsSearching] = useState(false);

  const loaded = useRef(false);
  const dt = useRef(null);

  const auth = core.store.getState().auth;
  const adminOrManager = isAdminOrManager(auth);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!loaded.current) return;

    loaded.current = true;
    if (printsFilter) {
      setSearchParams(...printsFilter);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const onCustomSaveState = (state) => {
    //console.log(JSON.stringify(state));
    //window.sessionStorage.setItem('dt-state-demo-custom', JSON.stringify(state));
    
    //savePrintsFilter(state);
  }

  const onCustomRestoreState = () => {
    //console.log(window.sessionStorage.getItem('dt-state-demo-custom'));
    //return JSON.parse(window.sessionStorage.getItem('dt-state-demo-custom'));
    //console.log('teste');
    return printsFilter;
  }  
  
  const newRecord = () => {
    const location = {
      pathname: '/prints/create',
      state: { 
        from: history.location.pathname,
        previousSearchParams: {...searchParams}
      }
    }
    history.push(location);   
  }

  const editRecord = (record) => {
    const location = {
      pathname: `/prints/edit/${record.id}`,
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
        const provider = dataProvider(API_URL + '/api/v2/portal');
        const params = {
          //ids: selectedRecords.filter(v => !v.read_only).map(v => v.id)
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
      accept: () => {
        const provider = dataProvider(API_URL + '/api/v2/portal');
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
    //dt.current.exportCSV();
  }

  const loadData = (filters) => {
    const provider = dataProvider(API_URL + '/api/v2/portal');
  
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
      sort: { field: searchParams.sortField, order: searchParams.sortOrder == -1 ? 'Desc' : 'Asc' },
      filter: _filter
    }

    setLoading(true);

    provider.getList('prints', params).then(d => {
      setSelectedRecords(null);
      setRecords({ ...d, page: searchParams.page });
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Visualizadores', detail: 'Ocorreu um erro na pesquisa de intervenções'});
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
    setSearchParams(_searchParams);    
  }

  const groupsTemplate = (rowData) => {
    return (
        <React.Fragment>
          { rowData.groups && rowData.groups.map( (item) => <Chip key={item.id} label={item.code} className="p-mr-2 p-mb-2" /> ) }
        </React.Fragment>
    );
  }

  const viewersTemplate = (rowData) => {
    return (
        <React.Fragment>
          { rowData.viewers && rowData.viewers.map( (item) => <Chip key={item.id} label={item.name} className="p-mr-2 p-mb-2" /> ) }
        </React.Fragment>
    );
  } 

  const ownerTemplate = (rowData) => {
    let elem = <Chip label="Anónimo" icon="far fa-user" className="p-mr-2 p-mb-2" />;

    if (rowData?.owner?.id > 0) {
      if (rowData.owner.active) {
        elem = <Chip label={rowData.owner.username} icon="fas fa-user-alt" className="p-mr-2 p-mb-2" /> 
      } else {
        elem = <Chip label={rowData.owner.username} icon="fas fa-user-alt-slash" className="p-mr-2 p-mb-2" /> 
      }
    }

    return elem;
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
              <Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />
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
    <div className="p-grid p-fluid print-list">
      <Toast ref={toast} baseZIndex={2000} />
      <div>Print List</div>
        <div className="card">
        <Toolbar className="p-mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

        <DataTable ref={dt} value={records ? records.data : []} lazy
            selection={selectedRecords} onSelectionChange={(e) => setSelectedRecords(e.value)}
            paginator first={searchParams.first} rows={searchParams.rows} totalRecords={records.total} onPage={onPage}
            onSort={onSort} sortField={searchParams.sortField} sortOrder={searchParams.sortOrder}
            filters={searchParams.filters} onFilter={onFilter} loading={loading}
            stateStorage="custom" customSaveState={onCustomSaveState} customRestoreState={onCustomRestoreState}
            emptyMessage="Não foram encontrados registos." >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column field="id" header="Id" sortable filter filterPlaceholder="Id" headerStyle={{ width: '6rem' }} />
            <Column field="code" header="Código" sortable filter filterPlaceholder="Código" style={{"wordBreak": "break-all"}} />
            <Column field="name" header="Nome" sortable filter filterPlaceholder="Nome" style={{"wordBreak": "break-all"}} />
            <Column field="title" header="Título" sortable filter filterPlaceholder="Título" style={{"wordBreak": "break-all"}} /> 
            <Column field="groups" header="Grupos" body={groupsTemplate} />
            <Column field="viewers" header="Visualizadores" body={viewersTemplate} />
            { adminOrManager && <Column field="owner" header="Dono" body={ownerTemplate} /> }
            <Column body={actionBodyTemplate} />
        </DataTable>
      </div>
    </div>
  );

}

export default connect(state => ({ loading: state.loading }))(withRouter(PrintList));