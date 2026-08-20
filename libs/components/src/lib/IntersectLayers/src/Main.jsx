import React, { useState } from 'react';
import { Box, LoadingOverlay } from '@mantine/core';
import { CollapsiblePanel, IconObjectsColumn } from '@scalargis/ui';

import { i18n, MainMenuButton } from '../../components';

import Intersect from './Intersect';

import './style.css';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const t = i18n.translateValue;

  const title = t(record?.title || "Interseção de Temas", record?.title || "Interseção de Temas");

  if (record && record.target === 'mainmenu') {

      if (record?.config_json?.btn_image) {
        return (
          <MainMenuButton
            title={title}
            className={className ? className + ' intersect-layers-main-menu-btn' : null}
            style={{ backgroundImage: `url("${record.config_json.btn_image}")` }}
            onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
          />
        )
      }

      return (
          <MainMenuButton
            title={title}
            className={className}
            icon={record?.config_json?.btn_icon ? record.config_json.btn_icon : <IconObjectsColumn />}
            onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
          />
      )
    } else {
      return null;
    }
}

export default function Main(props) {

  const {as, core, config, actions, record, utils} = props;
  const { viewer, mainMap, dispatch } = config;

  const t = i18n.translateValue;

  const component_cfg = record.config_json || {};
  const header = t(component_cfg.header, component_cfg.header);

  const [blockedPanel, setBlockedPanel] = useState(false);

  const className = config?.classname ? `sg-intersect-layers ${config?.classname}` : 'sg-intersect-layers';

  function renderContent() {
    return (
      <Intersect
        title={t(record?.title || "Interseção de Temas", record?.title || "Interseção de Temas")}
        core={core}
        config={config}
        actions={actions}
        dispatch={dispatch}
        record={record}
        utils={utils}
        componentId={record?.id}
        setBlockedPanel={setBlockedPanel}
      />
    )
  }

  if (as === 'panel') return (
    <Box pos="relative" style={{height: 'calc(100%)'}}>
      <CollapsiblePanel header={header} className={className} toggleable={false}>
        { renderContent() }
      </CollapsiblePanel>
      <LoadingOverlay visible={blockedPanel} zIndex={1003} />
    </Box>
  )

  // Render component
  return renderContent()
}
