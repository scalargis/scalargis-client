import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter, useParams } from 'react-router-dom';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import PrintForm from './PrintForm';


function PrintEdit(props) {

  const { core } = useContext(AppContext);

  const {
    history,
    dispatch
  } = props;

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

    provider.getOne('prints', params).then(d => {
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
      <PrintForm data={record} coordinateSystems={ props?.backoffice?.config_json ? props.backoffice.config_json.coordinate_systems || [] : []} />
      :
      <div>loading...</div>
    }
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, backoffice: state.backoffice }))(withRouter(PrintEdit));