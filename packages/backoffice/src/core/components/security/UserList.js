import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';

const initialSearchParams = {
  filters: {
    "id": {value: null, matchMode: 'startsWith'},
    "username": {value: null, matchMode: 'startsWith'},
    "email": {value: null, matchMode: 'startsWith'},
    "name": {value: null, matchMode: 'startsWith'},
    "active": {value: true, matchMode: 'equals'}
  },
  first: 0,
  rows: 20,
  page: 0,
  sortField: 'id',
  sortOrder: 1
}

function UserList(props) {
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
    navigate('/security/users/create', { state });
  }

  const editRecord = (record) => {
    const state = { 
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate(`/security/users/edit/${record.id}`, { state });
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
        const provider = dataProvider(API_URL + '/security');
        const params = {
          ids: selectedRecords.filter(v => !v.read_only).map(v => v.id)
        }
        provider.deleteMany('users', params).then(d => {
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
        const provider = dataProvider(API_URL + '/security');
        const params = {
          id: record.id
        }      
        provider.delete('users', params).then(d => {
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
    const provider = dataProvider(API_URL + '/security');
  
    const _filter = {};
    if (searchParams.filters) {
      Object.entries(searchParams.filters).forEach(([key, item]) => {
        if (item.value != null) {
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

    provider.getList('users', params).then(d => {
      setSelectedRecords(null);
      setRecords({ ...d, page: searchParams.page });
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      toast.current && toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Utilizadores', detail: 'Ocorreu um erro na pesquisa'});
    });
  }

  const onPage = (event) => {
    setSearchParams({ ...searchParams, ...event });
  }

  const onSort = (event) => {
    setSearchParams({ ...searchParams, ...event });
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
    /*
    setSearchParams({
      ...initialSearchParams,
      filters: 
        {
          ...initialSearchParams?.filters, 
          active: {
            ...initialSearchParams?.filters?.active,
            value: null
          }
        }
      }
    );
    */
  }   

  const onSelectionChange = (event) => {
    setSelectedRecords(event.value.filter(v => !v.read_only));
  }

  const onStatusChange = (e) => {
    dt.current.filter(e.value, 'active', 'equals');
  }

  const statusBodyTemplate = (rowData) => {
    if (rowData.active) {
      return <i className="pi pi-check" style={{fontWeight: 'bold', color: '#28a745'}}></i> 
    } else {
      return <i className="pi pi-times" style={{fontWeight: 'bold', color: '#D32F2F'}}></i>
    }
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
    if (rowData.read_only) {
      return (<Button icon="fas fa-lock" className="p-button-rounded p-button-secondary" disabled />);
    } else {
      return (
          <React.Fragment>
              <Button icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" onClick={() => editRecord(rowData)} />
              <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => deleteRecord(rowData)} />
          </React.Fragment>
      );
    }
  }

  const statusFilter = <Dropdown value={searchParams?.filters?.active?.value} options={[{label: 'Sim', value: true}, {label: 'Não', value: false}]} onChange={onStatusChange} placeholder="" className="p-column-filter" showClear />;


  return (
      <React.Fragment>
        <div className="p-col-12"><h3>Utilizadores</h3></div>

        <div className="p-grid p-fluid viewer-list">
          <Toast ref={toast} baseZIndex={2000} />
          <ConfirmDialog />
          <div className="card">
            <Toolbar className="p-mb-4" start={leftToolbarTemplate} end={rightToolbarTemplate}></Toolbar>

            <DataTable ref={dt} value={records ? records.data : []} lazy dataKey="id"
              selectionMode="checkbox"
              selection={selectedRecords} onSelectionChange={(e) => setSelectedRecords(e.value)}
              paginator first={searchParams.first} rows={searchParams.rows} totalRecords={records.total} onPage={onPage}
              onSort={onSort} sortField={searchParams.sortField} sortOrder={searchParams.sortOrder}  
              filterDisplay="row" filters={searchParams?.filters} onFilter={onFilter} loading={loading}
              emptyMessage="Não foram encontrados registos." >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                <Column field="id" header="Id" sortable filter filterPlaceholder="Id" showFilterMenu={false} headerStyle={{ width: '6rem' }} />
                <Column field="username" header="Username" sortable filter filterPlaceholder="Username" showFilterMenu={false} style={{"wordBreak": "break-all"}} />
                <Column field="email" header="Email" sortable filter filterPlaceholder="Email" showFilterMenu={false} style={{"wordBreak": "break-all"}} />
                <Column field="name" header="Nome" sortable filter filterPlaceholder="Nome" showFilterMenu={false} style={{"wordBreak": "break-all"}} />
                <Column field="active" header="Ativo" body={statusBodyTemplate} sortable filter filterElement={statusFilter} showFilterMenu={false} className="p-text-center" headerStyle={{ width: '9rem' }} />
                <Column body={actionBodyTemplate} style={{"textAlign": "center"}} />
            </DataTable>
          </div>
        </div>
      </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(UserList);