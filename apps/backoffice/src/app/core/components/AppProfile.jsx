import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { Box, Collapse, UnstyledButton } from '@mantine/core';
import { IconCog, IconUser, IconInbox, IconPowerOff } from '@scalargis/ui';

export const AppProfile = (props) => {

    const { core, dispatch } = props;
    const { logout } = core.actions;

    const auth = props.auth?.data || {};
    const { name, username } = auth;

    const cfg = core?.config?.config_json;

    const [expanded, setExpanded] = useState(false);

    return (
        <div className="layout-profile">
            <Box mb="xs">
                <i className="fas fa-user-circle" style={{fontSize: "3rem"}} aria-hidden="true"></i>
            </Box>
            <UnstyledButton className="layout-profile-link" onClick={() => setExpanded(prevState => !prevState)} aria-expanded={expanded}>
                <span className="username">{name || username || ''}</span>
                <IconCog fixedWidth />
            </UnstyledButton>
            <Collapse expanded={expanded}>
                <ul>
                    <li>
                        <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/account">
                            <IconUser fixedWidth /><span>Conta</span>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink className={({ isActive }) => isActive ? 'active-route' : undefined} to="/notifications/list">
                            <IconInbox fixedWidth /><span>Notificações</span><span className="menuitem-badge">{cfg?.notifications?.total || 0}</span>
                        </NavLink>
                    </li>
                    <li>
                        <UnstyledButton onClick={e => dispatch(logout())}>
                            <IconPowerOff fixedWidth /><span>Sair</span>
                        </UnstyledButton>
                    </li>
                </ul>
            </Collapse>
        </div>
    );
}
