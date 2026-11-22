import { useContext, useEffect, useRef } from "react";
import OLImageLayer from "ol/layer/Image";
import OLTileLayer from 'ol/layer/Tile.js';
import OlSourceImage from "ol/source/Image";
import OLSourceImageTile from 'ol/source/ImageTile.js';
import {createXYZ} from 'ol/tilegrid.js';
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
  // Grelha XYZ em EPSG:3857
  const MAP_SRID = mainMap ? getProjectionSrid(mainMap.getView().getProjection()) : 3857;
  const tileGrid = createXYZ({tileSize: TILE_SIZE});

  /** Build the OGC URI for an EPSG code. */
  function crsUri(srid) {
    return 'http://www.opengis.net/def/crs/EPSG/0/' + srid;
  }

  function buildUrl(mapUrl, format, z, x, y) {
    const [minX, minY, maxX, maxY] = tileGrid.getTileCoordExtent([z, x, y]);

    const p = new URLSearchParams({
      f: format,
      bbox: [minX, minY, maxX, maxY].join(','),
      'bbox-crs': crsUri(MAP_SRID),
      crs: crsUri(MAP_SRID),
      width: String(TILE_SIZE),
      height: String(TILE_SIZE),
      transparent: 'true',
    });
    return `${mapUrl}?${p}`;
  }

  function createThrottledLoader({
    maxConcurrent = 4,
    maxRetries = 4,
    baseDelayMs = 500,
    mapUrl,
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
          // tile já cancelado (utilizador fez pan/zoom): não pede ao servidor
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
          // TypeError "Failed to fetch": típico de 429 sem CORS, também repete
          if (!(e instanceof TypeError) && !/HTTP (429|503)/.test(e.message)) {
            if (attempt >= maxRetries) throw e;
          }
        }
        if (attempt >= maxRetries) throw new Error(`Falhou após ${attempt + 1} tentativas`);
        const backoff = baseDelayMs * 2 ** attempt + Math.random() * 250;
        await sleep(retryAfterMs ?? backoff, signal);
      }
    }

    return (z, x, y, options) =>
      enqueue(() => fetchImage(buildUrl(mapUrl, format, z, x, y), options?.signal), options?.signal);
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

    const source = new OLSourceImageTile({
      projection: `EPSG:${MAP_SRID}`,
      tileGrid,
      wrapX: false,          // evita pedidos de tiles fora do mundo
      crossOrigin: 'anonymous',
      loader: createThrottledLoader({mapUrl: base, format: format, maxConcurrent: 4}),
      /*
      url: (z, x, y) => {
        const [minX, minY, maxX, maxY] = tileGrid.getTileCoordExtent([z, x, y]);
        const params = new URLSearchParams({
          f: format,                                // ou image/png, conforme o servidor
          bbox: [minX, minY, maxX, maxY].join(','),
          'bbox-crs': CRS_3857,
          crs: CRS_3857,                           // CRS da imagem devolvida
          width: String(TILE_SIZE),
          height: String(TILE_SIZE),
          transparent: 'true'
        });

        let mapUrl = `${base}${params}`;
        if (config.use_proxy && !isUrlAppOrigin(mapUrl)) {
          mapUrl = MAP_PROXY + encodeURIComponent(mapUrl);
        }

        return mapUrl;
      },
      */
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

    if (layer && config.min_resolution) {
      layer.setMinResolution(config.min_resolution);
    }
    if (layer && config.max_resolution) {
      layer.setMaxResolution(config.max_resolution);
    }
    if (layer && config.min_scale) {
      const res = getResolutionForScale(config.min_scale, mainMap.getView().getProjection().getUnits());
      layer.setMinResolution(res);
    }
    if (layer && config.max_scale) {
      const res = getResolutionForScale(config.max_scale, mainMap.getView().getProjection().getUnits());
      layer.setMaxResolution(res);
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
