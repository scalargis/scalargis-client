import React, { useContext, useState, useEffect } from 'react';
import { connect } from 'react-redux';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import AccountForm from './AccountForm';
import { Box } from '@mantine/core';

function AccountEdit(props) {

  const { core } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState(null);

  const API_URL = core.API_URL;
  

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const provider = dataProvider(API_URL + '/security');

    setLoading(true);

    provider.get('account').then(d => {
      const data = {...d.data}
      data.auth_token_expire = data.auth_token && data.auth_token_expire ? new Date(data.auth_token_expire) : null;
      setRecord(data);      
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      console.log(e);
    });
  }  

  return (
    <React.Fragment>
      <Box p="xs"><h3>Conta</h3></Box>
      { record ?      
          <AccountForm data={record} />
        :
        <div>loading...</div>
      }
    </React.Fragment>
  );

}

//export default connect(state => ({}))(AccountEdit);
export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(AccountEdit);