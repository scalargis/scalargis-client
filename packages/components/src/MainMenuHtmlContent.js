import React, { useState, useEffect } from 'react'

export function MainMenu({ region, as, config, actions, record }) {
  const component_cfg = record.config_json || {};
  const title = record.title || '';

  const [htmlContent, setHtmlContent ] = useState(null);

  useEffect(() => {    
    if (component_cfg.url) {
      const url = component_cfg.url;
      fetch(url).then(res => {
          return res.text();
      }).then(result => {
          setHtmlContent(result);
      }).catch(error => {        
          setHtmlContent(component_cfg.html || '');
      })
    } else {
      setHtmlContent(component_cfg.html || '');
    }    
  }, []);  

  return (
    <div 
      title={title}
      className={component_cfg.classname ? component_cfg.classname : null} 
      dangerouslySetInnerHTML={{ __html: htmlContent }} />
  )
}