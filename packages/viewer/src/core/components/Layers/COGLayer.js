import { useContext, useEffect, useRef } from "react";

import OlSourceGeoTIFF from 'ol/source/GeoTIFF.js';
import OLTileLayerWebGL from 'ol/layer/WebGLTile.js';

import AppContext from "../../../AppContext";


const COGLayer = ({ config, source, group, checked }) => {

  //console.log({ config, source, group, checked });

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const MAP_PROXY = core.MAP_PROXY_URL;

  function createLayer(config) {
    let sources = [];
    const { nodata, min, max, bands } = config?.options || {};

    if (Array.isArray(config.url)) {
      sources = config.url.map(s => {
        let src = {
          url: s.url,
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
      let src = {
        url: config.url,
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

    /*
    const options = {}
    if (Array.isArray(source)) {
        options["sources"] = [source];
    } else {
        options["source"] = source;
    }
    */

    const layer =  new OLTileLayerWebGL({
        ...config,
        //...options
        sources: [layer_source]
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
    layer.current.setVisible(checked.includes(config.id))
  }, [checked]);

  // Changed config
  useEffect(() => {
    layer.current.setOpacity(config.opacity);
  }, [config]);  

  return null;
};

export default COGLayer;