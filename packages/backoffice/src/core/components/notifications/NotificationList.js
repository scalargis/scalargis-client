import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';


const initialSearchParams = {
  filters: {"status": [0]},
  first: 0,
  rows: 20,
  page: 0,
  sortField: 'id',
  sortOrder: 1
};

const status = [
  {
    value: 0,
    name: 'Por abrir'
  },
  {
    value: 1,
    name: 'Lida'
  },
  {
    value: 2,
    name: 'Encerrado'
  }
];

function NotificationList(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const toast = useRef(null);

  const [viewersOptions,  setViewersOptions] = useState([]);
  const [loading, setLoading] = useState(false);  
  const [records, setRecords] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState(null);

  const [filter, setFilter] = useState(props.filter || {"status": [0]});
  const [searchParams, setSearchParams] = useState({...initialSearchParams});

  const dt = useRef(null);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue, reset } = useForm({
    defaultValues: {...filter}
  });

  const watchAllFields = watch();

  useEffect(() => {
    Promise.all([
      dataProvider(API_URL + '/portal').getSimpleList('notifications/viewers/list', {}).catch((error) => error)
    ]).then((result) => {      
      setViewersOptions(result[0].data || []);
    }).catch((error) => {
      console.log(error)
    }); 
  }, []);

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const editRecord = (record) => {
    /*
    const location = {
      pathname: `/notifications/edit/${record.id}`,
      state: { 
        from: location.pathname,
        previousSearchParams: {...searchParams}
      }
    }
    history.push(location);
    */
    const state = { 
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate(`/notifications/edit/${record.id}`, { state });
  }

  const exportCSV = () => {
    dt.current.exportCSV();
  }

  const exportFunction = (e) => {
    if (e.field === 'status') {
      return e.data.label;
    } else if (e.field === 'author') {
      return (e.data.name + (e.data.email ? ` (${e.data.email})` : ''));
    } else {
      return e.data;
    }
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
        if (key && item) _filter[key] = item;
      });
    }

    const params = {
      pagination: { page: searchParams.page + 1, perPage: searchParams.rows},
      sort: { field: searchParams.sortField, order: searchParams.sortOrder === -1 ? 'Desc' : 'Asc' },
      filter: _filter
    }

    setLoading(true);

    provider.getList('notifications', params).then(d => {
      setSelectedRecords(null);
      const data = d.data.map(x => {return {...x, author:{name: x.name, email: x.email}}});
      setRecords({ ...d, data, page: searchParams.page });
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      if (toast?.current?.show) {
        toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Notificações', detail: 'Ocorreu um erro na pesquisa'});
      }
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

  const onFilterSubmit = (formData) => {
    let _searchParams = { ...searchParams };
    _searchParams.filters = {...formData};
    setSearchParams(_searchParams);
  }

  const onFilterClear = (e) => {
    setValue('id', null);
    setValue('author', null);
    setValue('viewer', null);
    setValue('start_date', null);
    setValue('end_date', null);
    setValue('message', null);
    setValue('status', null);
    
    let _searchParams = { ...searchParams };
    _searchParams['filters'] = {};
    _searchParams['first'] = 0;
    setSearchParams(_searchParams);
  }  

  const filterViewersFooterTemplate = () => {
    const selectedItems = watchAllFields.viewer;
    const length = selectedItems ? selectedItems.length : 0;
    return (
        <div className="p-py-2 p-px-3">
            <b>{length}</b> selecionado{length > 1 ? 's' : ''}
        </div>
    );
  }  

  const viewerTemplate = (rowData) => {
    return rowData.viewer ? <Chip label={rowData.viewer} /> : null;
  }

  const messageTemplate = (rowData) => {
    const message = rowData.message || '';
    return message.length > 50 ? `${message.slice(0, 50)}...` : message;
  }

  const authorTemplate = (rowData) => {
    return (<>
        {rowData.name && <span>{rowData.name}</span>}
        {rowData.name && rowData.email ? <br /> : null}
        {rowData.email && <span style={{color: '#707070', fontSize: '.9rem'}}>{rowData.email}</span>}
      </>)
  }  

  const statusTemplate = (rowData) => {
    const status = rowData.status || {}

    if (status.value === 0) {
      return <span className="badge badge-danger" title={`${status.label || 'Por abrir'}`}><i className="fas fa-envelope"></i></span>
    } else if (status.value === 1) {
      return <span className="badge badge-warning" title={`${status.label || 'Lida'} (${status.date})`}><i className="fas fa-envelope-open"></i></span>
    } else if (status.value === 2) {
      return <span className="badge badge-success" title={`${status.label || 'Encerrada'} (${status.date})`}><i className="fas fa-check"></i></span>
    }

    return null;    
  }

  const leftToolbarTemplate = () => {
    return (
        (records.total !== null) && <React.Fragment>              
            <span><b>Total:</b> {records.total}</span>
        </React.Fragment>
    )
  }

  const rightToolbarTemplate = () => {
      return (
          <React.Fragment>              
              <Button label="Exportar" icon="pi pi-upload" className="p-button-help" onClick={exportCSV} disabled={records?.total ? false : true } />
          </React.Fragment>
      )
  }

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment> 
        <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-button-secondary p-mr-2" title="Editar" onClick={() => editRecord(rowData)} />
      </React.Fragment>
    );
  }



  return (
    <React.Fragment>
      <div className="p-col-12"><h3>Notificações</h3></div>

      <div className="p-grid p-fluid notification-list">
          <Toast ref={toast} baseZIndex={2000} />
          <div className="card">
            <Accordion activeIndex={0}>
                <AccordionTab header="Filtro">
                  <form onSubmit={handleSubmit(onFilterSubmit)}>
                    <div className="p-fluid p-formgrid p-grid">
                      <div className="p-field p-col-12 p-md-1">
                          <label htmlFor="id">Id</label>
                          <InputText id="id" type="text" {...register('id')} />
                      </div>
                      <div className="p-field p-col-12 p-md-7">
                          <label htmlFor="viewer">Visualizador</label>
                          <Controller
                              control={control}
                              name="viewer"
                              render={({ field }) => {
                                return <MultiSelect 
                                optionLabel="name"
                                optionValue="id" 
                                value={field.value}
                                options={viewersOptions}
                                filter 
                                showClear
                                showSelectAll={false}
                                display="chip"
                                onChange={(e) => { field.onChange(e.target.value); }} 
                                panelFooterTemplate={filterViewersFooterTemplate}
                                className="filter-multiselect"
                                style={{ minHeight: '2.5rem', maxHeight: '2.5rem'}} />                                                        
                              }} 
                            />
                      </div>
                      <div className="p-field p-col-12 p-md-2">
                          <label htmlFor="start_date">Data envio (início)</label>
                          <Controller
                              control={control}
                              name="start_date"
                              render={({ field }) => {
                                return <Calendar value={field.value} 
                                onChange={(e) => {field.onChange(e.target.value)}}
                                dateFormat="dd/mm/yy" mask="99/99/9999" placeholder="dd/mm/aaaa"/>                                                                                       
                              }} 
                            />
                      </div>
                      <div className="p-field p-col-12 p-md-2">
                          <label htmlFor="end_date">Data envio (fim)</label>
                          <Controller
                              control={control}
                              name="end_date"
                              render={({ field }) => {
                                return <Calendar value={field.value} 
                                onChange={(e) => {field.onChange(e.target.value)}}
                                dateFormat="dd/mm/yy" mask="99/99/9999" placeholder="dd/mm/aaaa"/>                                                                                       
                              }} 
                            />
                      </div>                    
                      <div className="p-field p-col-12 p-md-4">
                          <label htmlFor="author">Autor</label>
                          <InputText id="author" type="text" {...register('author')} />
                      </div>
                      <div className="p-field p-col-12 p-md-4">
                          <label htmlFor="status">Mensagem</label>
                          <InputText id="message" type="text" {...register('message')} />
                      </div>                      
                      <div className="p-field p-col-12 p-md-4">
                          <label htmlFor="status">Estado</label>
                          <Controller
                              control={control}
                              name="status"
                              render={({ field }) => {
                                return <MultiSelect 
                                optionLabel="name" 
                                optionValue="value"
                                options={status}
                                value={field.value}                                 
                                showClear
                                showSelectAll={false}
                                display="chip" 
                                onChange={(e) => field.onChange(e.target.value)}
                                className="filter-multiselect"
                                style={{ minHeight: '2.5rem', maxHeight: '2.5rem'}} />                                                        
                              }} 
                            />
                      </div>                     
                    </div>
                    <div className="p-fluid p-formgrid p-grid p-justify-end">
                      <div className="p-field p-col-12 p-md-2">
                        <Button type="submit" label="Pesquisar" className="p-mr-2" />  
                      </div>                                  
                      <div className="p-field p-col-12 p-md-2">
                        <Button type="button" label="Limpar" className="p-button-secondary p-mr-2" onClick={onFilterClear} />
                      </div>                   
                    </div>
                    </form>
                </AccordionTab>
            </Accordion>

            <Toolbar className="p-mt-2" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

            <DataTable ref={dt} value={records ? records.data : []} lazy
                selectionMode="checkbox"
                selection={selectedRecords} onSelectionChange={(e) => setSelectedRecords(e.value)}
                paginator first={searchParams.first} rows={searchParams.rows} totalRecords={records.total} onPage={onPage}
                onSort={onSort} sortField={searchParams.sortField} sortOrder={searchParams.sortOrder}
                loading={loading} exportFunction={exportFunction} exportFilename="notificacoes"
                emptyMessage="Não foram encontradas notificações." >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                <Column field="id" header="Id" sortable headerStyle={{ width: '6rem' }} />
                <Column field="date" header="Data" sortable headerStyle={{ width: '8rem' }} />
                <Column field="viewer" header="Visualizador" sortable sortField='viewer' body={viewerTemplate} headerStyle={{ width: '9rem' }} style={{ textAlign: 'center'}} />
                <Column field="author" header="Autor" sortable sortField='name' body={authorTemplate} style={{"wordBreak": "break-all"}} />
                <Column field="message" header="Mensagem" body={messageTemplate} />
                <Column field="status" header="Estado" body={statusTemplate} headerStyle={{ width: '6rem' }} style={{ textAlign: 'center'}} />
                <Column body={actionBodyTemplate} headerStyle={{ width: '8rem' }} />
            </DataTable>             
        </div>
      </div>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, filters: state.filters }))(NotificationList);