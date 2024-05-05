import React, { useEffect, useState } from 'react';

import { i18n as i18nUtils } from '@scalargis/components';

import './style.css';


export default function HelpHtmlContent({ config }) {

  const [dialogContent, setDialogContent ] = useState(null);

  const lang = i18nUtils.getResolvedLanguage();

  let html;
  if (typeof config?.html === "object") {
    html = config.html["default"] ? config.html["default"] : "";
    html = config.html[lang] ? config.html[lang] : html;
  } else {
    html = config?.html || "";
  }

  console.log(html);

  useEffect(() => {    
    if (config.url) {
      const url = lang ? 
        config.url.replace("{lang}", lang).replace("{language}", lang)
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