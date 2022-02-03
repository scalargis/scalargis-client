import React, {Component} from 'react';
import PropTypes from 'prop-types';
import TopButtonAuth from './TopButtonAuth';
import TopButtonHelp from './TopButtonHelp';
import TopButtonContact from './TopButtonContact';
import SaveViewerWidget from './SaveViewerWidget';
import ShareViewerWidget from './ShareViewerWidget';

export class AppTopbar extends Component {

    static defaultProps = {
        onToggleMenu: null,
        logo: null,
        regionComponents: null
    }

    static propTypes = {
        onToggleMenu: PropTypes.func.isRequired
    }

    render() {
        return (
            <div className="layout-topbar clearfix">
                <button className="p-link layout-menu-button" onClick={this.props.onToggleMenu}>
                    <span className="pi pi-bars"/>
                </button>
                {this.props.logo}
                <div className="layout-topbar-icons topbar-right">
                    {this.props.regionComponents}
                    <ShareViewerWidget />
                    <SaveViewerWidget />
                    <TopButtonAuth />
                    <TopButtonContact />
                    <TopButtonHelp />
                </div>
            </div>
        );
    }
}