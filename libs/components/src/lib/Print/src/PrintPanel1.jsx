import React from 'react'
import { useTranslation} from "react-i18next"
import { ActionIcon, Alert, Group } from '@mantine/core'
import { IconInfoCircle, IconChevronRight } from '@scalargis/ui'
import './style.css'

export default function PrintPanel1(props) {

  const { t } = useTranslation();

  function goPanelPrintGroup(group) {
    props.setPrintGroup(group);
    props.changeActivePanel("p2");
  }

  function goPanelPrintItem(item) {
    props.setPrintItem(item);
    props.changeActivePanel("p2-item");
  }

  const { viewer } = props.config;

  return (
    <div className="print-panel1">
      <Alert color="informative" py="xs">
        <Group justify="center" gap="xs" wrap="nowrap">
          <IconInfoCircle />
          <span>{t("selectPrintTypeMsg", "Escolha o tipo de planta que pretende emitir.")}</span>
        </Group>
      </Alert>

      { (viewer.printing && viewer.printing.groups) && viewer.printing.groups.map( (group, index) => {
        return (
          <div key={index}>
            <ActionIcon variant="subtle" radius="xl"
              title={group.title}
              aria-label={group.title}
              onClick={e => { goPanelPrintGroup(group) }}>
              <IconChevronRight />
            </ActionIcon>
            <h4 className="print-link" onClick={e => { goPanelPrintGroup(group) }}>{group.title}</h4>
            <p>{group.description}</p>
          </div>
        )
      })}
      { (viewer.printing && viewer.printing.prints) && viewer.printing.prints.map( (print, index) => {
        return (
          <div key={index}>
            <ActionIcon variant="subtle" radius="xl"
              title={print.title}
              aria-label={print.title}
              onClick={e => { goPanelPrintItem(print) }}>
              <IconChevronRight />
            </ActionIcon>
            <h4 className="print-link" onClick={e => { goPanelPrintItem(print) }}>{print.title}</h4>
            <p>{print.description}</p>
          </div>
        )
      })}

    </div>
  )

}
