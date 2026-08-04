import React, { useState } from 'react';
import { Button, Group, Modal } from '@mantine/core';
import { CollapsiblePanel } from '@scalargis/ui';

import { MainMenuButton } from '../../components';

import PanelJsonContent from './PanelJsonContent'
import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, core, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize } = Models.Utils;

  const [showPopup, setShowPopup] = useState(false);

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const menuButton = component_cfg?.btn_image ? (
    <MainMenuButton
      title={title}
      className={className ? className + ' main-menu-btn-image' : 'main-menu-btn-image'}
      icon="pi"
      style={{ backgroundImage: `url("${component_cfg.btn_image}")` }}
      onClick={e => record.as === 'popup' ? setShowPopup(true) : config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  ) : (
    <MainMenuButton
      title={title}
      className={className}
      icon={component_cfg?.btn_icon ? component_cfg?.btn_icon : "pi pi-question-circle"}
      onClick={e => record.as === 'popup' ? setShowPopup(true) : config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  );

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel || "Fechar";
    return (
      <React.Fragment>
        {menuButton}

        <Modal
          title={header}
          opened={showPopup}
          size={isMobile ? '90%' : '35vw'}
          onClose={e => setShowPopup(false)}>

          <PanelJsonContent
            core={core}
            config={component_cfg}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={e => setShowPopup(false)}>{closeLabel}</Button>
          </Group>

        </Modal>

      </React.Fragment>
    )
  }

  return menuButton;
}

export default function Main({ as, config, actions, core, record }) {

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title;

  // Render content
  function renderContent() {
    return (
      <PanelJsonContent
        core={core}
        config={component_cfg}
      />
    )
  }

  if (as === '') return (
    renderContent()
  )

  if (as === 'panel') return (
    <CollapsiblePanel header={header} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  return null
}
