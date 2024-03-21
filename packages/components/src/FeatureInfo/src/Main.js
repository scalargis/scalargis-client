import React, { useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { Button } from 'primereact/button'
import OLGroupLayer from "ol/layer/Group"
import { Panel } from 'primereact/panel'

import componentMessages from './messages'

import FeatureResults from './FeatureResults'
import './index.css'

const MAPCONTROL_NAME = "FeatureInfo";

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

  const { viewer } = config;
  const { selected_menu } = viewer.config_json;
  const { exclusive_mapcontrol } = viewer;

  const { t } = useTranslation();

  const component_cfg = record.config_json || {};
  const title = record.title || t("identifyElements", "Identificar elementos");

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== MAPCONTROL_NAME;

  return (
    <Button
      title={title}
      className={`${className}${isInactive ? " menu-inactive" : ""}`}
      icon="pi pi-info-circle"
      style={{ margin: '0.5em 1em' }}
      onClick={e => {
        if (selected_menu !== record.id) config.dispatch(actions.viewer_set_selectedmenu(record.id));
        if (exclusive_mapcontrol !== MAPCONTROL_NAME) {
          config.dispatch(actions.viewer_set_exclusive_mapcontrol(MAPCONTROL_NAME));
        } else {
          config.dispatch(actions.viewer_set_exclusive_mapcontrol(null));
        }
      }}
    />
  )
}

export default function Main({ as, core, config, actions, record }) {

  const { viewer, dispatch, Models, mainMap } = config;
  //const { publish, subscribe } = core.pubsub ? core.pubsub : {}
  const { featureinfo, exclusive_mapcontrol } = viewer;
  const { getWindowSize, showOnPortal } = Models.Utils;
  const { selected_menu, layers } = viewer.config_json;

  const component_cfg = record.config_json || {};

  const { t } = useTranslation();

  const title = record.title || t("identifyElements", "Identificar elementos");
  const header = component_cfg.header ? t(component_cfg.header, component_cfg.header) : title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;  

  useEffect(() => {
    if (selected_menu === record.id) dispatch(actions.viewer_set_exclusive_mapcontrol(MAPCONTROL_NAME));
  }, [selected_menu]);

  useEffect(() => {
    if (selected_menu === record.id) {
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
