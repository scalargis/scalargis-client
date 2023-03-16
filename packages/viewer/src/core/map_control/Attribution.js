import React, { useEffect, useState } from 'react';
import OLAttribution from 'ol/control/Attribution';
import { isMobile } from '../utils';

export default function Attribution({ config, actions, record }) {

  const {mainMap, viewer} = config;

  const [controlLoaded, setControlLoaded] = useState(false);

  useEffect(() => {
  }, []);

  // Add attribution control
  useEffect(() => {
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

  }, [mainMap]);

  return null;
}