import React from 'react'
import { v4 as uuidv4 } from 'uuid'
/*
import Portal from './components/Portal'
import OLGroupLayer from "ol/layer/Group"
import OlFormatGeoJSON from "ol/format/GeoJSON"
import OlStyleStyle from "ol/style/Style"
import OlStyleCircle from "ol/style/Circle"
import OlStyleFill from "ol/style/Fill"
import OlStyleStroke from "ol/style/Stroke"
import OlStyleText from "ol/style/Text"
import OlStyleRegularShape from "ol/style/RegularShape"
*/

export function rememberUrl(cookies, type, url) {
  const prefix = process.env.REACT_APP_COOKIE_PREFIX || 'sniguserurl';
  const cookieName = prefix + type;
  let urlhistory = cookies.get(cookieName) || [];
  if (urlhistory.indexOf(url) === -1) urlhistory.push(url);
  cookies.set(cookieName, urlhistory);
}

export const  generateRGBA = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return [r, g, b, 1].join(',');
}

export const removeUrlParam = (sourceURL, key) => {
  let rtn = sourceURL.split("?")[0],
    param,
    params_arr = [],
    new_params = [],
    queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
  if (queryString !== "") {
    params_arr = queryString.split("&");
    for (var i = params_arr.length - 1; i >= 0; i -= 1) {
      param = params_arr[i].split("=")[0];
      let regex = new RegExp(key, "ig");
      if (!regex.test(param)) {
        new_params.push(params_arr[i]);
      }
    }
    rtn = rtn + "?" + new_params.join("&");
  }
  return rtn;
}

export const getWindowSize = () => {
  var w = window,
  d = document,
  e = d.documentElement,
  g = d.getElementsByTagName('body')[0],
  x = w.innerWidth || e.clientWidth || g.clientWidth,
  y = w.innerHeight|| e.clientHeight|| g.clientHeight;
  return [x, y];
}

export const isUrlAppOrigin = (url) => {
  //Considers it is same origin if is relative path
  if (url.indexOf('http') !== 0) return true;

  //Check if is same origin
  const url1 = new URL(window.location.href);
  const url2 = new URL(url);
  return (url1.origin === url2.origin);
}


export const isAdminOrManager = (auth) => {
  let retVal = false;

  const roles = auth?.data ? (auth.data.userroles || []) : (auth?.response?.userroles || []);

  retVal = roles.map(s => s.toLowerCase()).filter(x => ['admin','manager'].includes(x)).length > 0;

  return retVal;
}

