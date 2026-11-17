import React, { useEffect, useState } from 'react';
import { useTranslation} from "react-i18next";
import { CollapsiblePanel, useIsMobile } from '@scalargis/ui';
import { MainMenuButton, MapToolButton } from '../../components';

import { MAPCONTROL_NAME } from './utils';
import { mapToolOff } from '../../utils/mapTools';
import MapTools from './MapTools';
export { default as configSchema } from './config.schema.json';


/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer } = config;
  const { selected_menu } = viewer.config_json;
  const { exclusive_mapcontrol } = viewer;

  const { t } = useTranslation();

  const title = record.title || t("measurementTools", "Ferramentas de Medição");

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== MAPCONTROL_NAME;

  return (
    <MainMenuButton
      title={title}
      className={className}
      inactive={isInactive}
      icon="fas fa-ruler"
      onClick={e => {
        if (selected_menu !== record.id) {
          config.dispatch(actions.viewer_set_selectedmenu(record.id));
        } else {
          config.dispatch(mapToolOff(actions, viewer, MAPCONTROL_NAME));
        }
      }}
    />
  )
}

//export default function Main({ type, region, as, config, actions, record, utils }) {
export default function Main(props) {

  const { type, region, as, config, actions, record, utils, Models } = props;

  const core = props.core;

  const { dispatch, viewer, mainMap } = config;
  const { selected_menu } = viewer.config_json;

  const { t } = useTranslation();

  const component_cfg = record.config_json || {};
  const title = record.title || t("measurementTools", "Ferramentas de Medição");
  const header = component_cfg.header || title;

  const isMobile = useIsMobile();

  const [selectedControl, setSelectedControl] = useState();


  useEffect(() => {
    if (selected_menu !== record.id) dispatch(actions.viewer_release_exclusive_mapcontrol(MAPCONTROL_NAME));
  }, [selected_menu]);

  function renderContent() {
    return (
      <div className="maptools">
        <MapTools
          viewer={viewer}
          core={core}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          utils={utils}
          record={record}
          selectedControl={selectedControl}
          onControlSelect={(control)=> setSelectedControl(control)}
        />
      </div>
    )
  }

  if (type === 'link' && region === record.links) {
    return <MapToolButton
      title={title}
      icon="fas fa-ruler"
      active={!!(viewer?.exclusive_mapcontrol === MAPCONTROL_NAME && selectedControl)}
      onClick={e => {
        dispatch(actions.viewer_set_selectedmenu(record.id));
        dispatch(actions.layout_show_menu(!isMobile));
      }}
    />
  }

  if (as === 'panel') return (
    <CollapsiblePanel header={header} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  return null;
}
