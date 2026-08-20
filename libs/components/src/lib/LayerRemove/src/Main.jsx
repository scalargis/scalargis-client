import React from 'react';
import { useTranslation} from "react-i18next";
import { ActionIcon } from '@mantine/core';
import { confirm, IconXCircle } from '@scalargis/ui';

export default function Main(props) {

  const { config } = props;
  const { layer, actions, models, viewer } = config;
  const { isComponentExcludedForLayer } = models.Utils;

  const { t } = useTranslation();

  const exclude = isComponentExcludedForLayer(viewer, layer, "LayerRemove");

  if (exclude) return null;

  return (
    <ActionIcon
      variant="subtle"
      size="md"
      radius="xl"
      className="tool"
      title={t("removeTheme", "Remover Tema")}
      aria-label={t("removeTheme", "Remover Tema")}
      onClick={() => confirm({
        header: t("removeTheme", "Remover Tema"),
        message: t("confirmAction", "Tem a certeza?"),
        severity: 'danger',
        acceptLabel: t("yes", "Sim"),
        rejectLabel: t("no", "Não"),
        accept: () => actions.removeThemes([layer.id])
      })}
    >
      <IconXCircle />
    </ActionIcon>
  )
}
