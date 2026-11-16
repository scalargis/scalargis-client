import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';

import ViewerForm from './ViewerForm';

function ViewerEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/viewers');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/portal').getOne('viewers', { id: key }).then(d => d.data)
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <ViewerForm data={record} onReload={state.reload} />}
    </RecordView>
  );

}

export default connect()(ViewerEdit);
