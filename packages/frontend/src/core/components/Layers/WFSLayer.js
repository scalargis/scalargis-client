import { useContext, useEffect, useRef } from "react";
import OlLayerVector from "ol/layer/Vector";
import OlSourceVector from "ol/source/Vector";
import OlFormatGML2 from "ol/format/GML2";
import OlFormatWFS from "ol/format/WFS";
import OlStyleStyle from "ol/style/Style";
import OlStyleStroke from "ol/style/Stroke";
import OlStyleFill from "ol/style/Fill";
import OlStyleCircle from "ol/style/Circle";
import AppContext from "../../../AppContext";
import { isUrlAppOrigin, isUrlAppHostname } from '../../utils'

const WFSLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const auth = core.store.getState().root.auth;

  // Default style
  function defaultStyle(feature) {
    let style_color = config.style_color ? `rgba(${config.style_color})` : 'black';
    let style_stroke_color = config.style_stroke_color ? `rgba(${config.style_stroke_color})` : 'black';
    let style_stroke_width = typeof config.style_stroke_width === 'undefined' ? 1 : Number(config.style_stroke_width);
    if (feature.ollayer) {
      const layerProps = feature.ollayer.getProperties();
      style_color = `rgba(${layerProps.style_color})`;
      style_stroke_color = `rgba(${layerProps.style_stroke_color})`;
      style_stroke_width = typeof layerProps.style_stroke_width === 'undefined' ? 1 : Number(layerProps.style_stroke_width);
    }
    return new OlStyleStyle({
      image: new OlStyleCircle({
        radius: 8,
        snapToPixel: false,
        fill: new OlStyleFill({color: style_color }),
        stroke: new OlStyleStroke({color: style_stroke_color, width: style_stroke_width })
      }),
      fill: new OlStyleFill({color: style_color }),
      stroke: new OlStyleStroke({
        color: style_stroke_color,
        width: style_stroke_width
      })
    });
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
      loader: (extent) => {
        let bbox = config.bbox.split(' ');
        let url = config.url
        url = url.replace(/&$/ig, '')
        url = url + (url.indexOf('?') > -1 ? '' : '?')
          + '&service=WFS&'
          + 'version=' + config.version
          + '&request=GetFeature'
          + '&typename=' + encodeURIComponent(config.layers)
          + '&outputFormat=' + formatOutput
          + '&srsname=' + srsname
          + '&bbox=' + bbox.join(',') + ',EPSG:'+config.crs;

        //Add user authentication token  
        if (isUrlAppHostname(url) && viewer.integrated_authentication) {
          if (auth && auth.data && auth.data.auth_token) {
            const authkey = viewer?.integrated_authentication_key || 'authkey';
            url = url + '&' + authkey + '=' + auth.data.auth_token;
          }
        }

        if (!isUrlAppOrigin(url)) {
          url = (process.env.REACT_APP_MAP_PROXY || '') + encodeURIComponent(url)
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
      attributions: config.attributions || []
    });
    return new OlLayerVector({
      ...config,
      visible: config.active,
      source: vectorSource,
      style: defaultStyle
    });
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