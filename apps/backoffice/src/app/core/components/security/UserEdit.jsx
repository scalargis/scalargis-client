import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';

import UserForm from './UserForm';

function UserEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/security/users');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/security').getOne('users', { id: key }).then(d => d.data && {...d.data, auth_token_expire: d.data.auth_token && d.data.auth_token_expire ? new Date(d.data.auth_token_expire) : null})
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <UserForm data={record} />}
    </RecordView>
  );

}

export default connect(state => ({}))(UserEdit);
