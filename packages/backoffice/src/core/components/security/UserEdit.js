import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter, useParams } from 'react-router-dom';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import UserForm from './UserForm';

function UserEdit(props) {

  const { core } = useContext(AppContext);

  const {
    history,
    dispatch
  } = props;

  const { id } = useParams();

  const [loading, setLoading] = useState(false);
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
    const provider = dataProvider(API_URL + '/security');

    const params = {
      id: id
    }

    setLoading(true);    

    provider.getOne('users', params).then(d => {
      const data = {...d.data}
      data.auth_token_expire = data.auth_token && data.auth_token_expire ? new Date(data.auth_token_expire) : null;
      setRecord(data);      
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      console.log(e);
      //toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Visualizadores', detail: 'Ocorreu um erro na pesquisa de intervenções'});
    });
  }  

  return (
    <React.Fragment>
    { record ?      
        <UserForm data={record} />
      :
      <div>loading...</div>
    }
    </React.Fragment>
  );

}

export default connect(state => ({}))(withRouter(UserEdit));