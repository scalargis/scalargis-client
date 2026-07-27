import React, { useState } from 'react';
import { useTranslation} from "react-i18next";

import { ActionIcon, Modal } from '@mantine/core';

import ThemeInfo from './ThemeInfo';


export default function Main({ core, config }) {

  const { layer, viewer, mainMap, actions, models } = config;
  const { getWindowSize, isComponentExcludedForLayer } = models.Utils;

  const { t } = useTranslation(["common", "custom"]);

  const [modalThemeInfoOpen, setModalThemeInfoOpen] = useState(false);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const exclude = isComponentExcludedForLayer(viewer, layer, "LayerMetadata");

  if (exclude) return null;

  return (
    <React.Fragment>

      <ActionIcon
        variant="subtle"
        size="md"
        radius="xl"
        className="tool"
        title={t("metadataInfo", "Informação de Metadados")}
        aria-label={t("metadataInfo", "Informação de Metadados")}
        onClick={e => setModalThemeInfoOpen(layer)}
      >
        <i className="pi pi-info-circle" aria-hidden="true" />
      </ActionIcon>

      <Modal
        title={t("themeInfo", "Informação do Tema")}
        opened={!!modalThemeInfoOpen}
        size={isMobile ? '90%' : '50vw'}
        onClose={e => setModalThemeInfoOpen(false)}>
        <ThemeInfo
          viewer={viewer}
          mainMap={mainMap}
          core={core}
          models={models}
          theme={modalThemeInfoOpen}
          downloadTheme={theme => actions.downloadTheme(theme)}
        />
      </Modal>
    </React.Fragment>
  )
}
