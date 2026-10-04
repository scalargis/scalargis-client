import React, { useContext } from 'react';
import { connect } from 'react-redux';
import { Grid, Stack } from '@mantine/core';
import AppContext from "../../AppContext";

import ViewerVisitsChart from '../components/stats/ViewerVisitsChart';
import BasicStats from '../components/stats/BasicStats';
import { ContactList } from '../components/common/Contact';
import { isAdminOrManager } from '../utils';


function Dashboard(props) {

    const { backoffice } = props;
    const { core } = useContext(AppContext);

    const auth = core.store.getState().auth;
    const adminOrManager = isAdminOrManager(auth);

    let contacts = null;
    let stats = null;

    if (backoffice &&  backoffice.config_json) {
        if (backoffice.config_json.contacts) {
            contacts = backoffice.config_json.contacts;
        }
        if (backoffice.config_json.stats) {
            stats = backoffice.config_json.stats;
        }
    }

    return (
        <Stack gap="md" className="dashboard">
            { adminOrManager && <BasicStats core={core} /> }

            <Grid gap="md">
                <Grid.Col span={{ base: 12, sm: (contacts && contacts.length > 0) ? 9 : 12 }}>
                    <ViewerVisitsChart core={core} stats={stats} />
                </Grid.Col>

                { (contacts && contacts.length > 0) ?
                <Grid.Col span={{ base: 12, sm: 3 }} className="contacts">
                    <ContactList core={core} contacts={contacts} />
                </Grid.Col> : null }
            </Grid>
        </Stack>
    );
}

export default connect(state => ({ loading: state.loading, backoffice: state.backoffice }))(Dashboard);