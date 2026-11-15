import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useRecord, { useRecordNavigation } from '../common/useRecord';
import RecordView from '../common/RecordView';
import { scalesToArray } from '../common/utils';

import PrintElementForm from './PrintElementForm';

function PrintElementEdit(props) {

  const { core } = useContext(AppContext);

  const { id } = useParams();

  const { goBack } = useRecordNavigation('/prints/elements');

  const state = useRecord(id, (key) =>
    dataProvider(core.API_URL + '/portal').getOne('prints/elements', { id: key }).then(d => scalesToArray(d.data))
  );

  return (
    <RecordView state={state} onBack={goBack}>
      {(record) => <PrintElementForm data={record} />}
    </RecordView>
  );

}

export default connect()(PrintElementEdit);
