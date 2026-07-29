import React from 'react'
import { useTranslation} from "react-i18next"
import { Alert, Group } from '@mantine/core'
import './style.css'

export default function PrintPanelNoPrints(props) {

  const { t } = useTranslation();

  return (
    <div className="print-panel1">
      <Alert color="warning" py="xs">
        <Group justify="center" gap="xs" wrap="nowrap">
          <i className="pi pi-exclamation-triangle" aria-hidden="true" />
          <span>{t("noPrintMsg", "Este visualizador não tem plantas configuradas.")}</span>
        </Group>
      </Alert>
    </div>
  )

}
