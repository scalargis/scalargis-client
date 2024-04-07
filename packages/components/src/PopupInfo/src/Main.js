import React, { Fragment, useState, useEffect } from 'react'
import { useTranslation } from "react-i18next"
import { Dialog } from 'primereact/dialog'
import Cookies from 'universal-cookie'
import { InputSwitch } from 'primereact/inputswitch'
import { Button } from 'primereact/button'

import { I18N_NAMESPACE, loadTranslations } from './i18n/index'
import { LocaleSelectorComponent } from'@scalargis/components';

import './index.css'


const cookiePopupName = process.env.REACT_APP_COOKIE_POPUP_NAME || 'scalargis_popup';
const cookiePath = process.env.REACT_APP_COOKIE_PATH || '';

/**
 * Component Translations
 */
export const translations = { 
  load: loadTranslations
};


/**
 * Main component
 */
export default function Main({ config, as, core, actions, utils, record }) {

  const { auth } = config;
  const { showOnPortal } = utils;

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  const [showPopup, setShowPopup] = useState(false);
  const [permanent, setPermanent] = useState(false);

  const wsize = utils.getWindowSize();
  const isMobile = wsize[0] <= 768;


  function getInitialState() {

    let state = true;
    const cookies = new Cookies();
    const cookieData = cookies.get(config.cookieName || cookiePopupName);
    if (typeof cookieData !== 'undefined') {
      let data = JSON.parse(cookieData);
      state = data === 0 ? false : true;
    }
    
    //Always show if hideOption is not true
    if (config.hideOption !== false) {
      state = true;
    }

    //Do not show if user is authenticated and hideAuthentication option is true
    if (auth?.data?.authenticated && record.config_json.hideAuthenticated) {
      state = false;
    }

    return state;
  }

  function hidePopup() {
    setShowPopup(false);
    let data = JSON.stringify(0);
    const cookies = new Cookies();
    let maxAge = 1;
    if (permanent) maxAge = config.maxAge || (maxAge * 365 * 24 * 60 * 60);
    cookies.set(config.cookieName || cookiePopupName, data, { path: cookiePath, maxAge });

    if (core?.pubsub && record?.config_json?.actions?.hide) {
      core.pubsub.publish(record?.config_json?.actions?.hide, null);
    }
  }

  useEffect(() => {
    let state = getInitialState();
    setShowPopup(state);

    if (!state) {
      setTimeout(() => {
        if (core?.pubsub && record?.config_json?.actions?.hide) {
          core.pubsub.publish(record?.config_json?.actions?.hide, null);
        }
      }, 500);
    }
  }, []);

  // Render content
  let header;  
  if (typeof config?.header === 'object') {
    header = config.header["default"] ? config.header["default"] : "";
    header = config.header[i18n.resolvedLanguage] ? config.header[i18n.resolvedLanguage] : header;
  } else {
    header = config?.header ? t(config.header, config.header) : "";
  }

  const closeLabel = config.closeLabel ? t(config.closeLabel, config.closeLabel) : t("close", "Fechar")

  let html;
  if (typeof config?.html === 'object') {
    html = config.html["default"] ? config.html["default"] : "";
    html = config.html[i18n.resolvedLanguage] ? config.html[i18n.resolvedLanguage] : html;
  } else {
    html = config?.html;
  }

  const localeSelectorCfg = {
    mode: "dropdown",
    ...record?.config_json?.localeSelector
  }

  const modal = config?.modal != null ? config.modal : true;

  return (
    <Fragment>
      {showOnPortal(<Dialog
        header={header}
        visible={showPopup}
        style={{width: isMobile ? config?.modileDialogWidth ||'90%' : config?.dialogWidth || '35vw' }}
        modal={modal}
        footer={(
          <div className="p-grid">
            {(!config.hideOption &&
            <div className="p-col-12 p-md-6" style={{ textAlign: 'left'}}>
              <InputSwitch
                inputId="permanentSwitch"
                checked={permanent}
                onChange={(e) => setPermanent(!permanent)}
              />
              {' '}
              <label htmlFor="permanentSwitch">
                <span>{t("doNotShowAgain", "Não mostrar novamente")}</span>
              </label>
            </div>)}
            <div className="p-col-12 p-md-6" style={{ textAlign: 'right'}}>
              <Button label={closeLabel} onClick={e => hidePopup() } />
            </div>
          </div>
        )}
        onHide={e => hidePopup()}>
          <div>
            { record?.config_json?.showLocaleSelector === true &&
            <div className="p-col-12 p-pt-0" style={{ textAlign: 'right'}}>
              <LocaleSelectorComponent config={config} actions={actions} componentConfig={localeSelectorCfg} className="popupinfo-locale-selector" />
            </div>
            }
            <div dangerouslySetInnerHTML={{ __html: html }}></div>
          </div>
      </Dialog>)}
    </Fragment>
  )
}
