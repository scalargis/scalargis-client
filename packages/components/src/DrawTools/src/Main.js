import React, { useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import DrawTools from './DrawTools'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer } = config;
  const { selected_menu } = viewer.config_json;
  const { exclusive_mapcontrol } = viewer;

  const { t } = useTranslation();

  const component_cfg = record.config_json || {};
  const title = record.title || t("drawingTools", "Ferramentas de Desenho");
  const header = component_cfg.header || title;

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== 'DrawTools';

  return (
    <Button
      title={title}
      className={`${className}${isInactive ? " menu-inactive" : ""}`}
      icon="pi pi-palette"
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

export default function Main({ type, region, as, config, actions, record, utils }) {

  const { core, mainMap, viewer, dispatch, Models } = config;
  const { selected_menu } = viewer.config_json;
  const { getWindowSize } = Models ? Models.Utils : utils;  

  const component_cfg = record.config_json || {};

  const { t } = useTranslation();

  const title = record.title || t("drawingTools", "Ferramentas de Desenho");
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;  

  useEffect(() => {
    if (selected_menu === 'drawtools') dispatch(actions.viewer_set_exclusive_mapcontrol(null));
  }, [selected_menu])   


  if (!viewer?.loaded) return null;

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

  if (type === 'link' && region === record.links) {
    return <Button
      title={title}
      icon="pi pi-palette"
      className="p-button-rounded p-button-raised"
      onClick={e => {
        dispatch(actions.viewer_set_selectedmenu(record.id));
        dispatch(actions.layout_show_menu(!isMobile));
      }}
    />
  }

  if (as === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  // Render component
  return renderContent()
}
