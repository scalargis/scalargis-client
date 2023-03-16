import React from 'react'
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import MapControls from './MapControls'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return (React.Fragment)
  {/*
  return (
    <Button
      title="Ferramentas do Mapa"
      className={className}
      icon="pi pi-sliders-h"
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
  */}
}

export default function Main({ core, as, config, record }) {

  const { actions, mainMap, viewer, dispatch } = config;

  function renderContent() {
    return (
      <div title="Ferramentas do Mapa">
        <MapControls
          core={core}
          viewer={viewer}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          record={record}
        />
      </div>  
    )  
  }

  if (as === 'panel') return (
    <Panel header="Ferramentas do Mapa">
      { renderContent() }
    </Panel>
  )

  // Render component
  return renderContent()
}
