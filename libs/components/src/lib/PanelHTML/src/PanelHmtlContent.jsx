import React, { useEffect, useState } from 'react';
import './style.css'


export default function PanelHtmlContent({ config }) {

  const [dialogContent, setDialogContent ] = useState(null);

  useEffect(() => {    
    if (config.url) {
      const url = config.url;
      fetch(url).then(res => {
          return res.text();
      }).then(result => {
          //console.log(result);
          setDialogContent(result);
      }).catch(error => {        
          //console.log('error', error);
          setDialogContent(config.html || '');
      })
    } else {
      setDialogContent(config.html || '');
    }    
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: dialogContent }}></div>
  )

}