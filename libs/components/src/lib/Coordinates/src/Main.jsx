import React, { useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { CollapsiblePanel, useIsMobile } from '@scalargis/ui'

import { MainMenuButton } from '../../components'
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
  const title = record.title || t("searchByCoordinates", "Pesquisa de Coordenadas");

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== MAPCONTROL_NAME;

  return (
    <MainMenuButton
      title={title}
      className={`${className}${isInactive ? " menu-inactive" : ""}`}
      icon="pi pi-bullseye"
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
  const { showOnPortal } = Models.Utils;
  const { selected_menu } = viewer.config_json;
  const { exclusive_mapcontrol } = viewer;

  const component_cfg = record.config_json || {};

  const { t } = useTranslation();

  const title = record.title || t("searchByCoordinates", "Pesquisa de Coordenadas");
  const header = component_cfg.header || title;

  const isMobile = useIsMobile();

  // Arming on the way in is only half of it: whoever armed the control has to
  // release it on the way out, or the tool stays live on the map under the next
  // menu. Only ever released when it is still ours to release.
  useEffect(() => {
    if (selected_menu === record.id) dispatch(actions.viewer_set_exclusive_mapcontrol(MAPCONTROL_NAME));
    else if (exclusive_mapcontrol === MAPCONTROL_NAME) dispatch(actions.viewer_set_exclusive_mapcontrol(null));
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
    <CollapsiblePanel header={header} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  return null
}