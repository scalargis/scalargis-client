import React, { useContext, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';
import { Box, LoadingOverlay } from '@mantine/core';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

import NotificationForm from './NotificationForm';

function NotificationEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(false);
  const [record, setRecord] = useState(null);

  const API_URL = core.API_URL;

  useEffect(() => {
    if (id) {
      loadData();
    } else {
      setIsLoading(false);
      setRecord({});
    }
  }, []);

  const loadData = () => {
    const provider = dataProvider(API_URL + '/portal');

    const params = {
      id: id
    }

    setIsLoading(true);

    provider.getOne('notifications', params).then(d => {
      setRecord(d.data);
    }).catch(e => {
      console.error(e);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} />
      { record ? <NotificationForm data={record} /> : <div /> }
    </Box>
  );


}

export default connect(state => ({ loading: state.loading }))(NotificationEdit);
