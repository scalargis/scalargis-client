import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Dialog } from 'primereact/dialog';

import { i18n as i18nUtils } from '../../components';

import HelpHtmlContent from './HelpHmtlContent';

import './style.css';

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
  const title = record.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("help", "Ajuda");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const lang = i18nUtils.getResolvedLanguage();

  let help_url = component_cfg.url || component_cfg.default_url ? component_cfg.url || component_cfg.default_url : viewer?.config_json?.help_url;
  if (help_url) {
    if (lang) {
      help_url = help_url.replace("{lang}", lang).replace("{language}", lang);
    } else if (component_cfg.default_url) {
      help_url = component_cfg.default_url;
    }
  }

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");

    return (
      <React.Fragment>

        <Button
          title={title}
          className={className}
          icon="far fa-question-circle"
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
            <div className="grid">
              <div className="col">
                <Button label={closeLabel} onClick={e => setShowPopup(false)} />
              </div>
            </div>
          )}
          onShow={() => {
            const elem = dialog.current.getElement();
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onResize={e => {
            const elem = dialog.current.getElement();
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onMaximize={e => {
            setMaximized(e.maximized);
            const elem = dialog.current.getElement();
            setTimeout(() => {setSize({x: elem.clientWidth, y: elem.clientHeight - 25 }, 200)});
          }}
          onHide={e => setShowPopup(false)}>
          
          { component_cfg.iframe === true ?
            <iframe title={title} src={help_url} style={ size ? { border: 'none', width: '100%', height: size.y } : {border: 'none', width: '100%'}}></iframe>
            :
            <HelpHtmlContent
              config={{...component_cfg, url: help_url}}
              size={size}
            />
          }

        </Dialog>)}

      </React.Fragment>
    )
  } else if (record.as === 'external') {
    return (
      <Button
        title={title}
        className={className}
        icon="far fa-question-circle"
        onClick={e => window.open(help_url)} />
    )
  }  else {
    return (
      <Button
        title={title}
        className={className}
        icon="far fa-question-circle"
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      />
    )
  }
}

export default function Main({ type, as, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const [showPopup, setShowPopup] = useState(false);
  const [size, setSize] = useState(null);
  const [maximized, setMaximized] = useState(false);

  const dialog = useRef();    

  const component_cfg = record.config_json || {};
  const title = record.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("help", "Ajuda");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");

  const openAs = record?.as || as;

  const lang = i18nUtils.getResolvedLanguage();

  let help_url = component_cfg.url || component_cfg.default_url ? component_cfg.url || component_cfg.default_url : viewer?.config_json?.help_url;
  if (help_url) {
    if (lang) {
      help_url = help_url.replace("{lang}", lang).replace("{language}", lang);
    } else if (component_cfg.default_url) {
      help_url = component_cfg.default_url;
    }
  }

  // Render content
  function renderContent() {
    return (
      <HelpHtmlContent
        config={{...component_cfg, url: help_url}}
      />
    )
  }

  if (openAs === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  );

  if (openAs === 'popup') {
    return (
      <React.Fragment>
        { type != 'menu' ?
          <button className="p-link" onClick={e => setShowPopup(true)} title={title}>
            <span className="layout-topbar-item-text"></span>
            <span className="layout-topbar-icon far far fa-question-circle" />
          </button> :
          <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => setShowPopup(true)} >
            <span className="p-menuitem-icon far far fa-question-circle"></span><span className="p-menuitem-text">Ajuda</span>
          </a> }

        {showOnPortal(<Dialog
          ref={dialog}        
          header={header}
          visible={showPopup}
          style={{width: isMobile ? '90%' : '50vw', height: '80%' }}
          maximizable
          maximized={maximized} 
          modal
          footer={(
            <div className="grid">
              <div className="col">
                <Button label={closeLabel} onClick={e => setShowPopup(false)} />
              </div>
            </div>
          )}
          onShow={() => {
            const elem = dialog.current.getElement();
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onResize={e => {
            const elem = dialog.current.getElement();
            setSize({x: elem.clientWidth, y: elem.clientHeight - 25 });
          }}
          onMaximize={e => {
            setMaximized(e.maximized);
            const elem = dialog.current.getElement();
            setTimeout(() => {setSize({x: elem.clientWidth, y: elem.clientHeight - 25 }, 200)});
          }}
          onHide={e => setShowPopup(false)}>
          
          { component_cfg.iframe === true ?
            <iframe title={title} src={help_url} style={ size ? { border: 'none', width: '100%', height: size.y } : {border: 'none', width: '100%'}}></iframe>
            :
            <HelpHtmlContent
              config={{...component_cfg, url: help_url}}
              size={size}
            />
          }

        </Dialog>)}

      </React.Fragment>
    );
  }

  if (openAs === 'external') {

    if (!help_url) return null;

    if (type === 'menu') {
      return (
        <a href={help_url} target="_blank" className="p-menuitem-link" role="menuitem" tabIndex="0" >
          <span className="p-menuitem-icon pi pi-question-circle"></span><span className="p-menuitem-text">{title}</span>
        </a>
      )
    }

    return (
      <React.Fragment>
      { component_cfg?.elementType === 'link' ?
        <div title={title} className="p-link">
          <a href={help_url} target="_blank" className="sg-help-button-link" style={{"color": "#ffffff"}}>
            <span className="layout-topbar-icon pi pi-question-circle"></span>
          </a>
        </div> :
        <button className="p-link" title={title} onClick={e => { return; }}>
          <a href={help_url} target="_blank" style={{"color": "#ffffff"}}>
            <span className="layout-topbar-item-text">{title}</span>
            <span className="layout-topbar-icon pi pi-question-circle"/>
          </a>
        </button> }
      </React.Fragment>
    )
  }

  return null
}