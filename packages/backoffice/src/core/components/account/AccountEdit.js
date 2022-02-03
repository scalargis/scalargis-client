import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { withRouter, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Chips} from 'primereact/chips';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

import AppContext from '../../../AppContext';
import useFormFields from '../../useFormFields';
import dataProvider from '../../../service/DataProvider';

import AccountForm from './AccountForm';

function AccountEdit(props) {

  const {
    history,
    dispatch
  } = props;

  const parameters_table = props.parametersTable || 'site';

  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);

  const toast = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (id) {
      loadData();
    } else {
      setRecord({});
    }
  }, []);

  const loadData = () => {
    const provider = dataProvider(API_URL + '/api/v2/security');

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
        <AccountForm data={record} />
      :
      <div>loading...</div>
    }
    </React.Fragment>
  );

}

export default connect(state => ({}))(withRouter(AccountEdit));
//export default ParameterEdit;
//export default connect(state => ({}))(ParameterEdit);
//export default connect(state => ({...state}))(ParameterEdit);
//export default connect(state => ({ loading: state.loading, auth: state.auth }))(ParameterEdit);
//export default connect(state => ({ loading: state.loading, auth: state.auth }))(withRouter(ParameterEdit));