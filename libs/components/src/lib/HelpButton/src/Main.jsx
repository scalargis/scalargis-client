import React from 'react';
import { Button, Group, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CollapsiblePanel, Dialog, useIsMobile, IconQuestionCircle } from '@scalargis/ui';

import { i18n as i18nUtils, MainMenuButton } from '../../components';

import HelpHtmlContent from './HelpHmtlContent';

import './style.css';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer, dispatch, Models } = config;

  const [showPopup, { open, close }] = useDisclosure(false);

  const component_cfg = record.config_json || {};
  const title = record.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("help", "Ajuda");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const isMobile = useIsMobile();

  const lang = i18nUtils.getResolvedLanguage();

  let help_url = component_cfg.url || component_cfg.default_url ? component_cfg.url || component_cfg.default_url : viewer?.config_json?.help_url;
  if (help_url) {
    if (lang) {
      help_url = help_url.replace("{lang}", lang).replace("{language}", lang);
    } else if (component_cfg.default_url) {
      help_url = component_cfg.default_url;
    }
  }

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");

    return (
      <React.Fragment>

        <MainMenuButton
          title={title}
          className={className}
          icon={<IconQuestionCircle />}
          onClick={e => open()}
        />

        <Dialog
          title={header}
          opened={showPopup}
          size={isMobile ? '90%' : '50vw'}
          height="80vh"
          maximizable
          footer={(
            <Group justify="flex-end">
              <Button onClick={close}>{closeLabel}</Button>
            </Group>
          )}
          onClose={close}>

          { component_cfg.iframe === true ?
            <iframe title={title} src={help_url} style={{ border: 'none', width: '100%', height: '100%' }}></iframe>
            :
            <HelpHtmlContent
              config={{...component_cfg, url: help_url}}
            />
          }

        </Dialog>

      </React.Fragment>
    )
  } else if (record.as === 'external') {
    if (!help_url) return null;

    return (
      <MainMenuButton
        title={title}
        className={className}
        icon={<IconQuestionCircle />}
        onClick={e => window.open(help_url)} />
    )
  }  else {
    return (
      <MainMenuButton
        title={title}
        className={className}
        icon={<IconQuestionCircle />}
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      />
    )
  }
}

export default function Main({ type, as, config, actions, record }) {

  const { viewer, dispatch, Models } = config;

  const [showPopup, { open, close }] = useDisclosure(false);

  const component_cfg = record.config_json || {};
  const title = record.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("help", "Ajuda");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const isMobile = useIsMobile();

  const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");

  const openAs = record?.as || as;

  const lang = i18nUtils.getResolvedLanguage();

  let help_url = component_cfg.url || component_cfg.default_url ? component_cfg.url || component_cfg.default_url : viewer?.config_json?.help_url;
  if (help_url) {
    if (lang) {
      help_url = help_url.replace("{lang}", lang).replace("{language}", lang);
    } else if (component_cfg.default_url) {
      help_url = component_cfg.default_url;
    }
  }

  // Render content
  function renderContent() {
    return (
      <HelpHtmlContent
        config={{...component_cfg, url: help_url}}
      />
    )
  }

  if (openAs === 'panel') return (
    <CollapsiblePanel header={header} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  if (openAs === 'popup') {
    return (
      <React.Fragment>
        { type != 'menu' ?
          <UnstyledButton onClick={e => open()} title={title}>
            <span className="layout-topbar-item-text"></span>
            <IconQuestionCircle className="layout-topbar-icon" />
          </UnstyledButton> :
          <UnstyledButton className="sg-menuitem" onClick={e => open()}>
            <IconQuestionCircle /><span>Ajuda</span>
          </UnstyledButton> }

        <Dialog
          title={header}
          opened={showPopup}
          size={isMobile ? '90%' : '50vw'}
          height="80vh"
          maximizable
          footer={(
            <Group justify="flex-end">
              <Button onClick={close}>{closeLabel}</Button>
            </Group>
          )}
          onClose={close}>

          { component_cfg.iframe === true ?
            <iframe title={title} src={help_url} style={{ border: 'none', width: '100%', height: '100%' }}></iframe>
            :
            <HelpHtmlContent
              config={{...component_cfg, url: help_url}}
            />
          }

        </Dialog>

      </React.Fragment>
    );
  }

  if (openAs === 'external') {

    if (!help_url) return null;

    if (type === 'menu') {
      return (
        <a href={help_url} target="_blank" rel="noreferrer" className="sg-menuitem">
          <IconQuestionCircle /><span>{title}</span>
        </a>
      )
    }

    // One real anchor instead of the old button-wrapping-an-anchor pair —
    // same chrome classes, no nested interactive controls (kit 04).
    return (
      <a
        href={help_url}
        target="_blank"
        rel="noreferrer"
        title={title}
        className={component_cfg?.elementType === 'link' ? "sg-help-button-link" : "sg-help-button-external"}
        style={{ color: 'var(--mantine-color-white)' }}
      >
        { component_cfg?.elementType !== 'link' &&
          <span className="layout-topbar-item-text">{title}</span> }
        <IconQuestionCircle className="layout-topbar-icon" />
      </a>
    )
  }

  return null
}
