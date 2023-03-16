import { useEffect } from 'react';

const useStyle = (url, async) => {
  useEffect(() => {
    const elem = document.createElement('link');

    elem.href = url;
    elem.rel = 'stylesheet';
    elem.type = 'text/css';
    elem.async = (typeof async === 'undefined' ? true : async );

    document.body.appendChild(elem);

    return () => {
      document.body.removeChild(elem);
    }
  }, [url])
}

const useStyleHtml = (style) => {
  useEffect(() => {
    const elem = document.createElement('style');
    elem.type = 'text/css';

    try {
      elem.appendChild(document.createTextNode(style));
      document.body.appendChild(elem);
    } catch (e) {
      elem.text = style;
      document.body.appendChild(elem);
    }

    return () => {
      document.body.removeChild(elem);
    }
  }, [style])  
}

export default function Style({ src, async=true}) {
  useStyle(src, async);
  return null;
}

export function StyleHtml({style, onLoaded}) {
  useStyleHtml(style);
  if (onLoaded) onLoaded();
  return null;
}