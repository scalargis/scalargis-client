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

const useScriptWithProps = (props) => {
  useEffect(() => {
    const script = document.createElement('script');

    for (const [key, value] of Object.entries(props)) {
      script.setAttribute(key, value);
    }

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    }
  }, [props])
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

export default function Script({ src, async=true }) {
  useScript(src, async);
  return null;
}

export function ScriptWithProps(props) {
  useScriptWithProps(props);
  return null;
}

export function ScriptHtml({code}) {
  useScriptHmtl(code)
  return null;
}