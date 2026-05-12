import React, { useContext } from 'react';
import { NavLink } from 'react-router';
import { InputText } from 'primereact/inputtext';
import AppContext from '../../AppContext';

export const AppTopbar = (props) => {
    const ctx = useContext(AppContext);
    const cfg = ctx?.core?.config?.config_json;

    return (
        <div className="layout-topbar clearfix">
            <button type="button" className="p-link layout-menu-button" onClick={props.onToggleMenu}>
                <span className="pi pi-bars" />
            </button>
            <div className="layout-topbar-icons">
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to={'/notifications/list'} target={null}>
                    <button type="button" className="p-link" title="Notificações">
                        <span className="layout-topbar-item-text">Notificações</span>
                        <span className="layout-topbar-icon pi pi-inbox" />
                        <span className="layout-topbar-badge">{cfg?.notifications?.total || 0}</span>
                    </button>
                </NavLink>
                {/*
                <button type="button" className="p-link">
                    <span className="layout-topbar-item-text">Settings</span>
                    <span className="layout-topbar-icon pi pi-cog" />
                </button>
                <button type="button" className="p-link">
                    <span className="layout-topbar-item-text">User</span>
                    <span className="layout-topbar-icon pi pi-user" />
                </button>
                */}
                <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to={'/account'} target={null}>
                    <button type="button" className="p-link" title="Conta">
                        <span className="layout-topbar-item-text">Conta</span>
                        <span className="layout-topbar-icon pi pi-user" />
                    </button>
                </NavLink>
            </div>
        </div>
    );
}
