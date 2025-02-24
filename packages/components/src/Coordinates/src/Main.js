import React, { useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { Button } from 'primereact/button'
import OLGroupLayer from "ol/layer/Group"
import { Panel } from 'primereact/panel'

import { MAPCONTROL_NAME } from './utils'
import Coordinates from './Coordinates'
import './style.css'


/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  
  const { viewer } = config;
  const { selected_menu } = viewer.config_json;
  const { exclusive_mapcontrol } = viewer;

  const { t } = useTranslation();

  const component_cfg = record.config_json || {}; 
  const title = record.title || t("searchByCoordinates", "Pesquisa por Coordenadas");

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== MAPCONTROL_NAME;

  return (
    <Button
      title={title}
      className={`${className}${isInactive ? " menu-inactive" : ""}`}
      icon="fas fa-bullseye"
      /*style={{ margin: '0.5em 1em' }}*/
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