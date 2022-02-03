import React, { useEffect } from 'react'
import { Button } from 'primereact/button'
import OLGroupLayer from "ol/layer/Group"
import { Panel } from 'primereact/panel'
import Coordinates from './Coordinates'
import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const component_cfg = record.config_json || {};
  const title = record.title || 'Pesquisa por Coordenadas';

  return (
    <Button
      title={title}
      className={className}
      icon="fas fa-bullseye"
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

export default function Main({ as, config, actions, record }) {

  const { viewer, dispatch } = config;
  const { selected_menu } = viewer.config_json;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Pesquisa por Coordenadas';
  const header = component_cfg.header || title;  

  useEffect(() => {
    if (selected_menu === 'coordinates') dispatch(actions.viewer_set_exclusive_mapcontrol('Coordinates'));
  }, [selected_menu])  

  // Render content
  function renderContent() {
    return (
      <div className="coordinates">
        <Coordinates
          config={config}
          actions={actions}
          dispatch={dispatch}
          record={record}
        />
      </div>
    )
    
  }

  if (as === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  return null
}