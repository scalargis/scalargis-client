import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';

import CoordinateSystemForm from './CoordinateSystemForm';

const toFormData = (record) => {
  if (!record) return null;
  const extent = record.config_json?.extent ? record.config_json.extent.split(' ') : null;
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    description: record.description,
    srid: record.config_json?.srid,
    label: record.config_json?.label,
    defs: record.config_json?.defs,
    minx: extent ? extent[0] : null,
    miny: extent ? extent[1] : null,
    maxx: extent ? extent[2] : null,
    maxy: extent ? extent[3] : null,
    precision: record.config_json?.precision
  };
};

function CoordinateSystemEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/settings/coordinate_systems');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/portal/lists').getOne('coordinate_systems', { id: key }).then(d => toFormData(d.data))
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <CoordinateSystemForm data={record} />}
    </RecordView>
  );

}

export default connect(state => ({}))(CoordinateSystemEdit);
