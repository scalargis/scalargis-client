import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';

export const AppProfile = (props) => {

    const { core, dispatch } = props;
    const { logout } = core.actions;

    const auth = props.auth?.data || {};
    const { name, username, email } = auth;

    const cfg = core?.config?.config_json;

    const [expanded, setExpanded] = useState(false);

    const onClick = (event) => {
        setExpanded(prevState => !prevState);
        event.preventDefault();
    }

    return (
        <div className="layout-profile">
            <div className="p-mb-2">
                <i className="fas fa-user-circle" style={{fontSize: "3rem"}}></i>                
            </div>
            <button className="p-link layout-profile-link" onClick={onClick}>
                <span className="username">{name || username || ''}</span>
                <i className="pi pi-fw pi-cog" />
            </button>
            <CSSTransition classNames="p-toggleable-content" timeout={{ enter: 1000, exit: 450 }} in={expanded} unmountOnExit>
                <ul className={classNames({ 'layout-profile-expanded': expanded })}>
                    <li>
                        <NavLink activeClassName="active-route" to={'/account'} exact target={null}>
                            <button type="button" className="p-link"><i className="pi pi-fw pi-user" /><span>Conta</span></button>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink activeClassName="active-route" to={'/notifications/list'} exact target={null}>
                            <button type="button" className="p-link"><i className="pi pi-fw pi-inbox" /><span>Notificações</span><span className="menuitem-badge">{cfg?.notifications?.total || 0}</span></button>
                        </NavLink>
                    </li>
                    <li><button type="button" className="p-link" onClick={e => dispatch(logout())}><i className="pi pi-fw pi-power-off" /><span>Sair</span></button></li>
                </ul>
            </CSSTransition>
        </div>
    );
}