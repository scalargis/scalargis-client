import React, { useState, useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import './style.css'

export default function PrintPanel1(props) {

  const { viewer, mainMap, dispatch, Models } = props.config;
  const control = props.control;
  const actions = props.actions;

  const { i18n, t } = useTranslation();

  function goPanelPrintGroup(group) {
    props.setPrintGroup(group);
    props.changeActivePanel("p2");
  }

  function goPanelPrintItem(item) {
    props.setPrintItem(item);
    props.changeActivePanel("p2-item");
  }  

  return (
    <div className="print-panel1">  
      <Message
        severity="info"
        text={t("selectPrintTypeMsg", "Escolha o tipo de planta que pretende emitir.")} 
      />

      { (viewer.printing && viewer.printing.groups) && viewer.printing.groups.map( (group, index) => {
        return (
          <div key={index}>
            <Button label="" 
              icon="pi pi-chevron-right" 
              className="p-button-rounded p-button-text"
              onClick={e => { goPanelPrintGroup(group) }} />
            <h4 className="print-link" onClick={e => { goPanelPrintGroup(group) }}>{group.title}</h4>
            <p>{group.description}</p>
          </div>
        )
      })}
      { (viewer.printing && viewer.printing.prints) && viewer.printing.prints.map( (print, index) => {
        return (
          <div key={index}>
            <Button label="" icon="pi pi-chevron-right" 
              className="p-button-rounded p-button-text"
              onClick={e => { goPanelPrintItem(print) }} />
            <h4 className="print-link" onClick={e => { goPanelPrintItem(print) }}>{print.title}</h4>
            <p>{print.description}</p>
          </div>
        )
      })}

    </div>
  )

}