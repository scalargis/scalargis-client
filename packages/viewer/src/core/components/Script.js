import { useEffect } from 'react';

const useScript = (url, async) => {
  useEffect(() => {
    const script = document.createElement('script');

    script.src = url;
    script.async = (typeof async === 'undefined' ? true : async );

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, [url])
}

const useScriptHmtl = (code) => {
  useEffect(() => {
    const script = document.createElement('script');

    try {
      script.appendChild(document.createTextNode(code));
      document.body.appendChild(script);
    } catch (e) {
      script.text = code;
      document.body.appendChild(script);
    }    

    return () => {
      document.body.removeChild(script);
    }
  }, [code])  
}

export default function Script({ src, async=true}) {
  useScript(src, async);
  return null;
}

export function ScriptHtml({code}) {
  useScriptHmtl(code)
  return null;
}