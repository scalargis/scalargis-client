import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import NotificationForm from './NotificationForm';

function NotificationEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null);

  const toast = useRef(null);

  const API_URL = core.API_URL;

  useEffect(() => {
    if (id) {
      loadData();
    } else {
      setRecord({});
    }
  }, []);

  const loadData = () => {
    const provider = dataProvider(API_URL + '/portal');

    const params = {
      id: id
    }

    setLoading(true);  

    provider.getOne('notifications', params).then(d => {
      setRecord(d.data);
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(true);
      //toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Visualizadores', detail: 'Ocorreu um erro na pesquisa de intervenções'});
    });
  }  

  return (
    <React.Fragment>
    { record ?
      <NotificationForm data={record} />
      :
      ( error ?
        <NotificationForm data={null} />
        :
        <div>loading...</div>
      )
    }
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading }))(NotificationEdit);