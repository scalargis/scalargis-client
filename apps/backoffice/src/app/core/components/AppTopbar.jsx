import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router';
import { UnstyledButton } from '@mantine/core';
import { IconMenu, IconInbox, IconUser } from '@scalargis/ui';

export const AppTopbar = (props) => {
    const notificationsTotal = useSelector(state => state.backoffice?.config_json?.notifications?.total);

    return (
        <div className="layout-topbar clearfix">
            <UnstyledButton className="layout-menu-button" onClick={props.onToggleMenu} aria-label="Mostrar/ocultar menu">
                <IconMenu style={{ fontSize: '1.5em' }} />
            </UnstyledButton>
            <div className="layout-topbar-icons">
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/notifications/list" title="Notificações" aria-label="Notificações">
                    <span className="layout-topbar-item-text">Notificações</span>
                    <IconInbox className="layout-topbar-icon" style={{ fontSize: '1.5em' }} />
                    <span className="layout-topbar-badge">{notificationsTotal || 0}</span>
                </NavLink>
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/account" title="Conta" aria-label="Conta">
                    <span className="layout-topbar-item-text">Conta</span>
                    <IconUser className="layout-topbar-icon" style={{ fontSize: '1.5em' }} />
                </NavLink>
            </div>
        </div>
    );
}
