import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

const Portal = ({children}) => {
  const el = document.createElement("div");

  const root = document.getElementById("portal-root");

  // this val and setVal is done to toggle render the portal area after
  // portalDiv is updated
  const [val, setVal] = useState(true);

  const portalDiv = useRef(null);

  // First useEffect to persist the div
  useEffect(() => {
    if ( !portalDiv.current) {
        portalDiv.current = el
        setVal(!val)
    }
  }, [portalDiv]);

  useEffect(() => {
    root.appendChild(portalDiv.current);
    return () =>{
      return root.removeChild(portalDiv.current)
    }; // you are removing it
  }, [portalDiv, root]);

  if(portalDiv.current) {
    return createPortal(children, portalDiv.current)
  }

  return null;
  // In your case as the return happened first and found out the el
};

export default Portal;