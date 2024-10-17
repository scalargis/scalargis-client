import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Chips} from 'primereact/chips';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import PrintGroupForm from './PrintGroupForm';


function PrintGroupEdit(props) {

  const { core } = useContext(AppContext);

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const {
    dispatch,
    backoffice
  } = props;

  const history = {
    location,
    navigate
  }

  const { id } = useParams();

  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);
  const [roles, setRoles] = useState([]);

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

    provider.getOne('prints/groups', params).then(d => {
      //Change restrict_scales_list from string to array
      const tmp_data = d.data;
      if (tmp_data.restrict_scales_list && ((typeof tmp_data.restrict_scales_list === 'string' || tmp_data.restrict_scales_list instanceof String))) {
        tmp_data.restrict_scales_list = tmp_data.restrict_scales_list.split(',').map(s => parseInt(s));
      }
      setRecord(tmp_data);
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      //toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Visualizadores', detail: 'Ocorreu um erro na pesquisa de intervenções'});
    });
  }  

  return (
    <React.Fragment>
    { record ?
      <PrintGroupForm data={record} coordinateSystems={ props?.backoffice?.config_json ? props.backoffice.config_json.coordinate_systems || [] : []} />
      :
      <div>loading...</div>
    }
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, backoffice: state.backoffice }))(PrintGroupEdit);