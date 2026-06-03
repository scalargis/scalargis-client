import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import OLAttribution from 'ol/control/Attribution';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';

import { isMobile } from '../utils';

export default function Attribution({ config, actions, record }) {

  const {mainMap, viewer} = config;
  const { t, i18n } = useTranslation();

  const controlRef = useRef(null);

  // Add attribution control
  useEffect(() => {
    let layer;

    if (!mainMap) return;
    if (controlRef.current) return;

    const mobile = isMobile();

    let collapsed = record.collapsed == null ? false : record.collapsed;
    if (mobile) collapsed = record.collapsed_mobile != null ? record.collapsed_mobile : collapsed;

    let collapsible = record.collapsible == null ? true : record.collapsible;
    if (mobile) collapsible = record.collapsible_mobile != null ? record.collapsible_mobile : collapsible;

    const options = {
      collapsed: collapsed,
      collapsible: collapsible,
      tipLabel: t("attributions", "Atribuições")
    }

    const control = new OLAttribution(options);
    controlRef.current = control;
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
      if (mainMap && controlRef.current) {
        mainMap.removeControl(controlRef.current);
        controlRef.current = null;
      }
    }

  }, [mainMap]);

  useEffect(() => {
    if (!controlRef.current) return;
    const btn = controlRef.current.element.querySelector('button');
    if (btn) btn.title = t("attributions", "Atribuições");
  }, [i18n.language]);

  return null;
}