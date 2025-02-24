import React, { useState } from 'react';
import { Button } from 'primereact/button'
import { Panel } from 'primereact/panel'
import { Dialog } from 'primereact/dialog'
import PanelHtmlContent from './PanelHmtlContent'
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
        { component_cfg?.btn_image ? 
            <Button
              title={title}
              className={className ? className + ' main-menu-btn-image' : null}
              icon="pi"
              /*style={{ margin: '0.5em 1em', backgroundImage: `url("${component_cfg.btn_image}")` }}*/
              style={{ backgroundImage: `url("${component_cfg.btn_image}")` }}
              onClick={e => setShowPopup(true)}
            /> :
            <Button
              title={title}
              className={className}
              icon= {component_cfg?.btn_icon ? component_cfg?.btn_icon : "far fa-question-circle"}
              /*style={{ margin: '0.5em 1em' }}*/
              onClick={e => setShowPopup(true)}
            /> }

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

          <PanelHtmlContent
            config={component_cfg}
          />

        </Dialog>)}

      </React.Fragment>
    )
  }  else {
    if (component_cfg?.btn_image) {
      return (
        <Button
          title={title}
          className={className ? className + ' main-menu-btn-image' : null}
          icon="pi"
          /*style={{ margin: '0.5em 1em', backgroundImage: `url("${component_cfg.btn_image}")` }}*/
          style={{ backgroundImage: `url("${component_cfg.btn_image}")` }}
          onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
        />
      )
    }

    return (
        <Button
        title={title}
        className={className}
        icon= {component_cfg?.btn_icon ? component_cfg?.btn_icon : "far fa-question-circle"}
        /*style={{ margin: '0.5em 1em' }}*/
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      /> 
    )
  }
}

export default function Main({ as, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768; 

  // Render content
  function renderContent() {
    return (
      <PanelHtmlContent
        config={component_cfg}
      />
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