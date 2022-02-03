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
import { Dialog } from 'primereact/dialog';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

import AppContext from '../../../AppContext'
import useFormFields from '../../useFormFields';
import dataProvider from '../../../service/DataProvider';

function ParameterList(props) {

  const {
    history,
    dispatch    
  } = props;

  const parameters_table = props.parametersTable || 'site';

  const { core } = useContext(AppContext);

  const toast = useRef(null);

  const [loading, setLoading] = useState(false);  
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState(null);
  const [displayFieldValue, setDisplayFieldValue] = useState(false);
  const [fieldValue, setFieldValue] = useState();

  const [searchParams, setSearchParams] = useState({
    filters: {},
    first: 0,
    rows: 20,
    page: 0,
    sortField: 'id',
    sortOrder: 1
  });

  const loaded = useRef(false);
  const dt = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!loaded.current && history.location?.state?.searchParams) {
      loaded.current = true;

      const _searchParams = {...history.location.state.searchParams};
      setSearchParams(_searchParams);
    } else {
      loadData();
    }
  }, [searchParams]);

  const newRecord = () => {
    const location = {
      pathname: `/settings/parameters/create`,
      state: { 
        from: history.location.pathname,
        previousSearchParams: {...searchParams}
      }
    }
    history.push(location);   
  }

  const editRecord = (record) => {
    const location = {
      pathname: `/settings/parameters/edit/${record.id}`,
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
        const provider = dataProvider(API_URL + '/api/v2/portal/settings');
        const params = {
          ids: selectedRecords.filter(v => !v.read_only).map(v => v.id)
        }
        provider.deleteMany(parameters_table, params).then(d => {
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
        const provider = dataProvider(API_URL + '/api/v2/portal/settings');
        const params = {
          id: record.id
        }      
        provider.delete(parameters_table, params).then(d => {
          toast.current.show({life: 3000, severity: 'success', summary: 'Eliminar Registo', detail: 'Registo eliminado com sucesso'});
          loadData();          
        }).catch(e => {
          toast.current.show({life: 3000, severity: 'error', summary: 'Eliminar Registo', detail: 'Ocorreu um erro ao eliminar o registo'}); 
        }).finally(() => {
          console.log('finally');
        });
      },
      reject: () =>  { }      
    });
  }  

  const exportCSV = () => {
    //dt.current.exportCSV();
  }

  const loadData = (filters) => {
    const provider = dataProvider(API_URL + '/api/v2/portal/settings');
  
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

    provider.getList(parameters_table, params).then(d => {
      setSelectedRecords(null);
      setRecords({ ...d, page: searchParams.page });
    }).catch(e => {
      toast.current.show({life: 3000, severity: 'error', summary: 'Pesquisa de Sistemas de Coordenadas', detail: 'Ocorreu um erro ao realizar a pesquisa'});
    }).finally(() => {
      setLoading(false);
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

  const onSelectionChange = (event) => {
    setSelectedRecords(event.value.filter(v => !v.read_only));
  }

  const keywordsTemplate = (rowData) => {
    return (
        <React.Fragment>
          { rowData.keywords && rowData.keywords.map( (item) => <Chip label={item} className="p-mr-2 p-mb-2" /> ) }
        </React.Fragment>
    );
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
      return null
      {/*
      return (
          <React.Fragment>              
              <Button label="Export" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} />
          </React.Fragment>
      )
      */}
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
    
  const valueBodyTemplate = (rowData) => {
    if ((rowData.setting_value || '') === '') return null;

    return <Button label="Ver" className="p-button-link"  onClick={() => { setFieldValue(rowData.setting_value); setDisplayFieldValue(true); }} />
  }

  return (
      <div className="p-grid p-fluid viewer-list">
          <Toast ref={toast} baseZIndex={2000} />
          <div>Parameters List</div>
          <div className="card">
            <Toolbar className="p-mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

            <DataTable ref={dt} value={records ? records.data : []} lazy
                selection={selectedRecords} onSelectionChange={onSelectionChange}
                paginator first={searchParams.first} rows={searchParams.rows} totalRecords={records.total} onPage={onPage}
                onSort={onSort} sortField={searchParams.sortField} sortOrder={searchParams.sortOrder}
                filters={searchParams.filters} onFilter={onFilter} loading={loading}
                emptyMessage="Não foram encontrados registos." >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                <Column field="id" header="Id" sortable filter filterPlaceholder="Id" headerStyle={{ width: '6rem' }} />
                <Column field="code" header="Código" sortable filter filterPlaceholder="Código" style={{"wordBreak": "break-all"}} />
                <Column field="name" header="Nome" sortable filter filterPlaceholder="Nome" style={{"wordBreak": "break-all"}} />
                <Column field="notes" header="Descrição" sortable filter filterPlaceholder="Descrição" style={{"wordBreak": "break-all"}} />
                <Column header="Valor" body={valueBodyTemplate} headerStyle={{ width: '5rem' }} />
                <Column body={actionBodyTemplate} style={{"textAlign": "center"}} />
            </DataTable>
            <Dialog header="Valor" visible={displayFieldValue} style={{ width: '50vw' }} onHide={() => setDisplayFieldValue(false)}>
              <div dangerouslySetInnerHTML={{__html: fieldValue }} />
            </Dialog>
        </div>
      </div>
  );

}

export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(withRouter(ParameterList));