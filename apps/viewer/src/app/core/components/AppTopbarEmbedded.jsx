import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { UnstyledButton } from '@mantine/core';

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
                <UnstyledButton className="layout-menu-button" onClick={this.props.onToggleMenu} aria-label="Menu">
                    <span className="pi pi-bars"/>
                </UnstyledButton>
                {this.props.logo}
            </div>
        );
    }
}