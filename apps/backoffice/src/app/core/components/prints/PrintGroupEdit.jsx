import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';
import { scalesToArray } from '../common/utils';

import PrintGroupForm from './PrintGroupForm';

function PrintGroupEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/prints/groups');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/portal').getOne('prints/groups', { id: key }).then(d => scalesToArray(d.data))
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <PrintGroupForm data={record} coordinateSystems={props?.backoffice?.config_json?.coordinate_systems || []} />}
    </RecordView>
  );

}

export default connect(state => ({ backoffice: state.backoffice }))(PrintGroupEdit);
