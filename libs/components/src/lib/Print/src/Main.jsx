import React, { useState,useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Group, Modal } from '@mantine/core';
import { CollapsiblePanel } from '@scalargis/ui';
import Print from './Print'

import { i18n, MainMenuButton, MapToolButton } from '../../components';

import { MAPCONTROL_NAME } from './utils';
import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, core, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize } = Models.Utils;
  useTranslation();

  const [showPopup, setShowPopup] = useState(false);

  const component_cfg = record.config_json || {};
  const headerCfg = component_cfg?.header;
  const title = headerCfg
    ? i18n.translateValue(headerCfg, headerCfg)
    : (record.title ? i18n.translateValue(record.title, record.title) : i18n.translateValue("print", "Imprimir"));
  const header = headerCfg ? i18n.translateValue(headerCfg, headerCfg) : title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel || i18n.translateValue("close", "Fechar");
    return (
      <React.Fragment>

        <MainMenuButton
          title={title}
          className={className}
          icon="pi pi-print"
          onClick={e => setShowPopup(true)}
        />

        <Modal
          title={header}
          opened={showPopup}
          size={isMobile ? '90%' : '35vw'}
          onClose={e => setShowPopup(false)}>

          <Print
            core={core}
            config={config}
            actions={actions}
            dispatch={dispatch}
            record={record}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={e => setShowPopup(false)}>{closeLabel}</Button>
          </Group>

        </Modal>

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
  const { getWindowSize } = Models ? Models.Utils : utils;
  useTranslation();

  const component_cfg = record.config_json || {};

  const headerCfg = component_cfg?.header;
  const title = headerCfg
    ? i18n.translateValue(headerCfg, headerCfg)
    : (record.title ? i18n.translateValue(record.title, record.title) : i18n.translateValue("print", "Imprimir"));
  const header = headerCfg ? i18n.translateValue(headerCfg, headerCfg) : title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

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
