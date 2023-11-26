import React from 'react';
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import Basemaps from './Basemaps'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { t } = useTranslation();

  const component_cfg = record.config_json || {};
  const title = record.title || t("basemaps", "Maps de Base");
  
  if (record && record.target === 'mainmenu') {
      return (
          <Button
            title={title}
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

export default function Main({as, core, config, actions, record, utils}) {
  
  const { viewer, mainMap } = config;

  const component_cfg = record.config_json || {};

  const { t } = useTranslation();

  const title = record.title || t("basemaps", "Mapas de Base");
  const header = component_cfg.header ? t(component_cfg.header, component_cfg.header) : title;  

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
      <div title={title}>
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
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )  

  // Render component
  return renderContent()
}