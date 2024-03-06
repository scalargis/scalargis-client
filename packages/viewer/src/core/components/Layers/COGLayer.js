import { useContext, useEffect, useRef, useState } from "react";

import OlSourceGeoTIFF from 'ol/source/GeoTIFF.js';
import OLTileLayerWebGL from 'ol/layer/WebGLTile.js';

import AppContext from "../../../AppContext";


const COGLayer = ({ config, source, group, checked }) => {

  const [loaded, setLoaded] = useState(false);

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  let proxy_requests = false;

  if (config && config.proxy_requests != null) {
    proxy_requests = config.proxy_requests;
  }

  function createLayerSource(config) {
    let sources = [];
    const { nodata, min, max, bands } = config?.options || {};

    if (Array.isArray(config.url)) {
      sources = config.url.map(s => {
        let url = s.url;

        if (proxy_requests) {
          url = core.MAP_PROXY_URL + encodeURIComponent(url);
        }

        let src = {
          url: url,
          ...{ nodata, min, max, bands }
        }

        // Remove undefined properties
        src = Object.keys(src).reduce((acc, key) => {
          if (src[key] !== undefined) {
            acc[key] = src[key];
          }
          return acc;
        }, {});

        return src;
      });
    } else {
      let url = config.url;

      if (proxy_requests) {
        url = core.MAP_PROXY_URL + encodeURIComponent(url);
      }

      let src = {
        url: url,
        ...{ nodata, min, max, bands }
      }

      // Remove undefined properties
      src = Object.keys(src).reduce((acc, key) => {
        if (src[key] !== undefined) {
          acc[key] = src[key];
        }
        return acc;
      }, {});

      sources.push(src);
    }

    const { convertToRGB, normalize, opaque, projection, transition, wrapX, interpolate } = config?.options || {};
    let source_options = { 
      sources,
      ...{ convertToRGB, normalize, opaque, projection, transition, wrapX, interpolate }
    }

    // Remove undefined properties
    source_options = Object.keys(source_options).reduce((acc, key) => {
      if (source_options[key] !== undefined) {
        acc[key] = source_options[key];
      }
      return acc;
    }, {});

    const layer_source = new OlSourceGeoTIFF({ ...source_options });

    return layer_source;
  }


  function createLayer(config) {
    const layer_source = createLayerSource(config);

    const layer =  new OLTileLayerWebGL({
        ...config,
        source: layer_source,
        style: config.options.style || undefined 
      });

    return layer;
  }
  
  useEffect(() => {
    if (!mainMap) return;

    if (config.attributions) {
      source.setAttributions(config.attributions);
    }

    layer.current = createLayer(config);
    group.getLayers().push(layer.current);

    return () => {
      group.getLayers().remove(layer.current);
    };

  }, [mainMap]);

  // Toggle layer visibility
  useEffect(() => {
    if (!layer.current) return;

    layer.current.setVisible(checked.includes(config.id))
  }, [checked]);

  // Changed opacity
  useEffect(() => {
    if (!layer.current) return;

    layer.current.setOpacity(config.opacity);
  }, [config]);

  // Changed other config options
  useEffect(() => {
    if (!loaded) {
      setLoaded(true);
      return;
    }

    if (!layer.current) return;

    const layer_source = createLayerSource(config);
    layer.current.setSource(layer_source);
  }, [config?.options]);  

  return null;
};

export default COGLayer;