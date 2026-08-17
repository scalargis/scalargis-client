import React from 'react';
import { useTranslation} from "react-i18next";

import { ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Dialog, useIsMobile } from '@scalargis/ui';

import ThemeInfo from './ThemeInfo';


export default function Main({ core, config }) {

  const { layer, viewer, mainMap, actions, models } = config;
  const { isComponentExcludedForLayer } = models.Utils;

  const { t } = useTranslation(["common", "custom"]);

  const [opened, { open, close }] = useDisclosure(false);

  const isMobile = useIsMobile();

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
        onClick={e => open()}
      >
        <i className="pi pi-info-circle" aria-hidden="true" />
      </ActionIcon>

      <Dialog
        title={t("themeInfo", "Informação do Tema")}
        opened={opened}
        size={isMobile ? '90%' : '50vw'}
        onClose={close}>
        <ThemeInfo
          viewer={viewer}
          mainMap={mainMap}
          core={core}
          models={models}
          theme={layer}
          downloadTheme={theme => actions.downloadTheme(theme)}
        />
      </Dialog>
    </React.Fragment>
  )
}
