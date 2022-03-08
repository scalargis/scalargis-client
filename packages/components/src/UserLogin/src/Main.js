import React, {  useRef, useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import Cookies from 'universal-cookie'
import { Menu } from 'primereact/menu'
import LoginWidget from './LoginWidget'

const cookies = new Cookies();
const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'scalargis';
const appEntityNameAbrev = process.env.REACT_APP_ENTITY_NAME_ABREV || 'WKT-SI';
//let popupMenu;

export default function Main({ region, as, config, actions, record }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils

  const [showLoginButton, setShowLoginButton] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const popupMenu = useRef();

  const { logout } = actions;

  const cookieData = cookies.get(cookieAuthName);
  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;
  const isMobileSmall = wsize[0] <= 440;

  useEffect(() => {
    //Hide login button if viewer only has anonymous access
    if (config && config.roles && config.roles.length === 1 && config.roles[0].name === 'Anonymous') {
      setShowLoginButton(false);
    }
  }, [config]);

  // Render user
  if (cookieData) {
    const { username } = cookieData;
    const userMenu = [
      {
        label: 'Terminar Sessão',
        icon: 'pi pi-lock',
        command: () => {
          dispatch(logout())  
        }
      }
    ]
    if (isMobileSmall) {
      userMenu.unshift({
          label: username,
          disabled: true,
          style: { wordBreak: 'break-all' }
        });
    }
    return (
      <span style={{ position: 'relative' }}>
        { showLoginButton ?
        <button className="p-link" onClick={e => setShowMenu(!showMenu)}>
          <span className="layout-topbar-item-text">{ !isMobileSmall ? username : '' }</span>
          <span className="layout-topbar-icon pi pi-user"/>
          {' '}{ !isMobileSmall ? username : '' }
        </button> : null }
        <Menu 
          model={userMenu} 
          ref={el => popupMenu.current = el} id="user_menu"
          style={{ display: showMenu ? 'block' : 'none' }}
        />
      </span>
    )
  }

  if (showLogin) {
    return (
      <Dialog
        header={"Entrar - " + (appEntityNameAbrev || 'WKT-SI')}
        visible={showLogin}
        style={{width: wsize[0] < 768 ? '90%' : '35vw' }} 
        modal 
        onHide={e => setShowLogin(false)}>
          <LoginWidget 
            dispatch={dispatch}
            actions={actions} 
            />
      </Dialog>
    )
  }

  if (showLoginButton) {
    // Render login button
    return (
      true ? <button className="p-link" onClick={e => setShowLogin(true)}>
          <span className="layout-topbar-item-text">Utilizador</span>
          <span className="layout-topbar-icon pi pi-unlock"/>
      </button> : null
    )
  } else {
    return null;
  }
}