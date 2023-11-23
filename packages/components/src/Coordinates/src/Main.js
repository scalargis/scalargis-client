import React, { useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { Button } from 'primereact/button'
import OLGroupLayer from "ol/layer/Group"
import { Panel } from 'primereact/panel'
import Coordinates from './Coordinates'

import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  
  const { t } = useTranslation();

  const component_cfg = record.config_json || {}; 
  const title = record.title || t("searchByCoordinates", "Pesquisa por Coordenadas");


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

export default function Main({ as, core, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize, showOnPortal } = Models.Utils;
  const { selected_menu } = viewer.config_json;

  const component_cfg = record.config_json || {};

  const { t } = useTranslation();

  const title = record.title || t("searchByCoordinates", "Pesquisa por Coordenadas");
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  useEffect(() => {
    if (selected_menu === 'coordinates') dispatch(actions.viewer_set_exclusive_mapcontrol('Coordinates'));
  }, [selected_menu]);

  useEffect(() => {
    if (selected_menu === 'coordinates') {
      if (!isMobile && component_cfg.expand_menu === true) {
        dispatch(actions.layout_show_menu(true));
      }
      if (isMobile && component_cfg.expand_menu_mobile === true) {
        dispatch(actions.layout_show_menu(false));
      }
    }
  }, [viewer.coordinates]); 

  // Render content
  function renderContent() {
    return (
      <div className="coordinates">
        <Coordinates
          core={core}
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