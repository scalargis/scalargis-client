import React from 'react';
import { useTranslation } from "react-i18next";
import { Alert, Button, Group } from '@mantine/core';
import { IconInfoCircle } from '@scalargis/ui';
import ThemesSelector from './ThemesSelector';
import WMSThemesSelector from './WMSThemesSelector';

import { I18N_NAMESPACE } from './../i18n/index';


export default function WizardStepConfirm(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  const data = props.wizardData;
  return (
    <div>

      <h2 className="mb-2">{t("confirm", "Confirmar")}</h2>

      { data.items && data.items.length > 0 ? (
        data.type === 'wms' ? (
          <WMSThemesSelector
            themes={data.items}
            selected={data.selected}
            readOnly={true}
          />
        ) : (
          <ThemesSelector
            themes={data.items}
            selected={data.selected}
            readOnly={true}
          />
        )
      ) :
        <Alert color="informative" py="xs">
          <Group justify="center" gap="xs" wrap="nowrap">
            <IconInfoCircle />
            <span>{t("noThemeSelectedMsg", "Não há nenhum tema selecionado. Volte à etapa anterior e selecione pelo menos um tema.")}</span>
          </Group>
        </Alert>
      }

      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button
          type="button"
          onClick={e => props.onSave(data)}
          disabled={props.loading || data.items.length === 0}
          style={{ marginTop: '1em' }}
        >
          {t("finish", "Concluir")}
        </Button>
      </div>
    </div>
  )
}
