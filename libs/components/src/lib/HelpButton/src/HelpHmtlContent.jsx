import React, { useEffect, useState } from 'react';

import { i18n as i18nUtils } from '../../components';

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

  useEffect(() => { 
    if (config.url) {
      fetch(config.url).then(res => {
          return res.text();
      }).then(result => {
          setDialogContent(result);
      }).catch(error => {        
          console.log('error', error);
          setDialogContent(html);
      })
    } else {
      setDialogContent(html);
    }    
  }, [lang]);

  return (
    <div dangerouslySetInnerHTML={{ __html: dialogContent }}></div>
  )

}