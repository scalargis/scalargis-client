import React, { useState, useEffect } from 'react'
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import PrintGroupItem from "./PrintGroupItem";

import './style.css'

export default function PrintPanel3(props) {

  const { control, printGroup, printLayer, printDetails, setFinalPrints, fields, handleFieldChange, config, actions } = props;
  const { viewer, mainMap, dispatch, Models } = config;
  const { exclusive_mapcontrol } = viewer;

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

    //console.log(finalPrints);
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

      <div className="p-fluid">
        <Message severity="info" text={t("selectFormatAndPrints", "Selecione o formato e as plantas pretendidas e clique em Continuar")} />
      </div>

      <div className="p-fluid">
        <h4>Formato</h4>
        <Dropdown id="layout" optionLabel="label" value={fields.layout} options={formats} onChange={handleFieldChange} placeholder={t("selectFormat", "Selecione um Formato")} />
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
          <div className="p-d-flex">
            <Button label={t("none", "Nenhuma")}
              className="p-button-sm p-button-warning p-button-text"
              onClick={() => {
                setSelectedPrints([])
              }}
            />
            <Button label={t("all", "Todas")}
              style={{ float: 'right' }}
              className="p-button-sm p-button-warning p-button-text"
              onClick={() => {
                getAllPrints()
              }}
            />
          </div>
          : null}
      </div>

      <div className="card">
        <div className="p-grid">
          <div className="p-col p-text-left">
            <Button
              label={t("back", "Voltar")}
              icon="pi pi-chevron-left"
              className="p-button-sm"
              onClick={e => { goPanelPrintPrev(); }}
            />
          </div>
          <div className="p-col p-text-right">
            <Button
              label={t("continue", "Continuar")}
              icon={isLoading ? "pi pi-spin pi-spinner" : ""}
              className="p-button-sm"
              onClick={e => { goPanelPrintNext(); }}
              disabled={isLoading || selectedPrints.length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  )

}