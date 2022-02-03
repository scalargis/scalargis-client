import React, { useEffect } from 'react'
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import DrawTools from './DrawTools'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return (
    <Button
      title="Ferramentas de Desenho"
      className={className}
      icon="pi pi-palette"
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

export default function Main({ as, config, actions, record, utils }) {

  const { core, mainMap, viewer, dispatch } = config;
  const { selected_menu } = viewer.config_json;

  useEffect(() => {
    if (selected_menu === 'drawtools') dispatch(actions.viewer_set_exclusive_mapcontrol('DrawTools'));
  }, [selected_menu])   

  function renderContent() {
    return (
      <div>
        <DrawTools
          record={record}
          viewer={viewer}
          core={core}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          utils={utils}
        />
      </div>  
    )  
  }

  if (as === 'panel') return (
    <Panel header="Ferramentas de Desenho">
      { renderContent() }
    </Panel>
  )

  // Render component
  return renderContent()
}
