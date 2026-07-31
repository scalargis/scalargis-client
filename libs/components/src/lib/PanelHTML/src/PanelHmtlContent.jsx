import React, { useEffect, useState } from 'react';
import './style.css'


export default function PanelHtmlContent({ config }) {

  const [dialogContent, setDialogContent ] = useState(null);

  useEffect(() => {
    if (!config.url) {
      setDialogContent(config.html || '');
      return;
    }

    // Aborted on unmount: without it the effect's fetch outlives the mount, which
    // is why one click on the help button asked for the file twice (StrictMode
    // mounts, unmounts and mounts again), and why a slow answer could land on an
    // unmounted component.
    const controller = new AbortController();

    fetch(config.url, { signal: controller.signal })
      .then(res => res.text())
      .then(result => {
        setDialogContent(result);
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        setDialogContent(config.html || '');
      })

    return () => controller.abort();
  }, []);

  return (
    <div dangerouslySetInnerHTML={{ __html: dialogContent }}></div>
  )

}