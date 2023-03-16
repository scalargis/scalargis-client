import { useContext, useEffect, useRef } from "react";
import OlLayerVector from "ol/layer/Vector";
import OlSourceVector from "ol/source/Vector";
import OlFormatGeoJSON from "ol/format/GeoJSON";
import OlStyleStyle from "ol/style/Style";
import OlStyleStroke from "ol/style/Stroke";
import OlStyleFill from "ol/style/Fill";
import OlStyleCircle from "ol/style/Circle";
import AppContext from "../../../AppContext";
import { isUrlAppOrigin } from '../../utils';

const GeoJSONLayer = ({ config, group, checked }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const MAP_PROXY = core.MAP_PROXY_URL;

  // Default style
  function defaultStyle(feature) {
    let style_color = config.style_color ? `rgba(${config.style_color})` : 'black';
    let style_stroke_color = config.style_stroke_color ? `rgba(${config.style_stroke_color})` : 'black';
    let style_stroke_width = typeof config.style_stroke_width === 'undefined' ? 1 : Number(config.style_stroke_width);
    let style_image_radius = typeof config.style_image_radius === 'undefined' ? 3 : Number(config.style_image_radius);
    if (feature.ollayer) {
      const layerProps = feature.ollayer.getProperties();
      style_color = `rgba(${layerProps.style_color})`;
      style_stroke_color = `rgba(${layerProps.style_stroke_color})`;
      style_stroke_width = typeof layerProps.style_stroke_width === 'undefined' ? 1 : Number(layerProps.style_stroke_width);
      style_image_radius = typeof layerProps.style_image_radius === 'undefined' ? 3 : Number(layerProps.style_image_radius);
    }
    return new OlStyleStyle({
      image: new OlStyleCircle({
        radius: style_image_radius,
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
    let formatOptions = {
      dataProjection: 'EPSG:' + config.crs,
      featureProjection: mainMap.getView().getProjection().getCode()
    };
    let format = new OlFormatGeoJSON(formatOptions);
    
    const vectorSource = new OlSourceVector({
      //url: config.url,
      format: format,
      attributions: config.attributions || [],

      loader: (extent) => {
        let url = config.url
        // Use map proxy
        if (!isUrlAppOrigin(url)) {
          url = MAP_PROXY + encodeURIComponent(url);
        };
        // TODO: check loading
        //checkLoading('start');
        fetch(url).then(res => res.text()).then(res => {
          let features = [];
          features = format.readFeatures(res);
          features.forEach(f => f.ollayer = layer.current);
          layer.current.getSource().addFeatures(features);
          //checkLoading('end');
        })
        .catch(error => {
          console.log(error);
          layer.current.getSource().removeLoadedExtent(extent);
          //checkLoading('end');
        });
      }
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

export default GeoJSONLayer;