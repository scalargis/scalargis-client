import React, { useState, useRef } from 'react'
import './style.css'

export default function ContactInfo(props) {

  const { viewer, config } = props;

  const contact_info = config.contact_info || viewer.contact_info;

  if (config?.hideContactInfo === true || !contact_info) {
    return null
  }

  return (
    contact_info && 
      <div dangerouslySetInnerHTML={{__html: contact_info}}></div>            
  )

}