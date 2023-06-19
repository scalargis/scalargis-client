import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';


function ViewersList(props) {

  const { core } = useContext(AppContext);
  
  const [visible, setVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedShared, setSelectedShared] = useState(null);

  const [totalRecords, setTotalRecords] = useState(0);
  const [records, setRecords] = useState(null);
  const [lazyParams, setLazyParams] = useState({
      first: 0,
      rows: 10,
      page: 0,
  });

  const dt = useRef(null);

  const toast = useRef(null);

  const API_URL = core.API_URL;

  //Filter Options
  const statuses = [
    'Ativo', 'Inativo'
  ];

  //Filter Options
  const sharedOptions = [
    'Principal', 'Partilha'
  ];  


  useEffect(() => {
      if (!visible) return;

      loadLazyData();
  },[lazyParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLazyData = () => {
      setLoading(true);

      const provider = dataProvider(API_URL + '/portal');
      
      const _filter = {};
      if (lazyParams.filters) {
        Object.entries(lazyParams.filters).forEach(([key, item]) => {
          _filter[key] = item.value;
        });
      }

      const params = {
        pagination: { page: lazyParams.page + 1, perPage: lazyParams.rows},
        sort: { field: lazyParams.sortField || 'id', order: lazyParams.sortOrder === -1 ? 'Desc' : 'Asc' },
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
    loadLazyData();
  }

  const onPage = (event) => {
      let _lazyParams = { ...lazyParams, ...event };
      setLazyParams(_lazyParams);
  }

  const onSort = (event) => {
      let _lazyParams = { ...lazyParams, ...event };
      setLazyParams(_lazyParams);
  }

  const onFilter = (event) => {
      let _lazyParams = { ...lazyParams, ...event };
      _lazyParams['first'] = 0;
      _lazyParams['page'] = 0;
      setLazyParams(_lazyParams);
  }

  const onStatusChange = (e) => {
    let val;

    if (e.value === 'Ativo') val = true;
    if (e.value === 'Inativo') val = false;
    
    dt.current.filter(val, 'is_active', 'equals');
    setSelectedStatus(e.value);
  }

  const onSharedChange = (e) => {
    let val;

    if (e.value === 'Partilha') val = true;
    if (e.value === 'Principal') val = false;
    
    dt.current.filter(val, 'is_shared', 'equals');
    setSelectedShared(e.value);
  }

  
  const onHide = (event) => {
    setVisible(false);
    setLazyParams({
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

  const sharedItemTemplate = (option) => {
    return <span className={`customer-badge status-${option}`}>{option}</span>;
  }

  const statusItemTemplate = (option) => {
    return <span className={`customer-badge status-${option}`}>{option}</span>;
  }

  const statusFilter = <Dropdown value={selectedStatus} options={statuses} onChange={onStatusChange} itemTemplate={statusItemTemplate} placeholder="" className="p-column-filter" showClear />;
  
  const sharedFilter = <Dropdown value={selectedShared} options={sharedOptions} onChange={onSharedChange} itemTemplate={sharedItemTemplate} placeholder="" className="p-column-filter" showClear />;

  return (
    <React.Fragment>
      <Toast ref={toast} />

      <Button icon="pi pi-bars" className="p-button-rounded p-button-outlined"
        onClick={(e) => { onButtonClick(e); }} loading={loading}></Button>

      <Dialog header={props.header || ''} visible={visible}
        breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '75vw'}}
        modal onHide={onHide}>
        <DataTable ref={dt} header={renderHeader()} value={records} lazy paginator
            first={lazyParams.first} rows={10} totalRecords={totalRecords} onPage={onPage}
            onSort={onSort} sortField={lazyParams.sortField} sortOrder={lazyParams.sortOrder}
            onFilter={onFilter} filters={lazyParams.filters} loading={loading}
            emptyMessage="Não foram encontrados registos"
            className="data-table-filter-sized">
          <Column field="id" header="Id" sortable filter filterPlaceholder="Id" 
            bodyStyle={{"wordBreak": "break-word"}} style={{width: '100px'}} />
          <Column field="name" header="Nome" sortable filter filterPlaceholder="Nome" bodyStyle={{"wordBreak": "break-word"}} />
          <Column field="title" header="Título" filter filterPlaceholder="Título" sortable bodyStyle={{"wordBreak": "break-word"}} />
          <Column field="is_active" header="Ativo" body={isActiveTemplate} filter filterElement={statusFilter} style={{width: '140px'}} className="p-text-center" />
          <Column field="is_shared" header="Tipo" body={isSharedTemplate} filter filterElement={sharedFilter} style={{width: '150px'}} className="p-text-center" />
        </DataTable>
      </Dialog>
    </React.Fragment>
  )
}

export default connect(state => ({}))(withRouter(ViewersList));
