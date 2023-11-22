import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";

import './style.css';


export default function HelpHtmlContent({ config }) {

  const [dialogContent, setDialogContent ] = useState(null);

  const { i18n } = useTranslation(["common", "custom"]);

  let html;
  if (typeof config?.html === "object") {
    html = config.html["default"] ? config.html["default"] : "";
    html = config.html[i18n.language] ? config.html[i18n.language] : html;
  } else {
    html = config?.html || "";
  }

  useEffect(() => {    
    if (config.url) {
      const url = i18n.language ? 
        config.url.replace("{lang}", i18n.language).replace("{language}", i18n.language)
        : config.url;
      fetch(url).then(res => {
          return res.text();
      }).then(result => {
          //console.log(result);
          setDialogContent(result);
      }).catch(error => {        
          //console.log('error', error);
          setDialogContent(html);
      })
    } else {
      setDialogContent(html);
    }    
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: dialogContent }}></div>
  )

}