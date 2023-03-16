import React, { useContext } from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
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
        <div className="p-grid p-fluid dashboard">
            
            { adminOrManager && <BasicStats core={core} /> }

            <div className={(contacts && contacts.length > 0)  ? "p-col-12 p-lg-9" : "p-col-12"}>
                <ViewerVisitsChart core={core} stats={stats} />
            </div>

            { (contacts && contacts.length > 0) ?
            <div className="p-col-12 p-lg-3 contacts">
                <ContactList core={core} contacts={contacts} />
            </div> : null }
        </div>
    );
}

export default connect(state => ({ loading: state.loading, backoffice: state.backoffice }))(withRouter(Dashboard));