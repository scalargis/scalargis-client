import React from 'react';
import { i18n } from '@scalargis/components';
import LocaleSelector from './LocaleSelector';


function SplashScreen(props) {

  const { core, dispatch, children } = props;
  const { actions } = core;

  const { utils } = core;

  const defaultLogo = utils.buildRelativeUrlPath('assets/images/logo-splash.png');
  let viewerLogo = defaultLogo;
  if (core?.siteConfig?.rgpd_logo || core?.siteConfig?.logo) {
    viewerLogo = utils.buildRelativeUrlPath(core?.siteConfig?.rgpd_logo || core?.siteConfig?.logo);
  }

  let rgpdUrl = import.meta.env.VITE_APP_COOKIE_INFO_URL ? utils.buildRelativeUrlPath(import.meta.env.VITE_APP_COOKIE_INFO_URL) : null;
  if (core?.siteConfig?.rgpd_url) {
    rgpdUrl = utils.buildRelativeUrlPath(core?.siteConfig?.rgpd_url);
  }

  const addDefaultSrc = (ev) => {
    ev.target.src = defaultLogo;
  }

  let message = i18n.translateValue("defaultRGPDmsg", "Este website usa cookies para melhorar a sua experiência de navegação. Ao pressionar 'Aceito' está a concordar com a sua utilização.");

  message = import.meta.env.VITE_APP_COOKIE_MESSAGE ? i18n.translateValue(import.meta.env.VITE_APP_COOKIE_MESSAGE, import.meta.env.VITE_APP_COOKIE_MESSAGE) : message;
  message = core?.siteConfig?.rgpd_msg ? i18n.translateValue(core.siteConfig.rgpd_msg, core?.siteConfig?.rgpd_msg) : message;

  let localeSelectorCfg = null;
  if (Array.isArray(core?.siteConfig?.locales) && core.siteConfig.locales.length > 1) {
    localeSelectorCfg = {
      mode: "dropdown",
      _mode: "inline",
      show_always: true,
      locales: [
        ... core.siteConfig.locales
      ]
    }
  }

  return (
    <div className="splashscreen flex align-items-center justify-content-center">
      <div role="main">
        { localeSelectorCfg &&
        <div className="flex justify-content-end">
          <LocaleSelector type="" core={core} dispatch={dispatch} actions={actions} componentConfig={localeSelectorCfg} className="popup-locale-selector" />
        </div>
        }

        <div className="login-logo text-center mb-4">
          <img onError={addDefaultSrc} className="img-responsive" src={viewerLogo} alt="Logo" style={{maxWidth: "100%"}} />  
        </div>

        <h1>{`${i18n.translateValue("welcome", "Bem-vindo")}!`}</h1>
        <p>{message}</p>
        { rgpdUrl && (<p><a href={rgpdUrl} target="_blank" rel="noopener noreferrer">{i18n.translateValue("moreInformation", "Mais informação")}</a></p>) }

        { children }

      </div>
  </div>
  )
}

export default SplashScreen;