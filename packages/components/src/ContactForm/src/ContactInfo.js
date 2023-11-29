import React, { useState, useRef } from 'react'
import { useTranslation} from "react-i18next";
import './style.css'

export default function ContactInfo(props) {

  const { viewer, config } = props;

  const { i18n } = useTranslation();

  const contact_info = config.contact_info || viewer.contact_info;

  if (config?.hideContactInfo === true || !contact_info) {
    return null
  }

  let html_contacto_info = contact_info || '';
  if (typeof contact_info === "object") {
    html_contacto_info = contact_info['default'] || '';
    if (html_contacto_info[i18n.resolvedLanguage]) {
      html_contacto_info = contact_info[i18n.resolvedLanguage];
    }
  }
  
  return (
    contact_info && 
      <div dangerouslySetInnerHTML={{__html: html_contacto_info}}></div>            
  )

}