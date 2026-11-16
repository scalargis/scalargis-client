import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';

import GroupForm from './GroupForm';

function GroupEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/security/groups');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/security').getOne('groups', { id: key }).then(d => d.data)
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <GroupForm data={record} />}
    </RecordView>
  );

}

export default connect(state => ({}))(GroupEdit);
