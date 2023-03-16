import OLGroupLayer from 'ol/layer/Group'
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import {Circle as OlStyleCircle, Fill as OlStyleFill, Stroke as OlStyleStroke, 
  Style as OlStyle} from 'ol/style';
  
const defaultStyle = new OlStyle({
  stroke: new OlStyleStroke({
    color: '#ff0000',
    width: 3,
  }),
  image: new OlStyleCircle({
    radius: 4,
    fill: new OlStyleFill({
      color: '#ff0000',
    }),
    stroke: new OlStyleStroke({
      color: '#fff',
      width: 2,
    }),
  })
});

export function createLayer(layer, layerId, map, style) { // new: vector type 
  const l = findOlLayer(layerId, map);
  if (l) { 
    layer.current = l; 
  } else {
    layer.current = new OlLayerVector ({
      id: layerId,
      renderMode: 'vector',
      source: new OlSourceVector ({}),
      style: style ? createStyle(style) : defaultStyle,
      selectable: false
    });
    
    map.addLayer(layer.current);
  } 
}

export function traverseOlLayers(collection, cb) {
  collection.forEach(l => {
    cb(l);
    if (l instanceof OLGroupLayer) traverseOlLayers(l.getLayers(), cb);
  })
}

export function findOlLayer(id, mainMap) {
  let layer;
  traverseOlLayers(mainMap.getLayers(), l => {
    if (l.get('id') === id) layer = l;
  });
  return layer;
}

export const createStyle = (props) => {
  const {fill, stroke, image } = props;
  const style = defaultStyle.clone();

  try {
    if (fill) {
      style.setFill(new OlStyleFill(fill));
    }
    if (stroke) {
      style.setStroke(new OlStyleStroke(stroke));
    }
    if (image) {
      const { radius, displacement, scale, rotation, rotateWithView } = image;
      const circleStyle = new OlStyleCircle({
        fill: image.fill ? new OlStyleFill(image.fill) : null,
        stroke: image.stroke ? new OlStyleStroke(image.stroke): null,
        radius,
        displacement,
        scale,
        rotation,
        rotateWithView
      });
      style.setImage(circleStyle);
    }
  } catch (error) {
    console.log(error);
  }

  return style;
}
