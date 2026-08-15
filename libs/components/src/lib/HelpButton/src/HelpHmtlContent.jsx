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
    if (!config.url) {
      setDialogContent(html);
      return;
    }

    // See the twin in PanelHtmlContent: the fetch is aborted on unmount, so the
    // StrictMode remount stops asking for the help file twice and a late answer
    // cannot set state on a component that is gone.
    const controller = new AbortController();

    // The caller resolves the language in the URL and passes it in already filled.
    fetch(config.url, { signal: controller.signal })
      .then(res => res.text())
      .then(result => {
        setDialogContent(result);
      })
      .catch(error => {
        if (error.name === 'AbortError') return;
        setDialogContent(html);
      })

    return () => controller.abort();
  }, [lang]);

  return (
    <div dangerouslySetInnerHTML={{ __html: dialogContent }}></div>
  )

}