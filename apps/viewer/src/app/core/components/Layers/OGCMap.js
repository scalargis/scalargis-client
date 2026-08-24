import { useContext, useEffect, useRef } from "react";
import OLImageLayer from "ol/layer/Image";
import OlSourceImage from "ol/source/Image";
import { load as loadImage } from "ol/Image";
import { getWidth, getHeight } from "ol/extent";

import AppContext from "../../../AppContext";
import { isUrlAppOrigin } from '../../utils';
import { getProjectionSrid, getResolutionForScale } from '../../model/MapModel';

const OGCMap = ({ config, group, checked }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const MAP_PROXY = core.MAP_PROXY_URL;

  /** Build the OGC URI for an EPSG code. */
  function crsUri(srid) {
    return 'http://www.opengis.net/def/crs/EPSG/0/' + srid;
  }

  function createLayer(config) {
    const proj = mainMap.getView().getProjection().getCode();
    const srid = config.crs ? config.crs : getProjectionSrid(proj);
    const uri = crsUri(srid);
    const format = config.format ? config.format : 'png';

    const source = new OlSourceImage({
      attributions: config.attributions || [],
      loader: (extent, resolution, pixelRatio) => {
        const imageResolution = resolution / pixelRatio;
        const width = Math.round(getWidth(extent) / imageResolution);
        const height = Math.round(getHeight(extent) / imageResolution);

        let base = (config.url || '');
        if (!base.toLowerCase().startsWith('http')) {
          base = window.location.origin + base;
        }
        base = base.replace(/&$/ig, '');
        base = base + (base.indexOf('?') > -1 ? '&' : '?');

        const params = [];
        params.push('f=' + format);
        params.push('width=' + width);
        params.push('height=' + height);
        params.push('crs=' + encodeURIComponent(uri));
        params.push('bbox-crs=' + encodeURIComponent(uri));
        params.push('bbox=' + extent.join(','));

        let src = base + params.join('&');
        if (config.use_proxy && !isUrlAppOrigin(src)) {
          src = MAP_PROXY + encodeURIComponent(src);
        }

        const image = new Image();
        if (typeof config.crossOrigin !== 'undefined') {
          image.crossOrigin = config.crossOrigin;
        }
        return loadImage(image, src).then(img => ({ image: img, extent, pixelRatio }));
      }
    });

    const new_layer = new OLImageLayer({
      ...config,
      visible: config.active,
      source
    });

    if (new_layer && config.min_resolution) {
      new_layer.setMinResolution(config.min_resolution);
    }
    if (new_layer && config.max_resolution) {
      new_layer.setMaxResolution(config.max_resolution);
    }
    if (new_layer && config.min_scale) {
      const res = getResolutionForScale(config.min_scale, mainMap.getView().getProjection().getUnits());
      new_layer.setMinResolution(res);
    }
    if (new_layer && config.max_scale) {
      const res = getResolutionForScale(config.max_scale, mainMap.getView().getProjection().getUnits());
      new_layer.setMaxResolution(res);
    }

    return new_layer;
  }

  useEffect(() => {
    if (!mainMap) return;

    layer.current = createLayer(config);
    group.getLayers().push(layer.current);

    return () => {
      group.getLayers().remove(layer.current);
    };

  }, [mainMap]);

  // Toggle layer visibility
  useEffect(() => {
    layer.current.setVisible(checked.includes(config.id));
  }, [checked]);

  // Changed config
  useEffect(() => {
    layer.current.setProperties(config);
    layer.current.set('selectable', config.selectable);
    layer.current.setOpacity(config.opacity);
  }, [config]);

  return null;
};

export default OGCMap;
