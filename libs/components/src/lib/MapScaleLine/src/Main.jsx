import React, { useEffect, useRef, useState } from 'react';
import OlScaleLine from 'ol/control/ScaleLine';
import './style.css'

export default function Main({ config, actions }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { MapModel } = Models;
  const { getResolutionForScale, getScaleForResolution } = MapModel;

  const [scaleLineControl, setScaleLineControl] = useState(null);

  useEffect(()=>{
    if (!mainMap) return;
    const scaleLineControl = new OlScaleLine({
      target: document.getElementById('mapscale-line')
      //bar: true,
      //text: true
    });
    mainMap.addControl(scaleLineControl);
    setScaleLineControl(scaleLineControl)
  }, []);

  return (
    <div className="mapscale-line">
        <div id="mapscale-line" />
    </div>
    );
}