import React, {Component} from 'react';
import PropTypes from 'prop-types';

export class AppTopbarEmbedded extends Component {

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
            </div>
        );
    }
}