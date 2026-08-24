import { useContext, useEffect, useRef } from "react";
import OlFormatMVT from 'ol/format/MVT';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlVectorTileLayer from 'ol/layer/VectorTile';
import OlSourceOGCVectorTile from 'ol/source/OGCVectorTile.js';
import OlStyleStyle from "ol/style/Style";
import OlStyleStroke from "ol/style/Stroke";
import OlStyleFill from "ol/style/Fill";
import OlStyleCircle from "ol/style/Circle";
import AppContext from "../../../AppContext";
import { getResolutionForScale } from '../../model/MapModel';

/** Vector tile style from the shared WFS/Features style fields. */
function buildStyle(config) {
  const style_color = config.style_color === null ? null : (config.style_color ? `rgba(${config.style_color})` : 'black');
  const style_stroke_color = config.style_stroke_color === null ? null : (config.style_stroke_color ? `rgba(${config.style_stroke_color})` : 'black');
  const style_stroke_width = config.style_stroke_width === null ? null : (typeof config.style_stroke_width === 'undefined' ? 1 : Number(config.style_stroke_width));

  const style_objs = {
    image: new OlStyleCircle({
      radius: 6,
      fill: new OlStyleFill({ color: style_color }),
      stroke: new OlStyleStroke({ color: style_stroke_color, width: style_stroke_width })
    })
  };
  if (style_color) {
    style_objs['fill'] = new OlStyleFill({ color: style_color });
  }
  if (style_stroke_color || style_stroke_width) {
    style_objs['stroke'] = new OlStyleStroke({ color: style_stroke_color, width: style_stroke_width });
  }
  return new OlStyleStyle(style_objs);
}

const OGCVectorTileLayer = ({ config, source, group, checked }) => {

  const { mainMap } = useContext(AppContext);
  const layer = useRef();

  useEffect(() => {
    if (!mainMap) return;

    if (source && config.attributions) {
      source.setAttributions(config.attributions);
    }

    const options = { url: config.url };

    let format = new OlFormatMVT();
    if (config.mediaType === "application/geo+json") format = new OlFormatGeoJSON();

    options.format = format;
    if (config.mediaType) options.mediaType = config.mediaType;
    if (config.attributions) options.attributions = config.attributions;

    const hasStyle = config.style_color !== undefined
      || config.style_stroke_color !== undefined
      || config.style_stroke_width !== undefined;

    layer.current = new OlVectorTileLayer({
      ...config,
      visible: config.active,
      source: source ? source : new OlSourceOGCVectorTile(options),
      ...(hasStyle ? { style: buildStyle(config) } : {})
    });

    if (config.min_resolution) layer.current.setMinResolution(config.min_resolution);
    if (config.max_resolution) layer.current.setMaxResolution(config.max_resolution);
    if (config.min_scale) {
      layer.current.setMinResolution(getResolutionForScale(config.min_scale, mainMap.getView().getProjection().getUnits()));
    }
    if (config.max_scale) {
      layer.current.setMaxResolution(getResolutionForScale(config.max_scale, mainMap.getView().getProjection().getUnits()));
    }

    group.getLayers().push(layer.current);

    return () => {
      group.getLayers().remove(layer.current);
    };

  }, [mainMap]);

  // Toggle layer visibility
  useEffect(() => {
    layer.current.setVisible(checked.includes(config.id))
  }, [checked]);

  // Changed config
  useEffect(() => {
    layer.current.set('selectable', config.selectable);
    layer.current.setOpacity(config.opacity);
  }, [config]);

  return null;
};

export default OGCVectorTileLayer;
