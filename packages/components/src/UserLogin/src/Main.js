import React, {  useRef, useState, useEffect } from 'react'
import { Dialog } from 'primereact/dialog'
import Cookies from 'universal-cookie'
import { Menu } from 'primereact/menu'

import LoginWidget from './LoginWidget'
import RegistrationWidget from './RegistrationWidget'
import componentMessages from './messages'


const cookies = new Cookies();
const appEntityNameAbrev = process.env.REACT_APP_ENTITY_NAME_ABREV || 'ScalarGIS';

export default function Main({ type, region, as, core, config, actions, record }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const [showLoginButton, setShowLoginButton] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const popupMenu = useRef();

  const { logout } = actions;

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);
  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;
  const isMobileSmall = wsize[0] <= 440;


  useEffect(() => {
    if (!core?.pubsub?.subscribe) return;

    const unsubscribeLogin = core.pubsub.subscribe(componentMessages.USERLOGIN_SHOW, data => {
      setShowRegistration(false);
      setShowLogin(true);
    });

    const unsubscribeRegistration = core.pubsub.subscribe(componentMessages.USERLOGIN_REGISTRATION, data => {
      setShowLogin(false);
      setShowRegistration(true);
    });

    return [unsubscribeLogin, unsubscribeRegistration]
  }, []);


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
    if (type != 'menu' && isMobileSmall) {
      userMenu.unshift({
          label: username,
          disabled: true,
          style: { wordBreak: 'break-all' }
        });
    }

    return (
      <React.Fragment>
        { type != 'menu' ?
          <span style={{ position: 'relative' }}>
            { showLoginButton ?
            <button className="p-link" onClick={e => setShowMenu(!showMenu)}>
              <span className="layout-topbar-item-text">{ !isMobileSmall ? username : '' }</span>
              <span className="layout-topbar-icon pi pi-user"/>
              {' '}{ !isMobileSmall ? username : '' }
            </button> : null }
          </span> :
          <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => setShowMenu(!showMenu)}>
            <span className="p-menuitem-icon pi pi-user"></span><span className="p-menuitem-text">{username}</span>
          </a>
        }
        <Menu 
          model={userMenu} 
          ref={el => popupMenu.current = el} id="user_menu"
          style={{ display: showMenu ? 'block' : 'none' }}
        />
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
    { type != 'menu' ?
      <button className="p-link" onClick={e => setShowLogin(true)} title={config.tooltip_login || ''}>
        <span className="layout-topbar-item-text">Utilizador</span>
        <span className="layout-topbar-icon pi pi-unlock"/>
      </button> :
      <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => setShowLogin(true)} title={config.tooltip_login || ''} >
        <span className="p-menuitem-icon pi pi-unlock"></span><span className="p-menuitem-text">Entrar</span>
      </a> }

      { showLogin &&
        showOnPortal(<Dialog
          header={record?.config_json?.header ? record?.config_json?.header : "Entrar - " + (appEntityNameAbrev || 'ScalarGIS')}
          visible={showLogin}
          style={{width: wsize[0] < 768 ? '90%' : '35vw' }} 
          modal
          closable={record?.config_json?.closable === false ? false : true}
          onHide={e => setShowLogin(false)}>
            <LoginWidget
              core={core}
              dispatch={dispatch}
              actions={actions}
              record={record}
              redirect={viewer?.name}
              onHide={() => {
                if (record?.config_json?.closable !== false) {
                  setShowLogin(false);
                }
              }}
              showRegistration={() => {
                if (record?.config_json?.actions?.registration) {
                  setShowLogin(false); 
                  setShowRegistration(false); 

                  core.pubsub.publish(record?.config_json?.actions?.registration, null);
                  return;
                }

                setShowLogin(false); 
                setShowRegistration(true);
              }}
            />
        </Dialog>)
      }

      { showRegistration && 
        showOnPortal(<Dialog
          header={record?.config_json?.header ? record?.config_json?.header : "Registo de Utilizador - " + (appEntityNameAbrev || 'ScalarGIS')}
          visible={showRegistration}
          style={{width: wsize[0] < 768 ? '90%' : '35vw' }} 
          modal 
          onHide={e => setShowRegistration(false)}>
            <RegistrationWidget
              core={core}
              dispatch={dispatch}
              actions={actions}
              viewer={viewer}
              record={record}
              redirect={viewer?.name}
              showLogin={() => { 
                setShowRegistration(false); 
                setShowLogin(true); 
              }}
            />
        </Dialog>)
      }
    </React.Fragment>

  );
}