import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';

import NotificationForm from './NotificationForm';

function NotificationEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/notifications');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/portal').getOne('notifications', { id: key }).then(d => d.data)
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <NotificationForm data={record} />}
    </RecordView>
  );

}

export default connect()(NotificationEdit);
