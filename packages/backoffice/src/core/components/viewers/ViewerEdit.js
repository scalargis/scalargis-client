import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter, useParams } from 'react-router-dom';
import { BlockUI } from 'primereact/blockui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import ViewerForm from './ViewerForm';

function ViewerEdit(props) {

  const { core } = useContext(AppContext);

  const {
    history,
    dispatch
  } = props;

  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [roles, setRoles] = useState([]);

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

    provider.getOne('viewers', params).then(d => {
      setRecord(d.data);
      setIsLoading(false);
    }).catch(e => {
      setIsLoading(false);
      //toast.current.show({life: 5000, severity: 'error', summary: 'Pesquisa de Visualizadores', detail: 'Ocorreu um erro na pesquisa de intervenções'});
    });
  }  

  return (
    <React.Fragment>
      <BlockUI blocked={isLoading}
        template={<i className="p-blockui-loading-icon pi-spin pi pi-spinner"></i>} >
        { record ? <ViewerForm data={record} /> : <div /> }
      </BlockUI>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading }))(withRouter(ViewerEdit));