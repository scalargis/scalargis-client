import React, { useState, useEffect } from 'react'
import { Message } from 'primereact/message';
import './style.css'

export default function PrintPanelNoPrints(props) {

  const { viewer, mainMap, dispatch, Models } = props.config;
  const control = props.control;
  const actions = props.actions;

  return (
    <div className="print-panel1">  
      <Message
        severity="warn"
        text={"Este visualizador não tem plantas configuradas."} 
      />
    </div>
  )

}