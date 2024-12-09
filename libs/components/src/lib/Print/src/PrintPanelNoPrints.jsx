import React, { useState, useEffect } from 'react'
import { useTranslation} from "react-i18next"
import { Message } from 'primereact/message'
import './style.css'

export default function PrintPanelNoPrints(props) {

  const { viewer, mainMap, dispatch, Models } = props.config;
  const control = props.control;
  const actions = props.actions;

  const { i18n, t } = useTranslation();

  return (
    <div className="print-panel1">  
      <Message
        severity="warn"
        text={t("noPrintMsg", "Este visualizador não tem plantas configuradas.")} 
      />
    </div>
  )

}