import React, { useEffect, useRef } from 'react';
import OlScaleLine from 'ol/control/ScaleLine';
import './style.css'

export default function Main({ config, actions }) {
  const { mainMap } = config;

  const targetRef = useRef(null);

  useEffect(() => {
    if (!mainMap || !targetRef.current) return;

    const scaleLineControl = new OlScaleLine({
      target: targetRef.current
    });
    mainMap.addControl(scaleLineControl);

    // The control appends its bar into the target and stays on the map until it
    // is removed. Without this, every remount added another one - which in dev is
    // every mount, since StrictMode mounts twice - and the footer showed two
    // stacked scale bars.
    return () => mainMap.removeControl(scaleLineControl);
  }, [mainMap]);

  return (
    <div className="mapscale-line">
        <div ref={targetRef} />
    </div>
    );
}
