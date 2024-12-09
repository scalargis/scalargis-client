import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import RoleForm from './RoleForm';

function RoleEdit(props) {

  const { core } = useContext(AppContext);

  const {
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

    provider.getOne('roles', params).then(d => {
      const data = {...d.data}
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
        <RoleForm data={record} />
      :
      <div>loading...</div>
    }
    </React.Fragment>
  );

}

export default connect(state => ({}))(RoleEdit);