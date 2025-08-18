import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { BlockUI } from 'primereact/blockui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import NotificationForm from './NotificationForm';

function NotificationEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [record, setRecord] = useState(null);

  const toast = useRef(null);

  const API_URL = core.API_URL;

  useEffect(() => {
    if (id) {
      loadData();
    } else {
      setIsLoading(false);
      setRecord({});
    }
  }, []);

  const loadData = () => {
    const provider = dataProvider(API_URL + '/portal');

    const params = {
      id: id
    }

    setIsLoading(true);  

    provider.getOne('notifications', params).then(d => {
      setRecord(d.data);
    }).catch(e => {
      console.error(e);
      //toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Visualizadores', detail: 'Ocorreu um erro na pesquisa de notificações'});
    }).finally(() => {
      setIsLoading(false);
    });
  }

  return (
    <React.Fragment>
      <BlockUI blocked={isLoading}
        template={<i className="p-blockui-loading-icon pi-spin pi pi-spinner"></i>} >
        { record ? <NotificationForm data={record} /> : <div /> }
      </BlockUI>
    </React.Fragment>
  );


}

export default connect(state => ({ loading: state.loading }))(NotificationEdit);