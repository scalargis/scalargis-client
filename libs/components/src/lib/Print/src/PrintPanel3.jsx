import React, { useState, useEffect } from 'react'
import { useTranslation} from "react-i18next";
import { Alert, Button, Group, Select } from '@mantine/core';
import PrintGroupItem from "./PrintGroupItem";

import './style.css'

export default function PrintPanel3(props) {

  const { printGroup, printDetails, setFinalPrints, fields, handleFieldChange, config, actions } = props;

  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [formats, setFormats] = useState(null);

  const [selectedPrints, setSelectedPrints] = useState([...printDetails.selected]);

  function goPanelPrintPrev() {
    props.changeActivePanel('p2');
  }


  function getAllPrints() {
    const allPrintsUUID = [];

    function getPrintsRecursive(group) {
      group.prints.forEach(p => {
        if (p.uuid) {
          allPrintsUUID.push(p.uuid);
        }
      })
      group.children.forEach(c => {
        getPrintsRecursive(c);
      })
    }
    getPrintsRecursive(printDetails);
    setSelectedPrints(allPrintsUUID);
  }


  function goPanelPrintNext() {
    const finalPrints = [];

    function getSelectedPrintsRecursive(group) {
      group.prints.forEach(p => {
        if (selectedPrints.includes(p.uuid)) {
          const print = {
            ...p,
            groupId: group.id,
            groupTitle: group.title,
            processed: false,
            error: false
          }

          finalPrints.push(print);
        }
      })
      group.children.forEach(c => {
        getSelectedPrintsRecursive(c);
      })
    }

    getSelectedPrintsRecursive(printDetails);

    setFinalPrints(finalPrints);
    props.changeActivePanel('p4');
  }

  useEffect(() => {
    const frmts = {};

    printDetails.layouts.group.forEach((g) => {
      const { format, orientation } = g;
      const key = format + '-' + orientation;
      if (!frmts[key]) frmts[key] = { format, orientation, label: format + ' - ' + orientation }
    });
    printDetails.layouts.prints.forEach((p) => {
      const { format, orientation } = p;
      const key = format + '-' + orientation;
      if (!frmts[key]) frmts[key] = { format, orientation, label: format + ' - ' + orientation }
    });

    const ff = [];
    Object.keys(frmts).forEach(function (k) {
      ff.push(frmts[k]);
    });

    setFormats(ff);

    if (ff.length > 0) handleFieldChange({ target: { id: 'layout', value: ff[0] } });

  }, []);

  return (
    <div className="print-panel3">
      <h3>{printDetails.title}</h3>

      <Alert color="informative" py="xs">
        <Group justify="center" gap="xs" wrap="nowrap">
          <i className="pi pi-info-circle" aria-hidden="true" />
          <span>{t("selectFormatAndPrints", "Selecione o formato e as plantas pretendidas e clique em Continuar")}</span>
        </Group>
      </Alert>

      <div className="p-fluid">
        <h4>Formato</h4>
        <Select id="layout"
          aria-label="Formato"
          data={(formats || []).map(f => ({ value: f.format + '|' + f.orientation, label: f.label }))}
          value={fields.layout ? fields.layout.format + '|' + fields.layout.orientation : null}
          onChange={(v) => {
            const f = (formats || []).find(x => x.format + '|' + x.orientation === v);
            if (f) handleFieldChange({ target: { id: 'layout', value: f } });
          }}
          allowDeselect={false}
          placeholder={t("selectFormat", "Selecione um Formato")} />
      </div>

      <div className="p-fluid">
        <h4>Plantas</h4>
        <PrintGroupItem
          config={config}
          actions={actions}
          printGroup={printGroup}
          printDetails={printDetails}
          groupItem={printDetails}
          selectedPrints={selectedPrints}
          setSelectedPrints={setSelectedPrints}
        />
        {(printDetails.allow_selection && (printDetails.children.length + printDetails.prints.length > 1)) ?
          <Group justify="space-between">
            <Button size="xs" variant="subtle" color="warning"
              onClick={() => {
                setSelectedPrints([])
              }}
            >
              {t("none", "Nenhuma")}
            </Button>
            <Button size="xs" variant="subtle" color="warning"
              onClick={() => {
                getAllPrints()
              }}
            >
              {t("all", "Todas")}
            </Button>
          </Group>
          : null}
      </div>

      <Group justify="space-between" mt="md">
        <Button
          size="xs"
          leftSection={<i className="pi pi-chevron-left" aria-hidden="true" />}
          onClick={e => { goPanelPrintPrev(); }}
        >
          {t("back", "Voltar")}
        </Button>
        <Button
          size="xs"
          loading={isLoading}
          disabled={isLoading || selectedPrints.length === 0}
          onClick={e => { goPanelPrintNext(); }}
        >
          {t("continue", "Continuar")}
        </Button>
      </Group>
    </div>
  )

}
