import React from 'react';
import { useTranslation} from "react-i18next";
import { Slider } from '@mantine/core';


export default function Main({ config }) {

  const { layer, actions, except } = config;

  const { t } = useTranslation();

  //// Use except prop to exclude from selected layers
  //if (except && except.includes(layer.id)) return null;

  // Use layers.exclude_components prop to exclude component
  if (layer && layer.exclude_components && layer.exclude_components.includes('LayerOpacity')) return null;

  // Render component
  return (
    <div title={t("setTransparency", "Definir Transparência")} className="toc-slider-wrapper">
      <Slider
        size="sm"
        min={1}
        max={100}
        value={layer.opacity * 100}
        label={(value) => `${Math.round(value)}%`}
        aria-label={t("setTransparency", "Definir Transparência")}
        onChange={value => actions.opacity(null, layer, value)}
      />
    </div>
  )
}
