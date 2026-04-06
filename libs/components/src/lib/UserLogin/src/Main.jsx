import React, {  useRef, useState, useEffect } from 'react'
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';

import { i18n as i18nUtils } from '@scalargis/components';

import LoginWidget from './LoginWidget';
import RegistrationWidget from './RegistrationWidget';
import ResetPasswordWidget from './ResetPasswordWidget';
import componentMessages from './messages';


const appEntityNameAbrev = import.meta.env.VITE_APP_ENTITY_NAME_ABREV || 'ScalarGIS';

function Main({ type, region, as, auth, core, config, actions, record }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { siteConfig } = core;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const [showLoginButton, setShowLoginButton] = useState(true);

 const [mode, setMode] = useState();

  const [showMenu, setShowMenu] = useState(false);
  const popupMenu = useRef();

  const { logout } = actions;

  const location = useLocation();

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;
  const isMobileSmall = wsize[0] <= 440;

  const loginHeader = record?.config_json?.header ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("login", "Entrar")} - ${appEntityNameAbrev || "ScalarGIS"}`;
  const registrationHeader = record?.config_json?.header_registration ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("userRegistration", "Registo de utilizador")} - ${appEntityNameAbrev || "ScalarGIS"}`;
  const passwordHeader = record?.config_json?.header_password ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("passwordReset", "Redefinir password")} - ${appEntityNameAbrev || "ScalarGIS"}`;


  let CompLoginWidget = LoginWidget;
  let CompRegistrationWidget = RegistrationWidget;
  let CompResetPasswordWidget = ResetPasswordWidget;

  if (record?.config_json?.widgets?.login || siteConfig?.authentication?.widgets?.login) {
      CompLoginWidget = core.getComponentWidget(record?.config_json?.widgets?.login || siteConfig?.authentication?.widgets?.login)
  }
  if (record?.config_json?.widgets?.registration || siteConfig?.authentication?.widgets?.registration) { 
      CompRegistrationWidget = core.getComponentWidget(record?.config_json?.widgets?.registration || siteConfig?.authentication?.widgets?.registration)
  }
  if (record?.config_json?.widgets?.password || siteConfig?.authentication?.widgets?.password) { 
      CompResetPasswordWidget = core.getComponentWidget(record?.config_json?.widgets?.password || siteConfig?.authentication?.widgets?.password)
  }

  useEffect(() => {
    if (!core?.pubsub?.subscribe) return;

    const unsubscribeLogin = core.pubsub.subscribe(componentMessages.USERLOGIN_SHOW, data => setMode(1));

    const unsubscribeRegistration = core.pubsub.subscribe(componentMessages.USERLOGIN_REGISTRATION, data => setMode(2));

    return () => {
      unsubscribeLogin && unsubscribeLogin();
      unsubscribeRegistration && unsubscribeRegistration();
    }
  }, []);


  useEffect(() => {
    //Hide login button if viewer only has anonymous access
    if (config && config.roles && config.roles.length === 1 && config.roles[0].name === 'Anonymous') {
      setShowLoginButton(false);
    }
  }, [config]);

  // Render user
  if (auth?.data?.token) {
    const { username } = auth.data;
    const userMenu = [
      {
        label: i18nUtils.translateValue("endSession", "Terminar sessão"),
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
          <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => {e.preventDefault(); setShowMenu(!showMenu);}}>
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
      <button className="p-link" onClick={e => setMode(1)} title={config.tooltip_login || ''}>
        <span className="layout-topbar-item-text">{i18nUtils.translateValue("user", "Utilizador")}</span>
        <span className="layout-topbar-icon pi pi-unlock"/>
      </button> :
      <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => {e.preventDefault(); setMode(1)}} title={config.tooltip_login || ''} >
        <span className="p-menuitem-icon pi pi-unlock"></span><span className="p-menuitem-text">{i18nUtils.translateValue("login", "Entrar")}</span>
      </a> }

      { mode==1 &&
        showOnPortal(<Dialog
          header={loginHeader}
          visible={mode==1}
          style={{width: wsize[0] < 768 ? '90%' : '35vw' }} 
          modal
          closable={record?.config_json?.closable === false ? false : true}
          onHide={e => setMode(0)}>
            <CompLoginWidget
              auth={auth}
              core={core}
              dispatch={dispatch}
              actions={actions}
              record={record}
              redirect={location?.pathname || `/${viewer?.name}` }
              onHide={() => {
                if (record?.config_json?.closable !== false) {
                  setMode(0);
                }
              }}
              onShowRegistration={() => {
                if (record?.config_json?.actions?.registration) {
                  core.pubsub.publish(record?.config_json?.actions?.registration, null);
                  return;
                }
                setMode(2);
              }}
              onShowPasswordReset={() => {
               setMode(3);
              }}
            />
        </Dialog>)
      }

      { mode==2 && 
        showOnPortal(<Dialog
          header={registrationHeader}
          visible={mode==2}
          style={{width: wsize[0] < 768 ? '90%' : '35vw' }} 
          modal
          closable={record?.config_json?.closable === false ? false : true}
          onHide={e => {
            if (record?.config_json?.closable !== false) {
              setMode(0);
            }
          }}>
            <CompRegistrationWidget
              auth={auth}
              core={core}
              dispatch={dispatch}
              actions={actions}
              viewer={viewer}
              record={record}
              redirect={location?.pathname || `/${viewer?.name}`}
              onShowLogin={() => setMode(1)}
            />
        </Dialog>)
      }

      { mode==3 && 
        showOnPortal(<Dialog
          header={passwordHeader}
          visible={mode==3}
          style={{width: wsize[0] < 768 ? '90%' : '35vw' }} 
          modal
          closable={record?.config_json?.closable === false ? false : true}
          onHide={e => {
            if (record?.config_json?.closable !== false) {
              setMode(0);
            }
          }}>
            <CompResetPasswordWidget
              auth={auth}
              core={core}
              dispatch={dispatch}
              actions={actions}
              viewer={viewer}
              record={record}
              redirect={location?.pathname || `/${viewer?.name}`}
              onShowLogin={() => setMode(1)}
            />
        </Dialog>)
      }

    </React.Fragment>

  );
}

export default connect(state => ({ auth: state.root.auth }))(Main);