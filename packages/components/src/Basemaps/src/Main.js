import React from 'react'
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import Basemaps from './Basemaps'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  
  if (record && record.target === 'mainmenu') {
      return (
          <Button
            title="Mapas de Base"
            className={className}
            icon="pi pi-image"
            style={{ margin: '0.5em 1em' }}
            onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
          />
      )
    } else {
      return null;
    }
}

export default function Main({as, config, actions, record}) {
  
  const { core, viewer, mainMap } = config;

  let layers = [];
  let selectedLayer = null;

  //Get list of basemap layers
  if (viewer && viewer.config_json && viewer.config_json.layers) {
    const parent = viewer.config_json.layers.filter(l => { return l.id === 'basemaps'});
    if (parent && parent[0] && parent[0].children) {
      viewer.config_json.layers.forEach(layer => {
        if (parent[0].children.includes(layer.id)) {
          layers.push(layer);
        }
      });
      /* Reduce method doesnot work in IE11
      layers = viewer.config_json.layers.reduce(function(filtered, layer) {
        if (parent[0].children.includes(layer.id)) {
          filtered.push(layer);
        }
        return filtered;
      }, []);
      */
    }
  }

  //Basemap selectedLayer is the first checked layer
  for (var l of layers) {
    if (viewer.config_json.checked.includes(l.id)) {
      selectedLayer = l.id;
      break;
    }
  }

  function renderContent() {
    return (
      <div title="Mapas de Base">
        <Basemaps
          core={core}
          config={config}
          actions={actions}
          viewer={viewer}
          mainMap={mainMap}
          record={record}
          layers={layers}
          selectedLayer={selectedLayer}
        />
      </div>  
    )  
  }

  if (as === 'panel') return (    
    <Panel header="Mapas de Base">
      { renderContent() }
    </Panel>
  )  

  // Render component
  return renderContent()
}