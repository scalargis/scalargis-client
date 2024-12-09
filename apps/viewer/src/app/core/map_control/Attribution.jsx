import React, { useEffect, useRef, useState } from 'react';
import OLAttribution from 'ol/control/Attribution';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';

import { isMobile } from '../utils';

export default function Attribution({ config, actions, record }) {

  const {mainMap, viewer} = config;

  const [controlLoaded, setControlLoaded] = useState(false);

  // Add attribution control
  useEffect(() => {
    let layer;

    if (!mainMap) return;
    if (controlLoaded) return;
    
    setControlLoaded(true);

    const mobile = isMobile();

    let collapsed = record.collapsed == null ? false : record.collapsed;
    if (mobile) collapsed = record.collapsed_mobile != null ? record.collapsed_mobile : collapsed;

    let collapsible = record.collapsible == null ? true : record.collapsible;
    if (mobile) collapsible = record.collapsible_mobile != null ? record.collapsible_mobile : collapsible;

    const options = {
      collapsed: collapsed,
      collapsible: collapsible
    }

    const control = new OLAttribution(options);
    mainMap.addControl(control);

    //Add layer for global attribution
    const attributions = viewer?.config_json?.attributions || viewer?.attributions;
    if (attributions) {
      layer = new VectorLayer({
        source: new Vector({
          attributions: attributions
        })
      });

      mainMap.getLayers().insertAt(0, layer);
    }

    return () => {
      if (mainMap && layer) mainMap.removeLayer(layer);
    }

  }, [mainMap]);

  return null;
}