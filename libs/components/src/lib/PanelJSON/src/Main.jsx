import React from 'react';
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CollapsiblePanel, Dialog, IconQuestionCircle } from '@scalargis/ui';

import { MainMenuButton } from '../../components';

import PanelJsonContent from './PanelJsonContent'
import './style.css'

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, core, record }) {

  const { viewer, dispatch, Models } = config;

  const [opened, { open, close }] = useDisclosure(false);

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title;

  const menuButton = component_cfg?.btn_image ? (
    <MainMenuButton
      title={title}
      className={className ? className + ' main-menu-btn-image' : 'main-menu-btn-image'}
      icon="pi"
      style={{ backgroundImage: `url("${component_cfg.btn_image}")` }}
      onClick={e => record.as === 'popup' ? open() : config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  ) : (
    <MainMenuButton
      title={title}
      className={className}
      icon={component_cfg?.btn_icon ? component_cfg?.btn_icon : <IconQuestionCircle />}
      onClick={e => record.as === 'popup' ? open() : config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  );

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel || "Fechar";
    return (
      <React.Fragment>
        {menuButton}

        <Dialog
          title={header}
          opened={opened}
          onClose={close}
          footer={<Button onClick={close}>{closeLabel}</Button>}>

          <PanelJsonContent
            core={core}
            config={component_cfg}
          />

        </Dialog>

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
