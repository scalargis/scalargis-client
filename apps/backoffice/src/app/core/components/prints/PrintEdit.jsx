import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';
import { scalesToArray } from '../common/utils';

import PrintForm from './PrintForm';

function PrintEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/prints');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/portal').getOne('prints', { id: key }).then(d => scalesToArray(d.data))
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <PrintForm data={record} coordinateSystems={props?.backoffice?.config_json?.coordinate_systems || []} />}
    </RecordView>
  );

}

export default connect(state => ({ backoffice: state.backoffice }))(PrintEdit);
