import React, { useState, useRef } from 'react';
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
  const [size, setSize] = useState(null);
  const [maximized, setMaximized] = useState(false);

  const dialog = useRef();

  const component_cfg = record.config_json || {};
  const title = record.title || 'Ajuda';
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
          ref={dialog}        
          header={header}
          visible={showPopup}
          style={{width: isMobile ? '90%' : '50vw', height: '80%' }}
          maximizable
          maximized={maximized} 
          modal
          footer={(
            <div className="p-grid">
              <div className="p-col" style={{ textAlign: 'right'}}>
                <Button label={closeLabel} onClick={e => setShowPopup(false)} />
              </div>
            </div>
          )}
          onShow={() => {
            const elem = dialog.current.contentEl;
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onResize={e => {
            const elem = dialog.current.contentEl;
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onMaximize={e => {
            setMaximized(e.maximized);
            const elem = dialog.current.contentEl;
            setTimeout(() => {setSize({x: elem.clientWidth, y: elem.clientHeight - 25 }, 200)});
          }}
          onHide={e => setShowPopup(false)}>
          
          { component_cfg.iframe === true ?
            <iframe title={title} src={component_cfg.url} style={ size ? { border: 'none', width: '100%', height: size.y } : {border: 'none', width: '100%'}}></iframe>
            :
            <HelpHtmlContent
              config={component_cfg}
              size={size}
            />
          }

        </Dialog>)}

      </React.Fragment>
    )
  } else if (record.as === 'external') { 
    const help_url = component_cfg.url ? component_cfg.url : viewer?.config_json?.help_url ;

    if (!help_url) return null;
    return (
      <Button
        title={title}
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
  const [size, setSize] = useState(null);
  const [maximized, setMaximized] = useState(false);

  const dialog = useRef();    

  const component_cfg = record.config_json || {};
  const title = record.title || 'Ajuda';
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
      <button className="p-link" onClick={e => setShowPopup(true)} title={title}>
        <span className="layout-topbar-item-text"></span>
        <span className="layout-topbar-icon far far fa-question-circle" />
      </button>

      {showOnPortal(<Dialog
          ref={dialog}        
          header={header}
          visible={showPopup}
          style={{width: isMobile ? '90%' : '50vw', height: '80%' }}
          maximizable
          maximized={maximized} 
          modal
          footer={(
            <div className="p-grid">
              <div className="p-col" style={{ textAlign: 'right'}}>
                <Button label={closeLabel} onClick={e => setShowPopup(false)} />
              </div>
            </div>
          )}
          onShow={() => {
            const elem = dialog.current.contentEl;
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onResize={e => {
            const elem = dialog.current.contentEl;
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onMaximize={e => {
            setMaximized(e.maximized);
            const elem = dialog.current.contentEl;
            setTimeout(() => {setSize({x: elem.clientWidth, y: elem.clientHeight - 25 }, 200)});
          }}
          onHide={e => setShowPopup(false)}>
          
          { component_cfg.iframe === true ?
            <iframe title={title} src={component_cfg.url} style={ size ? { border: 'none', width: '100%', height: size.y } : {border: 'none', width: '100%'}}></iframe>
            :
            <HelpHtmlContent
              config={component_cfg}
              size={size}
            />
          }

        </Dialog>)}

    </React.Fragment>
  )

  if (openAs === 'external') {    
    const help_url = component_cfg.url ? component_cfg.url : viewer?.config_json?.help_url ;

    if (!help_url) return null;

    // Render help button
    return (
      <button className="p-link" title={title} onClick={e => { return; }}>
        <a href={help_url} target="_blank" style={{"color": "#ffffff"}}>
          <span className="layout-topbar-item-text">{title}</span>
          <span className="layout-topbar-icon pi pi-question-circle"/>
        </a>
      </button>
    )
  }

  return null
}