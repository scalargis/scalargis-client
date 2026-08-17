import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CollapsiblePanel, Dialog, useIsMobile } from '@scalargis/ui';
import Print from './Print'

import { i18n, MainMenuButton, MapToolButton } from '../../components';

import { MAPCONTROL_NAME } from './utils';
import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, core, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  useTranslation();

  const [showPopup, { open, close }] = useDisclosure(false);

  const component_cfg = record.config_json || {};
  const headerCfg = component_cfg?.header;
  const title = headerCfg
    ? i18n.translateValue(headerCfg, headerCfg)
    : (record.title ? i18n.translateValue(record.title, record.title) : i18n.translateValue("print", "Imprimir"));
  const header = headerCfg ? i18n.translateValue(headerCfg, headerCfg) : title;

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel || i18n.translateValue("close", "Fechar");
    return (
      <React.Fragment>

        <MainMenuButton
          title={title}
          className={className}
          icon="pi pi-print"
          onClick={e => open()}
        />

        <Dialog
          title={header}
          opened={showPopup}
          onClose={close}
          footer={<Button onClick={close}>{closeLabel}</Button>}>

          <Print
            core={core}
            config={config}
            actions={actions}
            dispatch={dispatch}
            record={record}
          />

        </Dialog>

      </React.Fragment>
    )
  }  else {
    return (
      <MainMenuButton
        title={title}
        className={className}
        icon="pi pi-print"
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      />
    )
  }
}

export default function Main({ type, region, as, core, config, actions, record, utils }) {

  const { viewer, dispatch, Models } = config;
  const { selected_menu } = viewer.config_json;
  useTranslation();

  const component_cfg = record.config_json || {};

  const headerCfg = component_cfg?.header;
  const title = headerCfg
    ? i18n.translateValue(headerCfg, headerCfg)
    : (record.title ? i18n.translateValue(record.title, record.title) : i18n.translateValue("print", "Imprimir"));
  const header = headerCfg ? i18n.translateValue(headerCfg, headerCfg) : title;

  const isMobile = useIsMobile();

  useEffect(() => {
    if (selected_menu === record.id) dispatch(actions.viewer_set_exclusive_mapcontrol(MAPCONTROL_NAME));
  }, [selected_menu]);

  // Render content
  function renderContent() {
    return (
      <div className="print">

        <Print
          core={core}
          config={config}
          actions={actions}
          dispatch={dispatch}
          record={record}
        />

      </div>
    )
  }

  if (type === 'link' && region === record.links) {
    return <MapToolButton
      title={title}
      icon="pi pi-print"
      onClick={e => {
        dispatch(actions.viewer_set_selectedmenu(record.id));
        dispatch(actions.layout_show_menu(!isMobile));
      }}
    />
  }

  if (as === 'panel') {
    return (
      <CollapsiblePanel header={header} toggleable={false}>
        { renderContent() }
      </CollapsiblePanel>
    )
  }

  return null;

}