/*
export function traverseOlLayers(collection, cb) {
  collection.forEach(l => {
    cb(l);
    if (l instanceof OLGroupLayer) traverseOlLayers(l.getLayers(), cb);
  })
}
  
export function findOlLayer(mainMap, id) {
  let layer;
  traverseOlLayers(mainMap.getLayers(), l => {
    if (l.get('id') === id) layer = l;
  });
  return layer;
}
  
export const serializeDrawing = (feature, state, crs) => {
  const id = feature.getId() ? feature.getId() : uuidv4();
  feature.setId(id);
  feature.set('id', id);
  let type = feature.getGeometry().getType();
  if (state.draw_symbol) type = 'Symbol';
  if (state.draw_text) type = 'Text';
  feature.set('type', type);
  feature.set('state', {
    draw_geom: state.draw_geom,
    draw_symbol: state.draw_symbol,
    draw_text: state.draw_text,
    fill: Object.assign({}, state.fill),
    stroke: Object.assign({}, state.stroke),
    size: state.size,
    symbol_type: state.symbol_type,
    text_style: state.text_style,
    text_size: state.text_size,
    text_font: state.text_font,
    text_value: state.text_value
  });
  const serializer = new OlFormatGeoJSON();

  // Export defaults to EPSG:3857
  const serializeOptions = {
    dataProjection: crs || 'EPSG:3857',
    featureProjection: crs || 'EPSG:3857',
    decimals: 6
  }
  const geojson = serializer.writeFeatureObject(feature, serializeOptions);
  
  // Hack: OL does not serialize with CRS attribute
  const urn_crs = (crs || 'EPSG:3857').replace(':', '::');
  geojson.crs = { "type": "name", "properties": { "name": "urn:ogc:def:crs:" + urn_crs } }
  return geojson;
}

export const createStyle = (feature, drawing, altStroke) => {
  let { symbol_type, size, fill, stroke, text_style, text_size, text_font, text_value } = drawing;
  stroke = altStroke ? altStroke : stroke;
  let style = createDrawingStyle(feature.getGeometry().getType(), size, fill, stroke);
  if (feature.get('type') === 'Symbol') {
      style = createDrawingSymbol(symbol_type, size, fill, stroke);
  }
  if (feature.get('type') === 'Text') {
      style = createDrawingText(feature, size, fill, stroke, text_style, text_size, text_font, text_value);
  }
  return style;
}

export const deserializeDrawing = (drawing, crs) => {
  const { draw_geom, draw_symbol, draw_text, symbol_type, size, fill, stroke, text_style, text_size, text_font, text_value } = drawing.properties.state;
  const serializer = new OlFormatGeoJSON();

  // Export defaults to EPSG:3857
  const serializeOptions = {
    dataProjection: crs || 'EPSG:3857',
    featureProjection: crs || 'EPSG:3857',
    decimals: 6
  }
  const feature = serializer.readFeature(drawing, serializeOptions);
  let style = createStyle(feature, drawing.properties.state);
  feature.setStyle(style);
  feature.set('state', {
    draw_geom,
    draw_symbol,
    draw_text,
    fill: Object.assign({}, fill),
    stroke: Object.assign({}, stroke),
    size,
    symbol_type,
    text_style,
    text_size,
    text_font,
    text_value
  });
  return feature;
}
  
export const createDrawingStyle = (type, size, fill, stroke) => {
  const fillStr = `rgba(${ fill.r }, ${ fill.g }, ${ fill.b }, ${ fill.a })`;
  const strokeStr = `rgba(${ stroke.r }, ${ stroke.g }, ${ stroke.b }, ${ stroke.a })`;
  let style = new OlStyleStyle({
    stroke: new OlStyleStroke({
      color: strokeStr,
      width: parseInt(10, 10)
    }),
    fill: new OlStyleFill({
      color: fillStr
    })
  });
  switch (type) {
    case 'Point': 
      style = new OlStyleStyle({
        image: new OlStyleCircle({
          radius: parseInt(size, 10),
          fill: new OlStyleFill({ color: fillStr }),
          stroke: new OlStyleStroke({ color: strokeStr, width: 2 })
        }),
        stroke: new OlStyleStroke({
          color: strokeStr,
          lineDash: [4],
          width: parseInt(size, 10)
        }),
        fill: new OlStyleFill({ color: fillStr})
      });
      break;
    case 'LineString':
      style = new OlStyleStyle({
          stroke: new OlStyleStroke({ color: strokeStr, width: parseInt(size, 10) })
      });
      break;
    case 'Polygon':
      style = new OlStyleStyle({
        stroke: new OlStyleStroke({
          color: strokeStr,
          lineDash: [4],
          width: parseInt(size, 10)
        }),
        fill: new OlStyleFill({ color: fillStr})
      });
      break;
    case 'Circle':
      style = new OlStyleStyle({
        stroke: new OlStyleStroke({
          color: strokeStr,
          width: parseInt(size, 10)
        }),
        fill: new OlStyleFill({
          color: fillStr
        })
      });
    break;
    default: ;
      break;
  }
  return style;
}
  
export const createDrawingText = (feature, size, fill, stroke, text_style, text_size, text_font, text_value) => {
  const fillStr = `rgba(${ fill.r }, ${ fill.g }, ${ fill.b }, ${ fill.a })`;
  const strokeStr = `rgba(${ stroke.r }, ${ stroke.g }, ${ stroke.b }, ${ stroke.a })`;
  
  let label = text_value;
  let fontStr = [text_style, text_size, text_font].join(' ');

  let style = new OlStyleStyle({
    text: new OlStyleText({
      font: fontStr,
      textAlign: "left",
      fill: new OlStyleFill({ color: fillStr }),
      stroke: new OlStyleStroke({ "color": strokeStr, "width": parseInt(size, 10) }),
      textBaseline: "top",
      text: label
    })
  });
  return style;
}
  
export const createDrawingSymbol = (type, size, fill, stroke) => {
  const fillStr = `rgba(${ fill.r }, ${ fill.g }, ${ fill.b }, ${ fill.a })`;
  const strokeStr = `rgba(${ stroke.r }, ${ stroke.g }, ${ stroke.b }, ${ stroke.a })`;
  let style = null;
  switch(type) {
    case 'square':
      style = new OlStyleStyle({
        image: new OlStyleRegularShape({
          fill: new OlStyleFill({ color: fillStr }),
          stroke: new OlStyleStroke({ color: strokeStr, width: 2 }),
          radius: parseInt(size, 10),
          points: 4,
          angle: Math.PI / 4
        })
      });
      break;
    case 'triangle': 
      style = new OlStyleStyle({
        image: new OlStyleRegularShape({
          fill: new OlStyleFill({ color: fillStr }),
          stroke: new OlStyleStroke({ color: strokeStr, width: 2 }),
          radius: parseInt(size, 10),
          points: 3,
          rotation: 0,
          angle: 0
        })
      });
      break;
    case 'star': 
      style = new OlStyleStyle({
        image: new OlStyleRegularShape({
          fill: new OlStyleFill({ color: fillStr }),
          stroke: new OlStyleStroke({ color: strokeStr, width: 2 }),
          radius: parseInt(size, 10),
          points: 5,
          radius2: 4,
          angle: 0
        })
      });
      break;
    case 'cross':
      style = new OlStyleStyle({
        image: new OlStyleRegularShape({
          fill: new OlStyleFill({ color: fillStr }),
          stroke: new OlStyleStroke({ color: strokeStr, width: 2 }),
          radius: parseInt(size, 10),
          points: 4,
          radius2: 0,
          angle: 0
        })
      });
      break;
    case 'circle':
      style = new OlStyleStyle({
        image: new OlStyleCircle({
          fill: new OlStyleFill({ color: fillStr }),
          stroke: new OlStyleStroke({ color: strokeStr, width: 2 }),
          radius: parseInt(size, 10),
        })
      });
      break;
    case 'x':
    default: 
      style = new OlStyleStyle({
        image: new OlStyleRegularShape({
          fill: new OlStyleFill({ color: fillStr }),
          stroke: new OlStyleStroke({ color: strokeStr, width: 2 }),
          points: 4,
          radius: 10,
          radius2: 0,
          angle: Math.PI / 4
        })
      });
  }
  return style;
}

export const showOnPortal = (children) => {
  return <Portal>{children}</Portal>;
}

export const traverseLayersTree = (layers, parent, cb) => {
  let items = parent ? layers.filter(l => l.id === parent) : layers;
  items.forEach((l, i) => {
    if (l.children) {
      l.children.forEach(cid => {
        traverseLayersTree(layers, cid, cb);
      });
    }
    cb(l, i, parent);
  });
};
*/