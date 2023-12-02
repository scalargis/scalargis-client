import React, { useState } from 'react';
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';

import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';

/**
 * Main menu component
 */
export function MainMenu({ className, core, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const { t } = useTranslation();

  const [showPopup, setShowPopup] = useState(false);

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title || t("contactForm", "Formulário de Contacto");

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  if (record.as === 'popup') {    
    const closeLabel = component_cfg.closeLabel || t("close", "Fechar");    
    return (
      <React.Fragment>

        <Button
          title={title}
          className={className}
          icon="far fa-question-circle"
          style={{ margin: '0.5em 1em' }}
          onClick={e => setShowPopup(true)}
        />

        {showOnPortal(<Dialog
          header={header}
          visible={showPopup}
          style={{width: isMobile ? '90%' : '45vw' }} 
          modal
          footer={(
            <div className="p-grid">
              <div className="p-col" style={{ textAlign: 'right'}}>
                <Button label={closeLabel} onClick={e => setShowPopup(false)} />
              </div>
            </div>
          )}          
          onHide={e => setShowPopup(false)}>
          
          { component_cfg.hideForm !== true ?
            <ContactForm
              core={core}
              viewer={viewer}
              dispatch={dispatch}
              config={component_cfg}
              Utils={Models.Utils}
            />
            :
            <ContactInfo
              core={core}
              viewer={viewer}
              dispatch={dispatch}
              config={component_cfg}
              Utils={Models.Utils}
            />
          }

        </Dialog>)}

      </React.Fragment>
    )
  }  else {
    return (
      <Button
        title={title}
        className={className}
        icon="far fa-question-circle"
        style={{ margin: '0.5em 1em' }}
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      />
    )
  }
}

export default function Main({ region, as, core, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const { t } = useTranslation();

  const [showForm, setShowForm] = useState(false);

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title || t("contactForm", "Formulário de Contacto");

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768; 

  const closeLabel = component_cfg.closeLabel || t("close", "Fechar");

  function renderContent() {
    return  (
      component_cfg.hideForm !== true ?
      <ContactForm
        core={core}
        viewer={viewer}
        dispatch={dispatch}
        config={component_cfg}
        Utils={Models.Utils}
      />
      :
      <ContactInfo
        core={core}
        viewer={viewer}
        dispatch={dispatch}
        config={component_cfg}
        Utils={Models.Utils}
      />
    )
  }

  if (as === 'panel') {
   return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
   )
   } else {
      return (
        <React.Fragment>
          <button className="p-link" onClick={e => setShowForm(true)} title={t("contact", "Contacto")}>
            <span className="layout-topbar-item-text"></span>
            <span className="layout-topbar-icon far fa-envelope" />
          </button>

          {showOnPortal(<Dialog
            header={header}
            visible={showForm}
            style={{width: isMobile ? '90%' : '45vw' }} 
            modal
            footer={(
              <div className="p-grid">
                <div className="p-col" style={{ textAlign: 'right'}}>
                  <Button label={closeLabel} onClick={e => setShowForm(false)} />
                </div>
              </div>
            )}             
            onHide={e => setShowForm(false)}>
              { component_cfg.hideForm !== true ?
              <ContactForm
                core={core}
                viewer={viewer}
                dispatch={dispatch}
                config={component_cfg}
                Utils={Models.Utils}
              />
              :
              <ContactInfo
                core={core}
                viewer={viewer}
                dispatch={dispatch}
                config={component_cfg}
                Utils={Models.Utils}
              />
              }

          </Dialog>)}

        </React.Fragment>
      )       
   }

}