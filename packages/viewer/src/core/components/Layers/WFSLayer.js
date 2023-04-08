import { useContext, useEffect, useRef } from "react";
import OlLayerVector from "ol/layer/Vector";
import OlSourceVector from "ol/source/Vector";
import OlFormatGML2 from "ol/format/GML2";
import OlFormatWFS from "ol/format/WFS";
import OlStyleStyle from "ol/style/Style";
import OlStyleStroke from "ol/style/Stroke";
import OlStyleFill from "ol/style/Fill";
import OlStyleCircle from "ol/style/Circle";
import OlStyleText from 'ol/style/Text';
import {all as allStrategy, bbox as bboxStrategy} from 'ol/loadingstrategy';

import AppContext from "../../../AppContext";
import { isUrlAppOrigin, isUrlAppHostname } from '../../utils';
import { transformExtent, getProjectionSrid, getResolutionForScale } from '../../model/MapModel';

const WFSLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const auth = core.store.getState().root.auth;

  const MAP_PROXY = core.MAP_PROXY_URL;

  // Default style
  function defaultStyle(config) {
    let style_color = config.style_color === null ? null : (config.style_color ? `rgba(${config.style_color})` : 'black');
    
    let style_stroke_color = config.style_stroke_color === null ? null : (config.style_stroke_color ? `rgba(${config.style_stroke_color})` : 'black');
    let style_stroke_width = config.style_stroke_width === null ? null : (typeof config.style_stroke_width === 'undefined' ? 1 : Number(config.style_stroke_width));
    
    let style_text_font = config.style_text_font ? config.style_text_font : '12px Calibri,sans-serif';
    let style_text_fill_color = config.style_text_fill_color ? `rgba(${config.style_text_fill_color})` : '#000';
    let style_text_stroke_color = config.style_text_stroke_color === null ? null : (config.style_text_stroke_color ? `rgba(${config.style_text_stroke_color})` : '#fff');
    let style_text_stroke_width = config.style_text_stroke_width === null ? null : (typeof config.style_text_stroke_width === 'undefined' ? 2 : Number(config.style_text_stroke_width));
    let style_text_value = config.style_text_value;

    const style_objs = {
      image: new OlStyleCircle({
        radius: 8,
        snapToPixel: false,
        fill: new OlStyleFill({color: style_color }),
        stroke: new OlStyleStroke({color: style_stroke_color, width: style_stroke_width })
      })  
    }

    if (style_color) {
      style_objs['fill'] = new OlStyleFill({color: style_color })
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

    return new OlStyleStyle(
      style_objs
    );
  }

  function createLayer(config) {
    let crs = mainMap.getView().getProjection().getCode();
    let wfsFormatOptions = {
      srsName: 'EPSG:' + config.crs,
      dataProjection: 'EPSG:' + config.crs
    };
    let formatOutput = 'GML2';
    let wfsformat = new OlFormatGML2(wfsFormatOptions);
    let readFeaturesOptions = {
      featureProjection: crs
    }
    let srsname = 'EPSG:' + config.crs
    if (['2.0.0'].indexOf(config.version) > -1) {
      wfsFormatOptions = {
        srsName: 'EPSG:' + config.crs,
        dataProjection: 'EPSG:' + config.crs
      };
      formatOutput = 'GML3';
      wfsformat = new OlFormatWFS(wfsFormatOptions);
      readFeaturesOptions = {
        srsName: 'EPSG:' + config.crs,
        dataProjection: 'EPSG:' + config.crs,
        featureProjection: crs
      }
      srsname = "urn:ogc:def:crs:EPSG::" + config.crs
    }
    const vectorSource = new OlSourceVector({
      loader: (extent, resolution, projection, success, failure) => {
        let bbox = config.bbox ? config.bbox.split(' ') : null;
        let bbox_crs = config?.bbox_crs || config?.crs;
        let url = (config.url || '');
        const params = new URL(url.toLowerCase()).searchParams;

        url = url.replace(/&$/ig, '')

        url = url + (url.indexOf('?') > -1 ? '' : '?');
        if (!params.get('service')) url += '&service=WFS';
        if (!params.get('version')) url += '&version=' + config.version;
        url += '&request=GetFeature';
        url += '&typename=' + encodeURIComponent(config.layers);
        url += '&outputFormat=' + formatOutput;
        url += '&srsname=' + srsname;

        if (config.strategy === 'bbox') {
          if (parseInt(config.crs) !== parseInt(getProjectionSrid(crs))) {
            bbox = transformExtent(
              crs,
              'EPSG:'+config.crs,
              extent
            );
            url += '&bbox=' + bbox.join(',') + ',EPSG:'+config.crs;
          } else {
            url += '&bbox=' + extent.join(',') + ','+crs;
          }
        } else if (bbox) {
          url += '&bbox=' + bbox.join(',') + ',EPSG:'+bbox_crs;
        }         
        
        if (config?.max_features) {
          if (config.version.startsWith('2')) {
            url = url + '&count='+config.max_features;
          } else {
            url = url + '&maxFeatures='+config.max_features;
          }
        }
        
        //Add user authentication token  
        if (isUrlAppHostname(url) && viewer.integrated_authentication) {
          if (auth && auth.data && auth.data.auth_token) {
            const authkey = viewer?.integrated_authentication_key || 'authkey';
            url = url + '&' + authkey + '=' + auth.data.auth_token;
          }
        }

        if (!isUrlAppOrigin(url)) {
          url = MAP_PROXY + encodeURIComponent(url);
        };

        // TODO: check loading
        //checkLoading('start');
        fetch(url).then(res => res.text()).then(res => {
          let features = [];
          features = wfsformat.readFeatures(res, readFeaturesOptions);
          features.forEach(f => f.ollayer = layer.current);
          layer.current.getSource().addFeatures(features);
          //checkLoading('end');
        })
        .catch(error => {
          console.log(error);
          layer.current.getSource().removeLoadedExtent(extent);
          //checkLoading('end');
        });
      },
      strategy: config?.strategy === "bbox" ? bboxStrategy : allStrategy,
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
        //const label = map.getView().getZoom() > 12 ? feature.get('PAR_ID') + '' : '';
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

export default WFSLayer;