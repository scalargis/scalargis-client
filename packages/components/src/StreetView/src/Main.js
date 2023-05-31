import React from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import StreetView from './StreetView';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return (React.Fragment)
  {/*const title = record.title || 'Google Street View';

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

export default function Main(props) {

  const { as, core, config, utils, actions, record } = props;

  const { mainMap, viewer, dispatch } = config;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Google StreetView';
  const header = component_cfg.header || title;  

  function renderContent() {
    return (
      <div title={title}>
        <StreetView
          core={core}
          viewer={viewer}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          record={record}
          utils={utils}
        />
      </div>  
    )  
  }

  if (as === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  // Render component
  return renderContent()
}
