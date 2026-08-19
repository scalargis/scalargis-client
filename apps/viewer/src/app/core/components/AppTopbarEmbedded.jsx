import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { UnstyledButton } from '@mantine/core';
import { IconMenu } from '@scalargis/ui';

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
                    <IconMenu style={{"fontSize": "2em"}}/>
                </UnstyledButton>
                {this.props.logo}
            </div>
        );
    }
}