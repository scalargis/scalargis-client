import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { Collapse, UnstyledButton } from '@mantine/core';

export const AppProfile = (props) => {

    const { core, dispatch } = props;
    const { logout } = core.actions;

    const auth = props.auth?.data || {};
    const { name, username } = auth;

    const cfg = core?.config?.config_json;

    const [expanded, setExpanded] = useState(false);

    return (
        <div className="layout-profile">
            <div className="mb-2">
                <i className="fas fa-user-circle" style={{fontSize: "3rem"}} aria-hidden="true"></i>
            </div>
            <UnstyledButton className="layout-profile-link" onClick={() => setExpanded(prevState => !prevState)} aria-expanded={expanded}>
                <span className="username">{name || username || ''}</span>
                <i className="pi pi-fw pi-cog" aria-hidden="true" />
            </UnstyledButton>
            <Collapse in={expanded}>
                <ul>
                    <li>
                        <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/account">
                            <i className="pi pi-fw pi-user" aria-hidden="true" /><span>Conta</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/notifications/list">
                            <i className="pi pi-fw pi-inbox" aria-hidden="true" /><span>Notificações</span><span className="menuitem-badge">{cfg?.notifications?.total || 0}</span>
                        </NavLink>
                    </li>
                    <li>
                        <UnstyledButton onClick={e => dispatch(logout())}>
                            <i className="pi pi-fw pi-power-off" aria-hidden="true" /><span>Sair</span>
                        </UnstyledButton>
                    </li>
                </ul>
            </Collapse>
        </div>
    );
}
