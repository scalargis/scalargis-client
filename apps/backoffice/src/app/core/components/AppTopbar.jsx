import React, { useContext } from 'react';
import { NavLink } from 'react-router';
import { UnstyledButton } from '@mantine/core';
import AppContext from '../../AppContext';

export const AppTopbar = (props) => {
    const ctx = useContext(AppContext);
    const cfg = ctx?.core?.config?.config_json;

    return (
        <div className="layout-topbar clearfix">
            <UnstyledButton className="layout-menu-button" onClick={props.onToggleMenu} aria-label="Mostrar/ocultar menu">
                <span className="pi pi-bars" aria-hidden="true" />
            </UnstyledButton>
            <div className="layout-topbar-icons">
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/notifications/list" title="Notificações" aria-label="Notificações">
                    <span className="layout-topbar-item-text">Notificações</span>
                    <span className="layout-topbar-icon pi pi-inbox" aria-hidden="true" />
                    <span className="layout-topbar-badge">{cfg?.notifications?.total || 0}</span>
                </NavLink>
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/account" title="Conta" aria-label="Conta">
                    <span className="layout-topbar-item-text">Conta</span>
                    <span className="layout-topbar-icon pi pi-user" aria-hidden="true" />
                </NavLink>
            </div>
        </div>
    );
}
