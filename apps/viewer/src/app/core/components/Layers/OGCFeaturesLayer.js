import { useContext, useEffect, useRef } from "react";
import OlLayerVector from "ol/layer/Vector";
import OlSourceVector from "ol/source/Vector";
import OlFormatGeoJSON from "ol/format/GeoJSON";
import OlStyleStyle from "ol/style/Style";
import OlStyleStroke from "ol/style/Stroke";
import OlStyleFill from "ol/style/Fill";
import OlStyleCircle from "ol/style/Circle";
import OlStyleText from 'ol/style/Text';
import { all as allStrategy, bbox as bboxStrategy } from 'ol/loadingstrategy';
import { transformExtent } from 'ol/proj';

import AppContext from "../../../AppContext";
import { isUrlAppOrigin } from '../../utils';
import { getProjectionSrid, getResolutionForScale } from '../../model/MapModel';

/** Returns the page size, the total, the page cap, and the request SRID (null for CRS84) of an OGC API Features layer. */
function requestPlan(config, mapProjection) {
  const total = Number(config.limit) > 0 ? Number(config.limit) : 1000;
  const serverMax = Number(config.page_size) > 0 ? Number(config.page_size) : null;
  const pageSize = serverMax ? Math.min(total, serverMax) : total;
  const maxPages = typeof config.max_pages === 'undefined' || config.max_pages === null
    ? Math.max(10, Math.ceil(total / pageSize))
    : Number(config.max_pages);
  const wanted = Number(config.crs ? config.crs : getProjectionSrid(mapProjection));
  const supported = Array.isArray(config.supported_crs) ? config.supported_crs.map(Number) : null;
  const srid = !supported || supported.includes(wanted) ? wanted : null;
  return { total, pageSize, maxPages, srid };
}

const OGCFeaturesLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const MAP_PROXY = core.MAP_PROXY_URL;

  /** Build the OGC URI for an EPSG code. */
  function crsUri(srid) {
    return 'http://www.opengis.net/def/crs/EPSG/0/' + srid;
  }

  /** Function to build vector style, aligned with WFSLayer. */
  function buildStyle(config) {
    const style_color = config.style_color === null ? null : (config.style_color ? `rgba(${config.style_color})` : 'black');

    const style_stroke_color = config.style_stroke_color === null ? null : (config.style_stroke_color ? `rgba(${config.style_stroke_color})` : 'black');
    const style_stroke_width = config.style_stroke_width === null ? null : (typeof config.style_stroke_width === 'undefined' ? 1 : Number(config.style_stroke_width));

    const style_text_font = config.style_text_font ? config.style_text_font : '12px Calibri,sans-serif';
    const style_text_fill_color = config.style_text_fill_color ? `rgba(${config.style_text_fill_color})` : '#000';
    const style_text_stroke_color = config.style_text_stroke_color === null ? null : (config.style_text_stroke_color ? `rgba(${config.style_text_stroke_color})` : '#fff');
    const style_text_stroke_width = config.style_text_stroke_width === null ? null : (typeof config.style_text_stroke_width === 'undefined' ? 2 : Number(config.style_text_stroke_width));
    const style_text_value = config.style_text_value;

    const style_objs = {
      image: new OlStyleCircle({
        radius: 8,
        snapToPixel: false,
        fill: new OlStyleFill({ color: style_color }),
        stroke: new OlStyleStroke({ color: style_stroke_color, width: style_stroke_width })
      })
    }

    if (style_color) {
      style_objs['fill'] = new OlStyleFill({ color: style_color })
    }
    if (style_stroke_color || style_stroke_width) {
      style_objs['stroke'] = new OlStyleStroke({
        color: style_stroke_color,
        width: style_stroke_width
      });
    }
    if (style_text_value) {
      style_objs['text'] = new OlStyleText({
        font: style_text_font,
        fill: new OlStyleFill({ color: style_text_fill_color }),
        stroke: new OlStyleStroke({
          color: style_text_stroke_color,
          width: style_text_stroke_width
        }),
        text: style_text_value
      });
    }

    return new OlStyleStyle(style_objs);
  }

  /** Builds the layer style, with a label function when the config has a label. */
  function layerStyle(config) {
    const base = buildStyle(config);
    if (!config.style_text_value) return base;
    return (feature) => {
      let label = config.style_text_value || '';
      const rf = (label && label.match) ? label.match(/[^{}]+(?=})/g) : null;
      if (rf && feature?.get) {
        rf.forEach(fld => {
          label = label.replace(`{${fld}}`, feature.get(fld) || '');
        });
      }
      base.getText().setText(label);
      return base;
    };
  }

  function createLayer(config) {
    const proj = mainMap.getView().getProjection().getCode();
    const format = new OlFormatGeoJSON();
    const retry = { delay: 0 };

    const vectorSource = new OlSourceVector({
      loader: (extent, resolution, projection, success, failure) => {
        const plan = requestPlan(config, proj);
        let base = (config.url || '');
        if (!base.toLowerCase().startsWith('http')) {
          base = window.location.origin + base;
        }
        base = base.replace(/&$/ig, '');
        base = base + (base.indexOf('?') > -1 ? '&' : '?');

        const params = ['f=json', 'limit=' + plan.pageSize];
        if (plan.srid) params.push('crs=' + encodeURIComponent(crsUri(plan.srid)));
        if (config.strategy !== 'all') {
          const box = transformExtent(extent, proj, plan.srid ? 'EPSG:' + plan.srid : 'EPSG:4326');
          if (plan.srid) params.push('bbox-crs=' + encodeURIComponent(crsUri(plan.srid)));
          params.push('bbox=' + box.join(','));
        }

        const collected = [];

        const fetchPage = (pageUrl, page) => {
          let target = pageUrl;
          if (config.use_proxy && !isUrlAppOrigin(target)) {
            target = MAP_PROXY + encodeURIComponent(target);
          }
          return fetch(target)
            .then(res => {
              if (!res.ok) throw new Error('HTTP ' + res.status);
              return res.json();
            })
            .then(json => {
              const features = format.readFeatures(json, {
                dataProjection: plan.srid ? 'EPSG:' + plan.srid : 'EPSG:4326',
                featureProjection: proj
              });
              features.forEach((f, i) => {
                f.ollayer = layer.current;
                const assets = json.features?.[i]?.assets;
                if (assets && typeof assets === 'object') {
                  Object.keys(assets).forEach(k => {
                    if (assets[k]?.href && f.get('asset_' + k) === undefined) f.set('asset_' + k, assets[k].href);
                  });
                }
              });
              const pageFeatures = features.slice(0, Math.max(0, plan.total - collected.length));
              collected.push(...pageFeatures);
              layer.current?.getSource().addFeatures(pageFeatures);

              const next = (json.links || []).find(l => l.rel === 'next');
              if (next && next.href && features.length && collected.length < plan.total && page < plan.maxPages) {
                return fetchPage(next.href, page + 1);
              }
              return collected;
            });
        };

        fetchPage(base + params.join('&'), 1)
          .then(features => {
            retry.delay = 0;
            if (success) success(features);
          })
          .catch(error => {
            console.log(error);
            retry.delay = Math.min(retry.delay ? retry.delay * 2 : 2000, 30000);
            if (failure) failure();
            setTimeout(() => {
              const source = layer.current?.getSource();
              if (!source) return;
              source.removeLoadedExtent(extent);
              source.changed();
            }, retry.delay);
          });
      },
      strategy: config?.strategy === 'all' ? allStrategy : bboxStrategy,
      attributions: config.attributions || []
    });

    const new_layer = new OlLayerVector({
      ...config,
      visible: config.active,
      source: vectorSource,
      style: layerStyle(config)
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
    layer.current.setVisible(checked.includes(config.id))
  }, [checked]);

  // Changed config
  useEffect(() => {
    layer.current.setProperties(config);
    layer.current.set('selectable', config.selectable);
    layer.current.setOpacity(config.opacity);

    layer.current.setStyle(layerStyle(config));
    layer.current.changed();
  }, [config]);

  return null;
};

export default OGCFeaturesLayer;
