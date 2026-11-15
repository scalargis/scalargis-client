import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router';
import { Box } from '@mantine/core';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord from '../common/useRecord';
import RecordView from '../common/RecordView';

import AccountForm from './AccountForm';

function AccountEdit(props) {

  const { core } = useContext(AppContext);

  const navigate = useNavigate();

  const state = useRecord('account', () =>
    dataProvider(core.API_URL + '/security').get('account').then(d => d.data && {...d.data, auth_token_expire: d.data.auth_token && d.data.auth_token_expire ? new Date(d.data.auth_token_expire) : null})
  );

  return (
    <React.Fragment>
      <Box p="xs"><h3>Conta</h3></Box>
      <RecordView state={state} onBack={() => navigate('/')}>
        {(record) => <AccountForm data={record} />}
      </RecordView>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(AccountEdit);
