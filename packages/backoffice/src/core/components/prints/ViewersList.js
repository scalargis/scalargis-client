import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';


const initialSearchParams = {
  filters: undefined,
  first: 0,
  rows: 20,
  page: 0,
  sortField: 'id',
  sortOrder: 1
}


function ViewersList(props) {

  const { core } = useContext(AppContext);
  
  const [visible, setVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  const [totalRecords, setTotalRecords] = useState(0);
  const [records, setRecords] = useState(null);

  const [searchParams, setSearchParams] = useState({...initialSearchParams});

  const dt = useRef(null);

  const toast = useRef(null);

  const API_URL = core.API_URL;

  useEffect(() => {
      if (!visible) return;

      loadData();
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = () => {
      setLoading(true);

      const provider = dataProvider(API_URL + '/portal');
      
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
        sort: { field: searchParams.sortField || 'id', order: searchParams.sortOrder === -1 ? 'Desc' : 'Asc' },
        filter: _filter
      }
  
      provider.getList(`${props.elementType}/${props.id}/viewers`, params).then(d => {
        setTotalRecords(d.total);
        setRecords(d.data);
        setLoading(false);

        setVisible(true);
      }).catch(e => {
        setLoading(false);
        toast?.current && toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Plantas', detail: 'Ocorreu um erro na pesquisa'});
      });

  }

  const onButtonClick = (event) => {
    loadData();
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

  const onStatusChange = (e) => {
    dt.current.filter(e.value, 'is_active', 'equals');
  }

  const onSharedChange = (e) => {
    dt.current.filter(e.value, 'is_shared', 'equals');
  }

  const onHide = (event) => {
    setVisible(false);
    setSearchParams({
      filters: undefined,
      first: 0,
      rows: 10,
      page: 0,
    });
    setLoading(false);
    setTotalRecords(0);
    setRecords(null);
  }

  const renderHeader = () => {
    return (
        <div className="p-grid">
            <div className="p-col">Lista Visualizadores</div>
            <div className="p-col p-text-right">Total de registos: {totalRecords}</div>
        </div>
    );
  }

  const isActiveTemplate = (rowData) => {
    if (rowData.is_active === true) {
      return (
        <Badge value="Ativo" severity="success"></Badge>
      );
    }

    return (
      <Badge value="Inativo" severity="danger"></Badge>
    );
  }

  const isSharedTemplate = (rowData) => {
    if (rowData.is_shared === true) {
      return (
        <Badge value="Partilha" severity="warning"></Badge>
      );
    }

    return (
      <Badge value="Principal" severity="info"></Badge>
    );
  }

  const statusFilter = <Dropdown value={searchParams?.filters?.is_active?.value} options={[{label: 'Sim', value: true}, {label: 'Não', value: false}]} onChange={onStatusChange} placeholder="" className="p-column-filter" showClear />;
  const sharedFilter = <Dropdown value={searchParams?.filters?.is_shared?.value} options={[{label: 'Principal', value: false}, {label: 'Partilha', value: true}]} onChange={onSharedChange}  placeholder="" className="p-column-filter" showClear />;


  return (
    <React.Fragment>
      <Toast ref={toast} />

      <Button icon="pi pi-bars" className="p-button-rounded p-button-outlined"
        onClick={(e) => { onButtonClick(e); }} loading={loading}></Button>

      <Dialog header={props.header || ''} visible={visible}
        breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '75vw'}}
        modal onHide={onHide}>
        <DataTable ref={dt} header={renderHeader()} value={records} lazy paginator
            first={searchParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
            onSort={onSort} sortField={searchParams.sortField} sortOrder={searchParams.sortOrder}
            filterDisplay="row" onFilter={onFilter} filters={searchParams.filters} loading={loading}
            emptyMessage="Não foram encontrados registos"
            className="data-table-filter-sized">
          <Column field="id" header="Id" sortable filter filterPlaceholder="Id" showFilterMenu={false}
            bodyStyle={{"wordBreak": "break-word"}} style={{width: '100px'}} />
          <Column field="name" header="Nome" sortable filter filterPlaceholder="Nome" showFilterMenu={false} bodyStyle={{"wordBreak": "break-word"}} />
          <Column field="title" header="Título" filter filterPlaceholder="Título" showFilterMenu={false} sortable bodyStyle={{"wordBreak": "break-word"}} />
          <Column field="is_active" header="Ativo" body={isActiveTemplate} filter filterElement={statusFilter} showFilterMenu={false} style={{width: '140px'}} className="p-text-center" />
          <Column field="is_shared" header="Tipo" body={isSharedTemplate} filter filterElement={sharedFilter} showFilterMenu={false} style={{width: '150px'}} className="p-text-center" />
        </DataTable>
      </Dialog>
    </React.Fragment>
  )
}

export default connect(state => ({}))(ViewersList);
