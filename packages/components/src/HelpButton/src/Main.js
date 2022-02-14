import React, { useState } from 'react';
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import { Dialog } from 'primereact/dialog'
import HelpHtmlContent from './HelpHmtlContent'
import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const [showPopup, setShowPopup] = useState(false);

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  if (record.as === 'popup') {    
    const closeLabel = component_cfg.closeLabel || "Fechar";    
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
          style={{width: isMobile ? '90%' : '35vw' }} 
          modal
          footer={(
            <div className="p-grid">
              <div className="p-col" style={{ textAlign: 'right'}}>
                <Button label={closeLabel} onClick={e => setShowPopup(false)} />
              </div>
            </div>
          )}          
          onHide={e => setShowPopup(false)}>

          <HelpHtmlContent
            config={component_cfg}
          />

        </Dialog>)}

      </React.Fragment>
    )
  } else if (record.as === 'external') { 
    const help_url = component_cfg.url ? component_cfg.url : viewer?.config_json?.help_url ;

    if (!help_url) return null;
    return (
      <Button
        title={title || 'Ajuda'}
        className={className}
        icon="far fa-question-circle"
        style={{ margin: '0.5em 1em' }}
        onClick={e => window.open(help_url)} />
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

export default function Main({ as, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const [showPopup, setShowPopup] = useState(false);  

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const closeLabel = component_cfg.closeLabel || "Fechar";
  
  const openAs = record?.as || as;

  // Render content
  function renderContent() {
    return (
      <HelpHtmlContent
        config={component_cfg}
      />
    )
  }

  if (openAs === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  if (openAs === 'popup') return (
    <React.Fragment>
      <button className="p-link" onClick={e => setShowPopup(true)} title="Ajuda">
        <span className="layout-topbar-item-text"></span>
        <span className="layout-topbar-icon far far fa-question-circle" />
      </button>

      {showOnPortal(<Dialog
        header="Ajuda"
        visible={showPopup}
        style={{width: isMobile ? '90%' : '35vw' }} 
        modal
        footer={(
          <div className="p-grid">
            <div className="p-col" style={{ textAlign: 'right'}}>
              <Button label={closeLabel} onClick={e => setShowPopup(false)} />
            </div>
          </div>
        )}             
        onHide={e => setShowPopup(false)}>
        <HelpHtmlContent
          config={component_cfg}
        />
      </Dialog>)}

    </React.Fragment>
  )

  if (openAs === 'external') {    
    const help_url = component_cfg.url ? component_cfg.url : viewer?.config_json?.help_url ;

    if (!help_url) return null;

    // Render help button
    return (
      <button className="p-link" title="Ajuda" onClick={e => { return; }}>
        <a href={help_url} target="_blank" style={{"color": "#ffffff"}}>
          <span className="layout-topbar-item-text">Ajuda</span>
          <span className="layout-topbar-icon pi pi-question-circle"/>
        </a>
      </button>
    )
  }

  return null
}