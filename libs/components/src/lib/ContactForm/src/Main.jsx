import React from 'react';
import { useTranslation} from "react-i18next";
import { Button, Group, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CollapsiblePanel, Dialog, useIsMobile, IconQuestionCircle, IconEnvelope } from '@scalargis/ui';

import { MainMenuButton } from '../../components';

import ContactForm from './ContactForm';
import ContactInfo from './ContactInfo';

import './index.css';

// As regiões do rodapé do viewer (`FooterLeft.jsx` / `FooterRight.jsx`). O
// `Core.renderComponents` já as monta como qualquer outra região - o que não
// servia era o markup: o ramo genérico do `Main` emite as classes
// `layout-topbar-*`, que no rodapé pintam um ícone à escala do topbar.
const FOOTER_REGIONS = ['footer_left', 'footer_right'];

/**
 * Main menu component
 */
export function MainMenu({ className, core, config, actions, record }) {

  const { viewer, dispatch, Models } = config;

  const { t } = useTranslation();

  const [showPopup, { open, close }] = useDisclosure(false);

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title || t("contactForm", "Formulário de Contacto");

  const isMobile = useIsMobile();

  function renderContent() {
    return (
      component_cfg.hideForm !== true ?
      <ContactForm
        core={core}
        viewer={viewer}
        dispatch={dispatch}
        config={component_cfg}
        Utils={Models.Utils}
      />
      :
      <ContactInfo
        core={core}
        viewer={viewer}
        dispatch={dispatch}
        config={component_cfg}
        Utils={Models.Utils}
      />
    )
  }

  if (record.as === 'popup') {
    const closeLabel = component_cfg.closeLabel || t("close", "Fechar");
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
          size={isMobile ? '90%' : '45vw'}
          onClose={close}
          footer={<Button onClick={close}>{closeLabel}</Button>}>

          { renderContent() }

        </Dialog>

      </React.Fragment>
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

export default function Main({ region, as, core, config, actions, record }) {

  const { viewer, dispatch, Models } = config;

  const { t } = useTranslation();

  const [showForm, { open, close }] = useDisclosure(false);

  const component_cfg = record.config_json || {};
  const title = record.title || '';
  const header = component_cfg.header || title || t("contactForm", "Formulário de Contacto");

  const isMobile = useIsMobile();

  const closeLabel = component_cfg.closeLabel || t("close", "Fechar");

  function renderContent() {
    return  (
      component_cfg.hideForm !== true ?
      <ContactForm
        core={core}
        viewer={viewer}
        dispatch={dispatch}
        config={component_cfg}
        Utils={Models.Utils}
      />
      :
      <ContactInfo
        core={core}
        viewer={viewer}
        dispatch={dispatch}
        config={component_cfg}
        Utils={Models.Utils}
      />
    )
  }

  if (as === 'panel') {
   return (
    <CollapsiblePanel header={header} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
   )
  }

  // O rodapé é uma tira de 35px ao lado do "© ... ScalarGIS": leva um ícone à
  // escala do rodapé (mais um label opcional), não o ícone do topbar. O modal é
  // o mesmo dos outros targets - só muda o trigger.
  const isFooter = FOOTER_REGIONS.includes(region);

  // `footerLabel: ""` deixa o trigger só com o ícone; ausente cai no default.
  const footerLabel = component_cfg.footerLabel !== undefined
    ? component_cfg.footerLabel
    : t("contact", "Contacto");

  const trigger = isFooter ? (
    <UnstyledButton
      className="contactform-footer-button"
      onClick={e => open()}
      title={footerLabel || t("contact", "Contacto")}
      aria-label={footerLabel || t("contact", "Contacto")}
    >
      <IconEnvelope className="contactform-footer-icon" />
      { footerLabel && <span className="contactform-footer-label">{footerLabel}</span> }
    </UnstyledButton>
  ) : (
    <UnstyledButton onClick={e => open()} title={t("contact", "Contacto")}>
      <span className="layout-topbar-item-text"></span>
      <IconEnvelope className="layout-topbar-icon" style={{ fontSize: '2em' }} />
    </UnstyledButton>
  );

  return (
    <React.Fragment>
      { trigger }

      <Dialog
        title={header}
        opened={showForm}
        size={isMobile ? '90%' : '45vw'}
        onClose={close}
        footer={<Button onClick={close}>{closeLabel}</Button>}>

        { renderContent() }

      </Dialog>

    </React.Fragment>
  )

}
