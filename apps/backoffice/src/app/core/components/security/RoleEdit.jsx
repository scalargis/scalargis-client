import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';

import RoleForm from './RoleForm';

function RoleEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/security/roles');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/security').getOne('roles', { id: key }).then(d => d.data)
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <RoleForm data={record} />}
    </RecordView>
  );

}

export default connect(state => ({}))(RoleEdit);
