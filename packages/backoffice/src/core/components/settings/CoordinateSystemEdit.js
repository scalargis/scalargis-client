import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import CoordinateSystemForm from './CoordinateSystemForm';

function CoordinateSystemEdit(props) {

  const { core } = useContext(AppContext);

  const {
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
    const provider = dataProvider(API_URL + '/portal/lists');

    const params = {
      id: id
    }

    setLoading(true);    

    provider.getOne('coordinate_systems', params).then(d => {
      const data = {
        id: d.data?.id,
        code: d.data?.code,
        name: d.data?.name,
        description: d.data?.description,
        srid: d.data?.config_json?.srid,
        label: d.data?.config_json?.label,
        defs: d.data?.config_json?.defs,
        minx: d.data?.config_json?.extent ? d.data?.config_json?.extent.split(' ')[0] : null,
        miny: d.data?.config_json?.extent ? d.data?.config_json?.extent.split(' ')[1] : null,
        maxx: d.data?.config_json?.extent ? d.data?.config_json?.extent.split(' ')[2] : null,
        maxy: d.data?.config_json?.extent ? d.data?.config_json?.extent.split(' ')[3] : null,
        precision: d.data?.config_json?.precision
      }
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
        <CoordinateSystemForm data={record} />
      :
      <div>loading...</div>
    }
    </React.Fragment>
  );

}

export default connect(state => ({}))(CoordinateSystemEdit);