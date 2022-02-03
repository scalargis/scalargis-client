import React, { useState,useEffect } from 'react';
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import { Dialog } from 'primereact/dialog'
import Print from './Print'
import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const [showPopup, setShowPopup] = useState(false);

  const component_cfg = record.config_json || {};
  const title = record.title || 'Imprimir';
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
          icon="pi pi-print"
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

          <Print
            config={config}
            actions={actions}
            dispatch={dispatch}
            record={record}
          />

        </Dialog>)}

      </React.Fragment>
    )
  }  else {
    return (
      <Button
        title={title}
        className={className}
        icon="pi pi-print"
        style={{ margin: '0.5em 1em' }}
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      />
    )
  }
}

export default function Main({ type, region, as, config, actions, record, utils }) {

  const { viewer, dispatch, Models } = config;
  const { selected_menu } = viewer.config_json;
  const { getWindowSize, showOnPortal } = Models ? Models.Utils : utils;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Imprimir';
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  useEffect(() => {
    if (selected_menu === record.id) dispatch(actions.viewer_set_exclusive_mapcontrol('Print'));
  }, [selected_menu]);  

  // Render content
  function renderContent() {
    return (
      <div className="print">

        <Print
          config={config}
          actions={actions}
          dispatch={dispatch}
          record={record}
        />
        
      </div>
    )
  }

  if (type === 'link' && region === record.links) {
    return <Button
      title={title}
      icon="pi pi-print"
      className="p-button-rounded p-button-raised"
      onClick={e => {
        dispatch(actions.viewer_set_selectedmenu(record.id));
        dispatch(actions.layout_show_menu(true));
      }}
    />
  }

  if (as === 'panel') {
    return (
      <Panel header={header}>
        { renderContent() }
      </Panel>
    )
  }

  return null;

}