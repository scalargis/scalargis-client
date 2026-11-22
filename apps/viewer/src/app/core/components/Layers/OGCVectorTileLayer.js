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

  const MAX_CONCURRENT = 4;
  const MAX_RETRIES = 3;
  let active = 0;
  const queue = [];

  function runNext() {
    while (active < MAX_CONCURRENT && queue.length) {
      active++;
      queue.shift()().finally(() => { active--; runNext(); });
    }
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function fetchWithRetry(url, attempt = 0) {
    const res = await fetch(url);
    if (res.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('Retry-After'));
      const delay = retryAfter ? retryAfter * 1000 : 500 * 2 ** attempt;
      await sleep(delay);
      return fetchWithRetry(url, attempt + 1);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.arrayBuffer();
  }

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
      preload: 0,                    // não pré-carrega níveis de zoom inferiores
      updateWhileAnimating: false,
      updateWhileInteracting: false, // só pede tiles quando o movimento termina
      visible: config.active,
      source: source ? source : new OlSourceOGCVectorTile({
        ...options,
        tileLoadFunction: (tile, url) => {
          tile.setLoader((extent, resolution, projection) => {
            queue.push(async () => {
              try {
                const data = await fetchWithRetry(url);
                const format = tile.getFormat();
                tile.setFeatures(
                  format.readFeatures(data, {
                    extent,
                    featureProjection: projection,
                  })
                );
              } catch (e) {
                tile.setState(3); // TileState.ERROR
              }
            });
            runNext();
          });
        }
      }),
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
    layer.current.setProperties(config);
    layer.current.set('selectable', config.selectable);
    layer.current.setOpacity(config.opacity);
    layer.current.setStyle(buildStyle(config))
    layer.current.changed();
  }, [config]);

  return null;
};

export default OGCVectorTileLayer;
