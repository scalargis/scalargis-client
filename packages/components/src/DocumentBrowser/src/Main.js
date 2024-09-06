import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';

import { i18n } from '@scalargis/components';

import DocumentList from './DocumentList';

import './style.css';

/**
 * Main menu component
 */
export function MainMenu({ className, core, config, actions, record }) {

  const { viewer, dispatch } = config;

  const component_cfg = record.config_json || {};
  const title = record.title;
  const header = component_cfg.header || title;

  const showPopup = () => {

    const key = component_cfg?.dialogKey ? component_cfg?.dialogKey : "DocumentBrowser-" + record.id;

    if (viewer?.dialogWindows?.length > 0) {
        const dw = viewer.dialogWindows.find(w => w.key === key);
        if (dw) {
            dispatch(actions.viewer_update_dialog_window({config: dw.config, child: dw.child, visible: true }));
            return;
        }
    }

    const cfg = Object.assign({}, component_cfg?.dialogOptions);
    cfg.key = key;
    cfg.header = component_cfg?.dialogOptions?.header || header; 

    const childKey = new Date().getTime();
    const child = <DocumentList key={childKey} core={core} documentList={component_cfg} />

    dispatch(actions.viewer_add_dialog_window({config: cfg, child}));
  }

  if (record.as === 'popup') {
    return (
      <React.Fragment>
        { component_cfg?.btn_image ? 
            <Button
              title={title}
              className={className ? className + ' main-menu-btn-image' : null}
              icon="pi"
              style={{ margin: '0.5em 1em', backgroundImage: `url("${component_cfg.btn_image}")` }}
              onClick={e => showPopup() /*setShowPopup(true)*/}
            /> :
            <Button
              title={title}
              className={className}
              icon= {component_cfg?.btn_icon ? component_cfg?.btn_icon : "pi pi-folder-open"}
              style={{ margin: '0.5em 1em' }}
              onClick={e => showPopup() /*setShowPopup(true)*/}
            /> }
      </React.Fragment>
    )
  }  else {
    if (component_cfg?.btn_image) {
      return (
        <Button
          title={title}
          className={className ? className + ' main-menu-btn-image' : null}
          icon="pi"
          style={{ margin: '0.5em 1em', backgroundImage: `url("${component_cfg.btn_image}")` }}
          onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
        />
      )
    }

    return (
        <Button
        title={title}
        className={className}
        icon= {component_cfg?.btn_icon ? component_cfg?.btn_icon : "pi pi-folder-open"}
        style={{ margin: '0.5em 1em' }}
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      /> 
    )
  }
}

export default function Main({ as, core, config, actions, record }) {

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title;

  const [popups, setPopups] = useState([]);
  const popupsRef = useRef(popups);

  useEffect(() => {
    popupsRef.current = [...popups];
  }, [popups]);

  // Render content
  function renderContent() {
    return (
      <React.Fragment>
        <DocumentList
          core={core}
          documentList={component_cfg}
        />
        {popups.map(item => item)}
      </React.Fragment>
    )
  }

  if (as === '') return (
    renderContent()
  )

  if (as === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  return null
}