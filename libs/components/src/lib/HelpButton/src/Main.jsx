import React from 'react';
import { Button, Group, Menu, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CollapsiblePanel, Dialog, useIsMobile, useOptionalTour, IconQuestionCircle, stepInFlow } from '@scalargis/ui';

import { i18n as i18nUtils, MainMenuButton } from '../../components';

import HelpHtmlContent from './HelpHmtlContent';

import './style.css';

/**
 * Whether this viewer offers the guided tour from the Help launcher (D1/D5).
 *
 * Strict opt-in: the viewer turns the tour on with
 * `config_json.onboarding.enabled = true`. The item also needs a live
 * <TourProvider> above (tour is not null) and at least one step in the
 * `viewer` flow (`stepInFlow`). A step of a scoped flow only, such as a
 * component panel tour, does not count. A viewer with the flag off, or with no
 * `viewer` steps, shows only the manual.
 */
function isTourEnabled(viewer, tour) {
  if (!tour) return false;
  if (!tour.steps || !tour.steps.some(s => stepInFlow(s, 'viewer'))) return false;
  return viewer?.config_json?.onboarding?.enabled === true;
}

/**
 * The two-item launcher dropdown (D1). The trigger is the Ajuda control; the
 * dropdown offers the full manual and the guided tour. Same Mantine `Menu`
 * pattern UserLogin and LocaleSelector follow; the app-root theme styles it.
 */
function HelpMenu({ trigger, manualLabel, tourLabel, onManual, onTour, manualDisabled }) {
  return (
    <Menu position="bottom-end" withinPortal shadow="md" width={220}>
      <Menu.Target>{trigger}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={onManual} disabled={manualDisabled}>{manualLabel}</Menu.Item>
        <Menu.Item onClick={onTour}>{tourLabel}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer, dispatch, Models } = config;

  const [showPopup, { open, close }] = useDisclosure(false);

  const tour = useOptionalTour();

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

  const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");
  const manualLabel = i18nUtils.translateValue("onboarding.launcher.manual", "Manual completo");
  const tourLabel = i18nUtils.translateValue("onboarding.launcher.tour", "Visita guiada");

  // The manual action mirrors the plain-button behaviour: popup opens the
  // Dialog, external opens the help URL, the default reveals the selected menu.
  function runManual() {
    if (record.as === 'popup') open();
    else if (record.as === 'external') { if (help_url) window.open(help_url); }
    else config.dispatch(actions.viewer_set_selectedmenu(record.id));
  }

  const showTour = isTourEnabled(viewer, tour);

  // The popup Dialog is shared by both the plain and the launcher paths.
  const dialog = record.as === 'popup' ? (
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
  ) : null;

  if (showTour) {
    return (
      <React.Fragment>
        <HelpMenu
          trigger={<MainMenuButton title={title} className={className} icon={<IconQuestionCircle />} />}
          manualLabel={manualLabel}
          tourLabel={tourLabel}
          manualDisabled={record.as === 'external' && !help_url}
          onManual={runManual}
          onTour={() => tour.start({ flow: 'viewer' })}
        />
        {dialog}
      </React.Fragment>
    );
  }

  if (record.as === 'popup') {
    return (
      <React.Fragment>

        <MainMenuButton
          title={title}
          className={className}
          icon={<IconQuestionCircle />}
          onClick={e => open()}
        />

        {dialog}

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

  const tour = useOptionalTour();

  const component_cfg = record.config_json || {};
  const title = record.title ? i18nUtils.translateValue(record.title, record.title) : i18nUtils.translateValue("help", "Ajuda");
  const header = component_cfg?.header ? i18nUtils.translateValue(component_cfg.header, component_cfg.header) : title;

  const isMobile = useIsMobile();

  const closeLabel = component_cfg.closeLabel ? i18nUtils.translateValue(component_cfg.closeLabel, component_cfg.closeLabel) : i18nUtils.translateValue("close", "Fechar");
  const manualLabel = i18nUtils.translateValue("onboarding.launcher.manual", "Manual completo");
  const tourLabel = i18nUtils.translateValue("onboarding.launcher.tour", "Visita guiada");

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

  // The tour launcher rides on the real topbar icon (type !== 'menu'). The
  // folded topbar menu keeps the single manual behaviour, so a nested Mantine
  // Menu does not sit inside the fold.
  const showTour = openAs !== 'panel' && type !== 'menu' && isTourEnabled(viewer, tour);

  // Render content
  function renderContent() {
    return (
      <HelpHtmlContent
        config={{...component_cfg, url: help_url}}
      />
    )
  }

  // The manual action for the launcher: popup opens the Dialog, external opens
  // the help URL.
  function runManual() {
    if (openAs === 'external') { if (help_url) window.open(help_url); }
    else open();
  }

  const dialogEl = (
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
  );

  if (showTour) {
    return (
      <React.Fragment>
        <HelpMenu
          trigger={openAs === 'external' ?
            <UnstyledButton
              title={title}
              className={component_cfg?.elementType === 'link' ? "sg-help-button-link" : "sg-help-button-external"}
              style={{ color: 'var(--mantine-color-white)' }}
            >
              { component_cfg?.elementType !== 'link' &&
                <span className="layout-topbar-item-text">{title}</span> }
              <IconQuestionCircle className="layout-topbar-icon" />
            </UnstyledButton> :
            <UnstyledButton title={title}>
              <span className="layout-topbar-item-text"></span>
              <IconQuestionCircle className="layout-topbar-icon" />
            </UnstyledButton>
          }
          manualLabel={manualLabel}
          tourLabel={tourLabel}
          manualDisabled={openAs === 'external' && !help_url}
          onManual={runManual}
          onTour={() => tour.start({ flow: 'viewer' })}
        />
        { openAs !== 'external' && dialogEl }
      </React.Fragment>
    );
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

        { dialogEl }

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
    // same chrome classes, no nested interactive controls.
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
