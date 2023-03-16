import React, { useEffect } from 'react'
import { Button } from 'primereact/button'
import OLGroupLayer from "ol/layer/Group"
import { Panel } from 'primereact/panel'

import componentMessages from './messages'

import FeatureResults from './FeatureResults'
import './index.css'

export function traverseOlLayers(collection, cb) {
  collection.forEach(l => {
    cb(l);
    if (l instanceof OLGroupLayer) traverseOlLayers(l.getLayers(), cb);
  })
}

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const component_cfg = record.config_json || {};
  const title = record.title || 'Identificar Elementos';

  return (
    <Button
      title={title}
      className={className}
      icon="pi pi-info-circle"
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

export default function Main({ as, core, config, actions, record }) {

  const { viewer, dispatch, Models, mainMap } = config;
  //const { publish, subscribe } = core.pubsub ? core.pubsub : {}
  const { featureinfo } = viewer;
  const { getWindowSize, showOnPortal } = Models.Utils;
  const { selected_menu, layers } = viewer.config_json;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Identificar Elementos';
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;  

  useEffect(() => {
    if (selected_menu === 'featureinfo') dispatch(actions.viewer_set_exclusive_mapcontrol('FeatureInfo'));
  }, [selected_menu]);

  useEffect(() => {
    if (selected_menu === 'featureinfo') {
      if (!isMobile && component_cfg.expand_menu === true) {
        dispatch(actions.layout_show_menu(true));
      }
      if (isMobile && component_cfg.expand_menu_mobile === true) {
        dispatch(actions.layout_show_menu(false));
      }
    }
  }, [viewer.featureinfo]);  

  // Render content
  function renderContent() {
    return (
      <div className="feature-info">

        <FeatureResults
          core={core}
          config={config}
          features={featureinfo}
          layers={layers}
          actions={actions}
          pubsub={core.pubsub}
          dispatch={dispatch}
          mainMap={mainMap}
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
