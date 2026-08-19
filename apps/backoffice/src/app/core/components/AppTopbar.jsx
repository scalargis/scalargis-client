import React, { useContext } from 'react';
import { NavLink } from 'react-router';
import { UnstyledButton } from '@mantine/core';
import { IconMenu, IconInbox, IconUser } from '@scalargis/ui';
import AppContext from '../../AppContext';

export const AppTopbar = (props) => {
    const ctx = useContext(AppContext);
    const cfg = ctx?.core?.config?.config_json;

    return (
        <div className="layout-topbar clearfix">
            <UnstyledButton className="layout-menu-button" onClick={props.onToggleMenu} aria-label="Mostrar/ocultar menu">
                <IconMenu />
            </UnstyledButton>
            <div className="layout-topbar-icons">
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/notifications/list" title="Notificações" aria-label="Notificações">
                    <span className="layout-topbar-item-text">Notificações</span>
                    <IconInbox className="layout-topbar-icon" />
                    <span className="layout-topbar-badge">{cfg?.notifications?.total || 0}</span>
                </NavLink>
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/account" title="Conta" aria-label="Conta">
                    <span className="layout-topbar-item-text">Conta</span>
                    <IconUser className="layout-topbar-icon" />
                </NavLink>
            </div>
        </div>
    );
}
