import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux';
import { useLocation } from 'react-router';

import { Menu, UnstyledButton } from '@mantine/core';
import { Dialog } from '@scalargis/ui';

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

  const { logout, login_post, login_user_registration, login_reset_password, login_clear_error } = actions;

  const location = useLocation();

  const wsize = getWindowSize();
  const isMobileSmall = wsize[0] <= 440;

  const loginHeader = record?.config_json?.header ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("login", "Entrar")} - ${appEntityNameAbrev || "ScalarGIS"}`;
  const registrationHeader = record?.config_json?.header_registration ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("userRegistration", "Registo de utilizador")} - ${appEntityNameAbrev || "ScalarGIS"}`;
  const passwordHeader = record?.config_json?.header_password ? i18nUtils.translateValue(record.config_json.header, record.config_json.header) : `${i18nUtils.translateValue("passwordReset", "Redefinir password")} - ${appEntityNameAbrev || "ScalarGIS"}`;

  const closable = record?.config_json?.closable === false ? false : true;

  // The dialog container owns the app-specific wiring; the widgets are pure and
  // receive it as callbacks + the link-visibility booleans computed here from
  // this surface's config source (record.config_json).
  const componentCfg = record?.config_json || {};
  const showRegistration = !!componentCfg.user_registration;
  const showResetPassword = !!(componentCfg.reset_password || (componentCfg.reset_password_login_error && auth?.response && auth?.response?.message));
  const redirect = location?.pathname || `/${viewer?.name}`;
  const apiUrl = core?.API_URL;
  const termsOfServiceUrl = viewer?.config_json?.terms_of_service_url;


  let CompLoginWidget = LoginWidget;
  let CompRegistrationWidget = RegistrationWidget;
  let CompResetPasswordWidget = ResetPasswordWidget;

  if (record?.config_json?.widgets?.login || siteConfig?.authentication?.widgets?.login) {
      CompLoginWidget = core.getComponentWidget(record?.config_json?.widgets?.login || siteConfig?.authentication?.widgets?.login) || CompLoginWidget
  }
  if (record?.config_json?.widgets?.registration || siteConfig?.authentication?.widgets?.registration) {
      CompRegistrationWidget = core.getComponentWidget(record?.config_json?.widgets?.registration || siteConfig?.authentication?.widgets?.registration) || CompRegistrationWidget
  }
  if (record?.config_json?.widgets?.password || siteConfig?.authentication?.widgets?.password) {
      CompResetPasswordWidget = core.getComponentWidget(record?.config_json?.widgets?.password || siteConfig?.authentication?.widgets?.password) || CompResetPasswordWidget
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

      <Dialog
        opened={mode==1}
        onClose={() => { if (closable) setMode(0); }}
        title={loginHeader}
        closeOnEscape={closable}
        closeOnClickOutside={false}
      >
            <CompLoginWidget
              auth={auth}
              core={core}
              dispatch={dispatch}
              actions={actions}
              record={record}
              redirect={redirect}
              layout="dialog"
              showRegistration={showRegistration}
              showResetPassword={showResetPassword}
              onClearError={() => dispatch(login_clear_error())}
              onLogin={(data) => {
                if (record?.config_json?.actions?.login) {
                  core.pubsub.publish(record?.config_json?.actions?.login, null);
                  return;
                }
                const loginApiUrl = siteConfig?.authentication?.endpoints?.login;
                dispatch(login_post(core, { username: data.username, password: data.password }, loginApiUrl, null, redirect));
              }}
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
              onShowResetPassword={() => setMode(3)}
              onShowPasswordReset={() => setMode(3)}
            />
      </Dialog>

      <Dialog
        opened={mode==2}
        onClose={() => { if (closable) setMode(0); }}
        title={registrationHeader}
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
              redirect={redirect}
              layout="dialog"
              apiUrl={apiUrl}
              termsOfServiceUrl={termsOfServiceUrl}
              onRegistration={(payload) => {
                const registrationApiUrl = siteConfig?.authentication?.endpoints?.registration;
                dispatch(login_user_registration(core, { ...payload, redirect }, registrationApiUrl, redirect));
              }}
              onShowLogin={() => setMode(1)}
            />
      </Dialog>

      <Dialog
        opened={mode==3}
        onClose={() => { if (closable) setMode(0); }}
        title={passwordHeader}
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
              redirect={redirect}
              layout="dialog"
              onClearError={() => dispatch(login_clear_error())}
              onResetPassword={(data) => {
                if (record?.config_json?.actions?.reset_password) {
                  core.pubsub.publish(record?.config_json?.actions?.reset_password, { post: { username: data.username, redirect }, history: null, redirect });
                  return;
                }
                dispatch(login_reset_password({ username: data.username, redirect }, null, redirect));
              }}
              onShowLogin={() => setMode(1)}
            />
      </Dialog>

    </React.Fragment>

  );
}

export default connect(state => ({ auth: state.root.auth }))(Main);