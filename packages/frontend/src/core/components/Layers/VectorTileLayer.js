import { useContext, useEffect, useRef } from "react";
import VectorLayer from 'ol/layer/VectorTile'
import VectorTile from 'ol/source/VectorTile'
import MVT from 'ol/format/MVT'
import { createXYZ } from 'ol/tilegrid';
import { Fill, Stroke, Style, Circle, Text } from 'ol/style'
import AppContext from "../../../AppContext";
import { isUrlAppOrigin } from "../../utils"

const VectorTileLayer = ({ config, group, checked }) => {

  const { mainMap } = useContext(AppContext)
  const layer = useRef()

  function createLayer(config) {

    function getText(feature, resolution){
  
      if (!config.style || !config.style.label || resolution > config.style.label_resolution) {
        return ""
      } 
      
      return (
        config.style && config.style.label && feature ? new Text({
          font: config.style.label_font ? config.style.label_font : "12px sans-serif",
          text: feature.get(config.style.label_field).toString(),
          fill: new Fill({ color: config.style.label_fill_color ? config.style.label_fill_color : "rgba(0,0,0,1)" }),
          stroke: new Stroke({ color: config.style.label_stroke_color ? config.style.label_stroke_color : "rgba(200,200,200,1)", width: 3 }),
          offsetX: 0,
          offsetY: -10,
        }) : ''
      )
    }


    function getStyle(feature, resolution) {
      if (!config.style || resolution > config.style.resolution) {
        return ""
      }

      return new Style({
        image: (config.style && config.style.point_shape && (config.style.point_shape.length > 2)) ?
          new Circle({
            fill: new Fill({
              color: config.style.point_color,
            }),
            stroke: new Stroke({
              color: config.style.point_stroke_color,
              width: config.style.point_stroke_width,
            }),
            radius: config.style.point_radius
          }) : null,

        fill: new Fill({
          color: config.style.fill_color
        }),

        stroke: new Stroke({
          color: config.style.stroke_color,
          width: config.style.stroke_width
        }),

        text: getText(feature, resolution)
      })

    };



    let url = config.url;
    if ((config.ignoreProxy != true) && !isUrlAppOrigin(url)) {
      url = (process.env.REACT_APP_MAP_PROXY || '') + url
    };

    return new VectorLayer({
      ...config,
      visible: config.active,
      style: getStyle,
      source: new VectorTile({
        tilePixelRatio: 1, // oversampling when > 1
        tileGrid: createXYZ({ maxZoom: 19 }),
        format: new MVT(),
        url: url,
        //url: 'https://dgt.wkt.pt/geoserver/gwc/service/tms/1.0.0/cp:mv_0812_publicar@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf'
        //url: (process.env.REACT_APP_MAP_PROXY || '') + 'https://dgt.wkt.pt/geoserver/gwc/service/tms/1.0.0/cp:mv_0812_publicar@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf'
        //url: '/geoserver/gwc/service/tms/1.0.0/cp:mv_0812_publicar@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf'
        //url: '/geoserver/gwc/service/tms/1.0.0/cp:gs_view_cp_sba@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf'
        attributions: config.attributions || []
      })
    })
  }

  useEffect(() => {
    if (!mainMap) return;

    layer.current = createLayer(config);
    group.getLayers().push(layer.current);

    // let selection = {};

    // const selectionLayerStyle = new Style({
    //   stroke: new Stroke({
    //     color: '#dddd22',
    //     width: 2,
    //   }),
    //   fill: new Fill({
    //     color: 'rgba(200,200,200,0.4)',
    //   }),
    // });

    // const selectionLayer = new VectorLayer({
    //   renderMode: 'vector',
    //   source: layer.current.getSource(),
    //   style: function (feature) {
    //     if (feature.getId() in selection) {
    //       return selectionLayerStyle;
    //     }
    //   },
    // });
    // mainMap.addLayer(selectionLayer);

    // // Check map click and select vector tile feature
    // mainMap.on(['click'], function (event) {
    //   layer.current.getFeatures(event.pixel).then(function (features) {
    //     debugger;
    //     selection = {};
    //     if (!features.length) {
    //       selectionLayer.changed();
    //       console.log("nada")
    //       return;
    //     }
    //     var feature = features[0];
    //     if (!feature) {
    //       return;
    //     }
    //     var fid = feature.getId();

    //     // if (selectElement.value.startsWith('singleselect')) {
    //     //   selection = {};
    //     // }
    //     // add selected feature to lookup
    //     selection[fid] = feature;
    //     console.log(selection)
    //     selectionLayer.changed();
    //   });
    // })

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

export default VectorTileLayer;