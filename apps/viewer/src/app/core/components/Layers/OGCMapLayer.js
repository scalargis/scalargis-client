import { useContext, useEffect, useRef } from "react";
import OLImageLayer from "ol/layer/Image";
import OLTileLayer from 'ol/layer/Tile.js';
import OlSourceImage from "ol/source/Image";
import OLSourceImageTile from 'ol/source/ImageTile.js';
import { createXYZ, createForProjection } from 'ol/tilegrid.js';
import { load as loadImage } from "ol/Image";
import { getWidth, getHeight } from "ol/extent";

import AppContext from "../../../AppContext";
import { isUrlAppOrigin } from '../../utils';
import { getProjectionSrid, getResolutionForScale } from '../../model/MapModel';

const OGCMapLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const MAP_PROXY = core.MAP_PROXY_URL;

  const TILE_SIZE = 256;

  /** Build the OGC URI for an EPSG code. */
  function crsUri(srid) {
    return 'http://www.opengis.net/def/crs/EPSG/0/' + srid;
  }

  /** Tile grid in the map projection. */
  function mapTileGrid(projection) {
    if (getProjectionSrid(projection) === 3857) return createXYZ({ tileSize: TILE_SIZE });
    return createForProjection(projection, undefined, TILE_SIZE);
  }

  function buildUrl(mapUrl, tileGrid, srid, format, z, x, y, useProxy) {
    const [minX, minY, maxX, maxY] = tileGrid.getTileCoordExtent([z, x, y]);

    const p = new URLSearchParams({
      f: format,
      bbox: [minX, minY, maxX, maxY].join(','),
      'bbox-crs': crsUri(srid),
      crs: crsUri(srid),
      width: String(TILE_SIZE),
      height: String(TILE_SIZE),
      transparent: 'true',
    });
    const url = `${mapUrl}${p}`;
    if (useProxy && !isUrlAppOrigin(url)) return MAP_PROXY + encodeURIComponent(url);
    return url;
  }

  function createThrottledLoader({
    maxConcurrent = 4,
    maxRetries = 4,
    baseDelayMs = 500,
    mapUrl,
    tileGrid,
    srid,
    useProxy = false,
    format = 'png'
  } = {}) {
    const queue = [];
    let active = 0;

    const pump = () => {
      while (active < maxConcurrent && queue.length) {
        const job = queue.shift();
        active++;
        job().finally(() => {
          active--;
          pump();
        });
      }
    };

    const enqueue = (task, signal) =>
      new Promise((resolve, reject) => {
        queue.push(() => {
          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return Promise.resolve();
          }
          return task().then(resolve, reject);
        });
        pump();
      });

    const sleep = (ms, signal) =>
      new Promise((resolve, reject) => {
        const t = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new DOMException('Aborted', 'AbortError'));
        }, {once: true});
      });

    async function fetchImage(url, signal) {
      for (let attempt = 0; ; attempt++) {
        let retryAfterMs = null;
        try {
          const res = await fetch(url, {signal});
          if (res.ok) {
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            try {
              const img = new Image();
              img.src = objectUrl;
              await img.decode();
              return img;
            } finally {
              URL.revokeObjectURL(objectUrl);
            }
          }
          if (res.status !== 429 && res.status !== 503) {
            throw new Error(`HTTP ${res.status}`);
          }
          const ra = Number(res.headers.get('Retry-After'));
          if (ra > 0) retryAfterMs = ra * 1000;
        } catch (e) {
          if (e.name === 'AbortError') throw e;
          if (!(e instanceof TypeError) && !/HTTP (429|503)/.test(e.message)) {
            if (attempt >= maxRetries) throw e;
          }
        }
        if (attempt >= maxRetries) throw new Error(`Failed after ${attempt + 1} attempts`);
        const backoff = baseDelayMs * 2 ** attempt + Math.random() * 250;
        await sleep(retryAfterMs ?? backoff, signal);
      }
    }

    return (z, x, y, options) =>
      enqueue(() => fetchImage(buildUrl(mapUrl, tileGrid, srid, format, z, x, y, useProxy), options?.signal), options?.signal);
  }

  function createImageLayer(config) {
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

    return new_layer;
  }

  function createTiledLayer(config) {
    let base = (config.url || '');
    if (!base.toLowerCase().startsWith('http')) {
      base = window.location.origin + base;
    }
    base = base.replace(/&$/ig, '');
    base = base + (base.indexOf('?') > -1 ? '&' : '?');

    const format = config.format ? config.format : 'png';

    const projection = mainMap.getView().getProjection();
    const srid = getProjectionSrid(projection);
    const tileGrid = mapTileGrid(projection);

    const source = new OLSourceImageTile({
      projection: `EPSG:${srid}`,
      tileGrid,
      wrapX: false,
      crossOrigin: 'anonymous',
      loader: createThrottledLoader({
        mapUrl: base,
        tileGrid,
        srid,
        useProxy: !!config.use_proxy,
        format,
        maxConcurrent: 4
      })
    });

    const new_layer = new OLTileLayer({
      visible: config.active,
      source
    });

    return new_layer;
  }

  useEffect(() => {
    if (!mainMap) return;
    if (config.tiled) {
      layer.current = createTiledLayer(config);
    } else {
      layer.current = createImageLayer(config);
    }

    if (config.min_resolution) {
      layer.current.setMinResolution(config.min_resolution);
    }
    if (config.max_resolution) {
      layer.current.setMaxResolution(config.max_resolution);
    }
    if (config.min_scale) {
      const res = getResolutionForScale(config.min_scale, mainMap.getView().getProjection().getUnits());
      layer.current.setMinResolution(res);
    }
    if (config.max_scale) {
      const res = getResolutionForScale(config.max_scale, mainMap.getView().getProjection().getUnits());
      layer.current.setMaxResolution(res);
    }

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

export default OGCMapLayer;
