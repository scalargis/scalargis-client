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

import AppContext from "../../../AppContext";
import { isUrlAppOrigin } from '../../utils';
import { getProjectionSrid, getResolutionForScale } from '../../model/MapModel';

const OGCFeaturesLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const MAP_PROXY = core.MAP_PROXY_URL;

  /** Build the OGC URI for an EPSG code. */
  function crsUri(srid) {
    return 'http://www.opengis.net/def/crs/EPSG/0/' + srid;
  }

  /** Default vector style, aligned with WFSLayer. */
  function defaultStyle(config) {
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

  function createLayer(config) {
    const proj = mainMap.getView().getProjection().getCode();
    const srid = config.crs ? config.crs : getProjectionSrid(proj);
    const uri = crsUri(srid);
    const limit = config.limit ? config.limit : 1000;
    const max_pages = typeof config.max_pages === 'undefined' ? 10 : Number(config.max_pages);
    const format = new OlFormatGeoJSON();

    const vectorSource = new OlSourceVector({
      loader: (extent, resolution, projection, success, failure) => {
        let base = (config.url || '');
        if (!base.toLowerCase().startsWith('http')) {
          base = window.location.origin + base;
        }
        base = base.replace(/&$/ig, '');
        base = base + (base.indexOf('?') > -1 ? '&' : '?');

        const params = [];
        params.push('f=json');
        params.push('limit=' + limit);
        params.push('crs=' + encodeURIComponent(uri));
        if (config.strategy !== 'all') {
          params.push('bbox-crs=' + encodeURIComponent(uri));
          params.push('bbox=' + extent.join(','));
        }

        const url = base + params.join('&');

        const collected = [];

        const fetchPage = (pageUrl, page) => {
          let target = pageUrl;
          if (config.use_proxy && !isUrlAppOrigin(target)) {
            target = MAP_PROXY + encodeURIComponent(target);
          }
          return fetch(target)
            .then(res => res.json())
            .then(json => {
              const features = format.readFeatures(json, {
                dataProjection: 'EPSG:' + srid,
                featureProjection: proj
              });
              features.forEach(f => f.ollayer = layer.current);
              collected.push(...features);

              const next = (json.links || []).find(l => l.rel === 'next');
              const numReturned = typeof json.numberReturned === 'number' ? json.numberReturned : features.length;
              if (next && next.href && numReturned >= limit && page < max_pages) {
                return fetchPage(next.href, page + 1);
              }
              return collected;
            });
        };

        fetchPage(url, 1)
          .then(features => {
            layer.current.getSource().addFeatures(features);
            if (success) success(features);
          })
          .catch(error => {
            console.log(error);
            layer.current.getSource().removeLoadedExtent(extent);
            if (failure) failure();
          });
      },
      strategy: config?.strategy === 'all' ? allStrategy : bboxStrategy,
      attributions: config.attributions || []
    });

    const style = defaultStyle(config);

    const new_layer = new OlLayerVector({
      ...config,
      visible: config.active,
      source: vectorSource,
      style: config.style_text_value ? (feature, resolution) => {
        let label = config.style_text_value || '';
        if (config.style_text_value && feature?.get) {
          const rf = (label && label.match) ? label.match(/[^{}]+(?=})/g) : null;
          if (rf) {
            rf.forEach(fld => {
              label = label.replace(`{${fld}}`, feature.get(fld) || '');
            });
          }
        }
        style.getText().setText(label);
        return style;
      } : style
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
    layer.current.changed();
  }, [config]);

  return null;
};

export default OGCFeaturesLayer;
