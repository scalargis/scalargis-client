import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux';
import { useLocation } from 'react-router';

import { Menu, Modal, UnstyledButton } from '@mantine/core';

import { i18n as i18nUtils } from '../../components';

import LoginWidget from './LoginWidget';
import RegistrationWidget from './RegistrationWidget';
import ResetPasswordWidget from './ResetPasswordWidget';
import componentMessages from './messages';


const appEntityNameAbrev = import.meta.env.VITE_APP_ENTITY_NAME_ABREV || 'ScalarGIS';

function Main({ type, region, as, auth, core, config, actions, record }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { siteConfig } = core;
  const { getWindowSize } = Models.Utils;

  const [showLoginButton, setShowLoginButton] = useState(true);

  const [mode, setMode] = useState();

  const { logout } = actions;

  const location = useLocation();

  const wsize = getWindowSize();
  const isMobileSmall = wsize[0] <= 440;

  const loginHeader = record?.config_json?.header ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("login", "Entrar")} - ${appEntityNameAbrev || "ScalarGIS"}`;
  const registrationHeader = record?.config_json?.header_registration ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("userRegistration", "Registo de utilizador")} - ${appEntityNameAbrev || "ScalarGIS"}`;
  const passwordHeader = record?.config_json?.header_password ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("passwordReset", "Redefinir password")} - ${appEntityNameAbrev || "ScalarGIS"}`;

  const closable = record?.config_json?.closable === false ? false : true;

  const dialogSize = wsize[0] < 768 ? '90%' : '35vw';


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

    const trigger = type != 'menu' ?
      (showLoginButton ?
        <UnstyledButton>
          <span className="layout-topbar-item-text">{ !isMobileSmall ? username : '' }</span>
          <span className="layout-topbar-icon pi pi-user"/>
          {' '}{ !isMobileSmall ? username : '' }
        </UnstyledButton> : null) :
      <UnstyledButton className="sg-menuitem">
        <span className="pi pi-user"></span><span>{username}</span>
      </UnstyledButton>;

    if (!trigger) return null;

    return (
      <Menu position="bottom-end" shadow="md">
        <Menu.Target>
          {trigger}
        </Menu.Target>
        <Menu.Dropdown>
          { type != 'menu' && isMobileSmall &&
            <Menu.Item disabled style={{ wordBreak: 'break-all' }}>{username}</Menu.Item> }
          <Menu.Item
            leftSection={<i className="pi pi-lock" aria-hidden="true" />}
            onClick={() => dispatch(logout())}
          >
            {i18nUtils.translateValue("endSession", "Terminar sessão")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    )
  }

  return (
    <React.Fragment>
    { type != 'menu' ?
      <UnstyledButton onClick={e => setMode(1)} title={config.tooltip_login || ''}>
        <span className="layout-topbar-item-text">{i18nUtils.translateValue("user", "Utilizador")}</span>
        <span className="layout-topbar-icon pi pi-unlock"/>
      </UnstyledButton> :
      <UnstyledButton className="sg-menuitem" onClick={e => setMode(1)} title={config.tooltip_login || ''}>
        <span className="pi pi-unlock"></span><span>{i18nUtils.translateValue("login", "Entrar")}</span>
      </UnstyledButton> }

      <Modal
        opened={mode==1}
        onClose={() => { if (closable) setMode(0); }}
        title={loginHeader}
        size={dialogSize}
        withCloseButton={closable}
        closeOnEscape={closable}
        closeOnClickOutside={false}
      >
            <CompLoginWidget
              auth={auth}
              core={core}
              dispatch={dispatch}
              actions={actions}
              record={record}
              redirect={location?.pathname || `/${viewer?.name}` }
              onHide={() => {
                if (closable) {
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
      </Modal>

      <Modal
        opened={mode==2}
        onClose={() => { if (closable) setMode(0); }}
        title={registrationHeader}
        size={dialogSize}
        withCloseButton={closable}
        closeOnEscape={closable}
        closeOnClickOutside={false}
      >
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
      </Modal>

      <Modal
        opened={mode==3}
        onClose={() => { if (closable) setMode(0); }}
        title={passwordHeader}
        size={dialogSize}
        withCloseButton={closable}
        closeOnEscape={closable}
        closeOnClickOutside={false}
      >
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
      </Modal>

    </React.Fragment>

  );
}

export default connect(state => ({ auth: state.root.auth }))(Main);