import React, { useState } from 'react';
import { Button, Group, UnstyledButton } from '@mantine/core';
import { CollapsiblePanel, Dialog } from '@scalargis/ui';

import { i18n as i18nUtils, MainMenuButton } from '../../components';

import HelpHtmlContent from './HelpHmtlContent';

import './style.css';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize } = Models.Utils;

  const [showPopup, setShowPopup] = useState(false);

  const component_cfg = record.config_json || {};
  const title = record.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("help", "Ajuda");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const lang = i18nUtils.getResolvedLanguage();

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");

    const url = lang ?
      component_cfg.url.replace("{lang}", lang).replace("{language}", lang)
      : component_cfg.url;

    return (
      <React.Fragment>

        <MainMenuButton
          title={title}
          className={className}
          icon="far fa-question-circle"
          onClick={e => setShowPopup(true)}
        />

        <Dialog
          title={header}
          opened={showPopup}
          size={isMobile ? '90%' : '50vw'}
          height="80vh"
          maximizable
          footer={(
            <Group justify="flex-end">
              <Button onClick={e => setShowPopup(false)}>{closeLabel}</Button>
            </Group>
          )}
          onClose={e => setShowPopup(false)}>

          { component_cfg.iframe === true ?
            <iframe title={title} src={url} style={{ border: 'none', width: '100%', height: '100%' }}></iframe>
            :
            <HelpHtmlContent
              config={component_cfg}
            />
          }

        </Dialog>

      </React.Fragment>
    )
  } else if (record.as === 'external') {
    let help_url = component_cfg.url ? component_cfg.url : viewer?.config_json?.help_url ;

    if (!help_url) return null;

    help_url = lang ?
      help_url.replace("{lang}", lang).replace("{language}", lang)
      : help_url;

    return (
      <MainMenuButton
        title={title}
        className={className}
        icon="far fa-question-circle"
        onClick={e => window.open(help_url)} />
    )
  }  else {
    return (
      <MainMenuButton
        title={title}
        className={className}
        icon="far fa-question-circle"
        onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
      />
    )
  }
}

export default function Main({ type, as, config, actions, record }) {

  const { viewer, dispatch, Models } = config;
  const { getWindowSize } = Models.Utils;

  const [showPopup, setShowPopup] = useState(false);

  const component_cfg = record.config_json || {};
  const title = record.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("help", "Ajuda");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");

  const openAs = record?.as || as;

  const lang = i18nUtils.getResolvedLanguage();

  // Render content
  function renderContent() {
    return (
      <HelpHtmlContent
        config={component_cfg}
      />
    )
  }

  if (openAs === 'panel') return (
    <CollapsiblePanel header={header} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  if (openAs === 'popup') {

    let url;

    if (component_cfg.url) {
      url = lang ?
        component_cfg.url.replace("{lang}", lang).replace("{language}", lang)
        : component_cfg.url;
    }

    return (
      <React.Fragment>
        { type != 'menu' ?
          <UnstyledButton className="p-link" onClick={e => setShowPopup(true)} title={title}>
            <span className="layout-topbar-item-text"></span>
            <span className="layout-topbar-icon far far fa-question-circle" />
          </UnstyledButton> :
          <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => setShowPopup(true)} >
            <span className="p-menuitem-icon far far fa-question-circle"></span><span className="p-menuitem-text">Ajuda</span>
          </a> }

        <Dialog
          title={header}
          opened={showPopup}
          size={isMobile ? '90%' : '50vw'}
          height="80vh"
          maximizable
          footer={(
            <Group justify="flex-end">
              <Button onClick={e => setShowPopup(false)}>{closeLabel}</Button>
            </Group>
          )}
          onClose={e => setShowPopup(false)}>

          { component_cfg.iframe === true ?
            <iframe title={title} src={url} style={{ border: 'none', width: '100%', height: '100%' }}></iframe>
            :
            <HelpHtmlContent
              config={component_cfg}
            />
          }

        </Dialog>

      </React.Fragment>
    );
  }

  if (openAs === 'external') {
    let help_url = component_cfg.url ? component_cfg.url : viewer?.config_json?.help_url;

    if (!help_url) return null;

    help_url = lang ?
      help_url.replace("{lang}", lang).replace("{language}", lang)
      : help_url;


    if (type === 'menu') {
      return (
        <a href={help_url} target="_blank" className="p-menuitem-link" role="menuitem" tabIndex="0" >
          <span className="p-menuitem-icon pi pi-question-circle"></span><span className="p-menuitem-text">{title}</span>
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
        className={component_cfg?.elementType === 'link' ? "p-link sg-help-button-link" : "p-link sg-help-button-external"}
        style={{"color": "#ffffff"}}
      >
        { component_cfg?.elementType !== 'link' &&
          <span className="layout-topbar-item-text">{title}</span> }
        <span className="layout-topbar-icon pi pi-question-circle"/>
      </a>
    )
  }

  return null
}
