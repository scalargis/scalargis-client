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

import ViewerForm from './ViewerForm';

function ViewerEdit(props) {

  const {
    history,
    dispatch
  } = props;

  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [roles, setRoles] = useState([]);

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
    const provider = dataProvider(API_URL + '/api/v2/portal');

    const params = {
      id: id
    }

    setLoading(true);  

    provider.getOne('viewers', params).then(d => {
      setRecord(d.data);
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      //toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Visualizadores', detail: 'Ocorreu um erro na pesquisa de intervenções'});
    });
  }  

  return (
    <React.Fragment>
    { record ?
      <ViewerForm data={record} />
      :
      <div>loading...</div>
    }
    </React.Fragment>
  );

}

//export default ViewerEdit;
export default connect(state => ({ loading: state.loading }))(withRouter(ViewerEdit));
//export default connect(state => ({...state}))(ViewerEdit);
//export default connect(state => ({ loading: state.loading, auth: state.auth }))(ViewerEdit);
//export default connect(state => ({ loading: state.loading, auth: state.auth }))(withRouter(ViewerEdit));