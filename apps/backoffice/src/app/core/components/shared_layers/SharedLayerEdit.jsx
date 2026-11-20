import React, { useContext } from 'react';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';

import SharedLayerForm from './SharedLayerForm';

function SharedLayerEdit() {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/shared-layers');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/portal').getOne('shared-layers', { id: key }).then(d => d.data)
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <SharedLayerForm data={record} onReload={state.reload} />}
    </RecordView>
  );

}

export default SharedLayerEdit;
