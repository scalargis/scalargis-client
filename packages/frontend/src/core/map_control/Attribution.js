import React, { useEffect, useState } from 'react'
import OLAttribution from 'ol/control/Attribution';

export default function Attribution({ config, actions, record }) {

  const [controlLoaded, setControlLoaded] = useState(false);
  const {mainMap, viewer} = config;
  const attribution_control = viewer.config_json.map_controls.find(c => c.id === 'Attribution');

  useEffect(() => {
  }, []);

  // Add attribution control
  useEffect(() => {
    if (!mainMap) return;
    if (controlLoaded) return;
    
    setControlLoaded(true);

    const options = {
      collapsed: attribution_control.collapsed == null ? false : attribution_control.collapsed,
      collapsible: attribution_control.collapsible == null ? true : attribution_control.collapsible
    }

    const control = new OLAttribution(options);
    mainMap.addControl(control);

  }, [mainMap]);

  return null;
}