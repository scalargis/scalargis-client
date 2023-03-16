import OlCollection from "ol/Collection";
import OlGroup from "ol/layer/Group";
import OlLayerTile from "ol/layer/Tile";
import OlLayerImage from "ol/layer/Image";
import OlLayerVector from "ol/layer/Vector";
import OlSourceXYZ from "ol/source/XYZ";
import OlSourceOSM from "ol/source/OSM";
import OlSourceTileJSON from "ol/source/TileJSON";
import OlSourceBingMaps from "ol/source/BingMaps";
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceTileArcGISRest from 'ol/source/TileArcGISRest';
import OlSourceImageArcGISRest from 'ol/source/ImageArcGISRest';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceVector from "ol/source/Vector";
import OlWKT from "ol/format/WKT";
import OlFormatGeoJSON from "ol/format/GeoJSON";
import OlFormatGML from "ol/format/GML";
import OlFormatGML2 from "ol/format/GML2";
import OlFormatGML3 from "ol/format/GML3";
import OlFormatWFS from "ol/format/WFS";
import OlFormatKML from "ol/format/KML";
import OlStyleStyle from "ol/style/Style";
import OlStyleStroke from "ol/style/Stroke";
import OlStyleFill from "ol/style/Fill";
import OlStyleCircle from "ol/style/Circle";
import * as OlGeom from "ol/geom";
import * as OlProj from 'ol/proj';
import {register as proj4register } from 'ol/proj/proj4'
import Proj4 from 'proj4';
import OlProjection from 'ol/proj/Projection';
import {applyTransform} from 'ol/extent';
import xml2js from 'xml2js';
import { removeUrlParam } from '../utils';
import { listen } from "ol/events";

let loading = 0;
// TODO: cache layer styles

// Add projections
export const addProjections = (projections) => {
  projections.map(i => {
    if (!OlProj.get('EPSG:'+i.srid)) {
      Proj4.defs('EPSG:'+i.srid, i.defs);
      //This function should be called whenever changes are made to the proj4 registry,
      //e.g. after calling proj4.defs(). Existing transforms will not be modified by this function.
      proj4register(Proj4);
      const newProj = OlProj.get('EPSG:'+i.srid);
      const fromLonLat = OlProj.getTransform('EPSG:4326', newProj);
      if (i.extent) {
        const worldExtent = i.extent.split(' ').map(Number);
        newProj.setWorldExtent(worldExtent);
        const extent = applyTransform(worldExtent, fromLonLat, undefined, 8);
        newProj.setExtent(extent);
      }
    }
    return i;
  });
}

const INCHES_PER_UNIT = {
  'm': 39.37,
  'degrees': 4374754
};

const DOTS_PER_INCH = 72;

const processVisibility = (layers, active = []) => {
  if (!layers) return;
  layers.forEach(layer => {
    if (active.indexOf(layer.get("id")) > -1 || layer.get('always_visible')) layer.setVisible(true);
    else layer.setVisible(false);
    if (layer instanceof OlGroup) {
      processVisibility(layer.getLayers(), active);
    }
  });
}

/*
const traverseTree = (items, cb) => {
  items = items || [];
  items.map(child => {
    cb(child);
    traverseTree(child.children, cb);
    return child;
  });
};
*/

const traverseTree = (items, cb, parent = {}) => {
  items = items || [];
  items.map((child, i) => {
    cb(child, i, items, parent);
    traverseTree(child.children, cb, child);
    return child;
  });
};

const processOpacity = (ollayers, layers) => {
  if (!ollayers) return;
  ollayers.forEach(layer => {
    layers.forEach(item => {
      if (item.id === layer.get("id") && (typeof item.opacity !== 'undefined')) {
        layer.setOpacity(item.opacity);
        layer.setProperties(item);
      }
    });
    if (layer instanceof OlGroup) {
      processOpacity(layer.getLayers(), layers);
    }
  });
}

const processRemoveThemes = (layers, ids) => {
  if (!layers) return;
  layers.forEach((layer, i) => {
    if (layer && ids.includes(String(layer.get('id')))) layers.removeAt(i);
    if (layer instanceof OlGroup) {
      processRemoveThemes(layer.getLayers(), ids);
    }
  });
}

export const getViewerSessionConfig = (viewer) => {
  const newlayers = [];

  viewer.config_json.layers.forEach((l) => {
    if (!viewer.removed.includes(l.id) && l.id != 'featureinfo') {
      let newl = {...l};
      if (l.children) {
        newl.children = l.children.slice();
      }
      newlayers.push(newl);
    }
  });

  const layersIds = newlayers.map(l => l.id);
  newlayers.forEach((l) => {
    if (l.children) {
      l.children = l.children.filter(id => layersIds.includes(id));
    }
  });

  let newchecked = viewer.config_json.checked.filter(c => {
    return !viewer.removed.includes(c); 
  });    
  newchecked = newchecked.filter(c => {
      return c != 'featureinfo';
  });

  return {
    ...viewer.config_json,
    layers: newlayers,
    checked: newchecked
  }  
}

export const transformExtent = (sourceProj, targetProj, extent, fallback) => {
  let re = Object.assign([], extent);
  if (!isFinite(re[0])) re = fallback;
  re = [parseFloat(re[0]), parseFloat(re[1]), parseFloat(re[2]), parseFloat(re[3])];
  let sourceCrs = (String(sourceProj).indexOf(':') === -1 ? 'EPSG:' + sourceProj : sourceProj);
  let targetCrs = (String(targetProj).indexOf(':') === -1 ? 'EPSG:' + targetProj : targetProj);
  re = OlProj.transformExtent(re, sourceCrs, targetCrs);
  return re;
}

export const createStyle = (config) => {
  const style_color = config.style_color ? `rgba(${config.style_color})` : 'rgba(255,255,255,0.7)';
  const style_stroke_color = config.style_stroke_color ? `rgba(${config.style_stroke_color})` : 'rgba(37,150,190,1)';
  const style_stroke_width = typeof config.style_stroke_width === 'undefined' ? 3 : Number(config.style_stroke_width);
  const style_image_radius = typeof config.style_image_radius === 'undefined' ? 3 : Number(config.style_image_radius);

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


const createLayer = (config, map, all) => {
  var layer;
  if (!config) return;

  // Default style
  const defaultStyle = (feature) => {
    let style_color = config.style_color ? `rgba(${config.style_color})` : 'black';
    let style_stroke_color = config.style_stroke_color ? `rgba(${config.style_stroke_color})` : 'rgba(0, 0, 255, 1.0)';
    let style_stroke_width = typeof config.style_stroke_width === 'undefined' ? 2 : Number(config.style_stroke_width);
    let style_image_radius = typeof config.style_image_radius === 'undefined' ? 8 : Number(config.style_image_radius);

    if (feature.ollayer) {
      const layerProps = feature.ollayer.getProperties();
      style_color = `rgba(${layerProps.style_color})`;
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

  let crs = map.getView().getProjection().getCode();

  switch (config.type) {

    /**
     * Generic XYZ layer type
     */
    case "XYZ":
      layer = new OlLayerTile({
        visible: config.active,
        source: new OlSourceXYZ({
            url: config.url
        })
      });
      break;

    /**
     * WMTS XYZ layer type
     */
    case "WMTSXYZ":
      layer = new OlLayerTile({
        visible: config.active,
        source: new OlSourceXYZ({
            tileUrlFunction: function(coordinate) {
              let wmts_url = config.url;
              let z = ('0' + coordinate[0]).slice(-2);
              wmts_url = wmts_url.replace('{z}', z);
              wmts_url = wmts_url.replace('{x}', coordinate[1]);
              wmts_url = wmts_url.replace('{y}', coordinate[2]);
              return wmts_url;
            }
        })
      });
      break;

    /**
     * OSM layer type
     */
    case "OSM":
      layer = new OlLayerTile({
        visible: config.active,
        source: new OlSourceOSM()
      });
      break;

    /**
     * Bing Maps layer type
     */
    case "BING":
      layer = new OlLayerTile({
        visible: config.active,
        preload: Infinity,
        source: new OlSourceBingMaps({
          key:
            "AuwLFA-O1AcL74VKikVahe1-ERPMta838eby5eIXMswtCKNdsioHUpMrJFyj5c1g",
          imagerySet: "AerialWithLabels"
        })
      });
      break;

    /**
     * TileJSON layer type
     */
    case "TileJSON":
      layer = new OlLayerTile({
        visible: config.active,
        opacity: config.opacity ? config.opacity : 1,
        source: new OlSourceTileJSON({
          url: config.url
        })
      });
      break;

    /**
     * WMS layer type
     */
    case "WMS":
      let url = config.url;
      url = removeUrlParam(url, 'service');
      url = removeUrlParam(url, 'version');
      url = removeUrlParam(url, 'request');

      let sourceConfig = {
        url: url,
        hidpi: false,
        //serverType: config.servertype,
        //crossOrigin: 'anonymous',
        //crossOrigin: null, // Quirks: some services does not work with this value
        params: {
          'LAYERS': config.layers,
          'TILED': config.tiled,
          'VERSION': config.version,
          'FORMAT': config.get_map_format || config.format || 'image/jpeg',
          'STYLES': config.wms_style || config.styles
        }
      };

      // Check theme has map CRS      
      if (config.crs_options && config.crs_options.indexOf(crs) === -1) {
        if (config.crs_options.indexOf('EPSG:4326') != -1) {
          sourceConfig['projection'] = 'EPSG:4326';
        } else {
          sourceConfig['projection'] = 'CRS:84';
        }
      }      

      // Create layer
      if (config.tiled) {
        layer = new OlLayerTile({
          visible: config.active,
          opacity: config.opacity ? config.opacity : 1,
          source: new OlSourceTileWMS(sourceConfig)
        });
      } else {
        layer = new OlLayerImage({
          visible: config.active,
          opacity: config.opacity ? config.opacity : 1,
          source: new OlSourceImageWMS(sourceConfig)
        })
      }

      // Set legend URL
      const legendUrl = createLegendUrl(config.url, config.wms_layers || config.layers, config.crs)
      layer.set('legendURL', legendUrl);

      break;

    /**
     * WMTS layer type
     */
    case "WMTS":
     var wmts_options = OlSourceWMTS.optionsFromCapabilities(config.wmts_capabilities, {
        layer: config.layer,
        matrixSet: 'EPSG:3857'
      });
      
      layer = new OlLayerTile({
        visible: config.active,
        opacity: config.opacity ? config.opacity : 1,
        source: new OlSourceWMTS(wmts_options)
      });

      break;
    /**
     * WFS layer type
     */
    case "WFS":
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
          const proxy = process.env.REACT_APP_PROXY_URL || '';
          checkLoading('start');
          fetch(proxy + url).then(res => res.text()).then(res => {
            let features = [];
            features = wfsformat.readFeatures(res, readFeaturesOptions);
            features.forEach(f => f.ollayer = layer);
            layer.getSource().addFeatures(features);
            checkLoading('end');
          })
          .catch(error => {
            console.log(error);
            layer.getSource().removeLoadedExtent(extent);
            checkLoading('end');
          });
        }
      });
      layer = new OlLayerVector({
        visible: config.active,
        source: vectorSource,
        style: defaultStyle
      });
      break;

    /**
     * KML layer type
     */
    case 'KML':
      layer = new OlLayerVector({
        visible: config.active,
        source: new OlSourceVector({
          url: config.url,
          format: new OlFormatKML({
            extractStyles: false
          })
        }),
        style: defaultStyle
      });
      break;

    /**
     * GeoJSON layer type
     */
    case "GeoJSON":
      layer = new OlLayerVector({
        visible: config.active,
        source: new OlSourceVector({
          url: config.url,
          format: new OlFormatGeoJSON()
        }),
        style: defaultStyle
      });
      break;

    /**
     * GML layer type
     */
    case 'GML':
      const gmlOptions = {
        srsName: 'EPSG:3763',
        defaultDataProjection: 'EPSG:3763'
      }
      layer = new OlLayerVector({
        visible: config.active,
        source: new OlSourceVector({
          url: config.url,
          format: new OlFormatGML2(gmlOptions)
        }),
        style: defaultStyle
      });
      break;

    /**
     * Group layer type
     */
    case "GROUP":
      layer = new OlGroup({
        visible: config.active
      });
      let children = new OlCollection();
      if (Array.isArray(config.children)) {
        let inverted = Object.assign([], all.filter(i => config.children.includes(i.id)));
        inverted.reverse();
        inverted.map(config2 => {
          let sub = createLayer(config2, map, all);
          children.push(sub);
          return true;
        });
        layer.setLayers(children);
      }
      break;
    default:;
  }

  // Add tile load observer but not for Group layers
  if (!(layer instanceof OlGroup)) {
    if (layer.getSource() instanceof OlSourceTileWMS || layer.getSource() instanceof OlSourceOSM) {
      layer.getSource().on("tileloadstart", () => {
        checkLoading('start');
      });
      layer.getSource().on("tileloadend", () => {
        checkLoading('end');
      });
      layer.getSource().on("tileloaderror", () => {
        checkLoading('end');
      });
    }
    if (layer.getSource() instanceof OlSourceImageWMS) {
      layer.getSource().on("imageloadstart", () => {
        checkLoading('start');
      });
      layer.getSource().on("imageloadend", () => {
        checkLoading('end');
      });
      layer.getSource().on("imageloaderror", () => {
        checkLoading('end');
      });
    }
  }

  // Validate group properties - prop layers shouldn't be populated
  if (layer instanceof OlGroup) delete config.layers;

  // Add theme properties to layer
  layer.setProperties(config, true);

  if (config.max_scale && config.max_scale > 0) {
    let maxres  = getResolutionForScale(config.max_scale, map.getView().getProjection().getUnits());
    layer.setMaxResolution(maxres);
  }
  if (config.min_scale && config.min_scale > 0) {
    let minres  = getResolutionForScale(config.min_scale, map.getView().getProjection().getUnits());
    layer.setMinResolution(minres);
  } 

  // Set layer visibility
  layer.setVisible(!!config.active);

  // Return created layer
  return layer;
}

export const zoomTheme = (theme, olmap = null) => {
  let bbox = null;
  let crs = olmap.getView().getProjection().getCode();
  if (theme.crs !== crs && theme.bbox) {
    bbox = transformExtent(
      'EPSG:'+theme.crs,
      crs,
      theme.bbox.split(' ')
    ).join(' ');
  }
  bbox = bbox.split(' ').map(c => parseFloat(c));
  if (olmap) olmap.getView().fit(bbox, { nearest: true });
}

const checkLoading = (signal) => {
  //return; // TODO: fix bug when changing state here
  const lastCount = loading;
  if (signal === 'start') loading++;
  if (signal === 'end') loading--;
  loading = loading < 0 ? 0 : loading;
  if (lastCount === 0 && loading > 0) {
    //Store.set('map.loading', true);
  }
  if (lastCount > 0 && loading === 0) {
    //Store.set('map.loading', false);
  }
}

const addBaseLayers = (olMap, layers) => {
  var layer;
  if (!olMap) return;
  if (!layers) return;
  layers.map(config => {
    layer = createLayer(config, olMap);
    olMap.addLayer(layer);
    return layer;
  });
}

const addLayers = (olMap, layers) => {
  var layer;
  if (!olMap) return;
  if (!layers) return;
  const inverted = Object.assign([], layers);
  inverted.reverse();
  inverted.map(config => {
    layer = createLayer(config, olMap, layers);
    olMap.addLayer(layer);
    return layer;
  });
}

const createLegendUrl = (url, layer, srs) => {
    var finalurl = url;
    finalurl += finalurl.indexOf('?') === -1 ? '?' : '';

    //console.log('SRS=' + (srs.indexOf(':') === -1 ? 'EPSG:' + srs : srs));

    return finalurl + '&' + ([
        'SERVICE=WMS',
        'VERSION=1.1.1',
        'REQUEST=GetLegendGraphic',
        'FORMAT=image%2Fpng',
        'SRS=' + (srs.indexOf(':') === -1 ? 'EPSG:' + srs : srs),
        'CRS=' + (srs.indexOf(':') === -1 ? 'EPSG:' + srs : srs),
        'LAYER=' + layer
    ].join('&'));
};

const findActiveWMSLayer = (layers) => {
  let result = [];
  layers.forEach(l => {
    if (l.getVisible() 
      && l.getSource 
      && (l.getSource() instanceof OlSourceTileWMS || l.getSource() instanceof OlSourceImageWMS)
    ) {
      result.push(l);
    }
    if ((l instanceof OlGroup) && l.getVisible()) {
      let temp = findActiveWMSLayer(l.getLayers());
      temp.forEach(t => result.push(t));
    }
  });
  return result;
}

const disableZoomExtent = () => {
  //Store.set('map.zoomExtent', false);
}

const updateBBOXCenter = (bbox, center = false) => {
  //if (center) Store.update('display', { bbox, center });
  //else Store.update('display', { bbox });
}

const setFeatureInfo = (data) => {
  //Store.set('map.featureInfo', data);
}

const getFeatureInfo = () => {
  //return Store.get('map.featureInfo');
}

const toggleGetFeatureInfo = () => {
  //const state = Store.get('map');
  /*
  Store.update('map', {
    ...state,
    getFeatureInfo: !state.getFeatureInfo,
    featureInfo: []
  });
  */
}

const toggleinteractionDragBox = (active) => {
  //Store.set('map.zoomExtent', active);
}

const getState = () => {
  //return Store.get('map');
}

const getFeatureInfoGeoJSON = (l, viewResolution, coordinate, resolve, reject) => {
  const proxy = process.env.REACT_APP_PROXY_URL || process.env.REACT_APP_PUBLIC_URL;
  const url = l.getSource().getGetFeatureInfoUrl(
    coordinate,
    viewResolution,
    'EPSG:3857',
    { 'INFO_FORMAT': 'application/geojson' }
  );
  fetch(proxy + url)
  .then(res => res.json())
  .then(geojson => {

    // Parse JSON feature
    const parser = new OlFormatGeoJSON();
    const parseOptions = {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857'
    };
    const features = parser.readFeatures(geojson, parseOptions);

    // Found GeoJSON features
    if (features.length) resolve(features[0]);
    else reject();
  })
  .catch(err => {
    reject();
  })
}

const getFeatureInfoJSON = (l, viewResolution, coordinate, resolve, reject) => {
  const proxy = process.env.REACT_APP_PROXY_URL || process.env.REACT_APP_PUBLIC_URL;
  const url = l.getSource().getGetFeatureInfoUrl(
    coordinate,
    viewResolution,
    'EPSG:3857',
    { 'INFO_FORMAT': 'application/json' }
  );
  fetch(proxy + url)
  .then(res => res.json())
  .then(json => {

    // Parse JSON feature
    const parser = new OlFormatGeoJSON();
    const parseOptions = {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857'
    };
    const features = parser.readFeatures(json, parseOptions);

    // Found GeoJSON features
    if (features.length) resolve(features[0]);
    else reject();
  })
  .catch(err => {
    reject();
  })
}

const getFeatureInfoXML = (l, viewResolution, coordinate, resolve, reject) => {
  const proxy = process.env.REACT_APP_PROXY_URL || process.env.REACT_APP_PUBLIC_URL;
  const url = l.getSource().getGetFeatureInfoUrl(
    coordinate,
    viewResolution,
    'EPSG:3857',
    { 'INFO_FORMAT': 'text/xml' }
  );
  fetch(proxy + url)
  .then(res => res.text())
  .then(xml => {

    // Found features
    let features = [];

    // Try GML format (in some services)
    let parser = new OlFormatGML();
    let parseOptions = {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857'
    };
    let gmlFeatures = parser.readFeatures(xml, parseOptions);
    if (gmlFeatures && gmlFeatures.length) return resolve(gmlFeatures[0]);

    // Load raw XML with field "FeatureInfoResponse"
    xml2js.parseString(xml, (err, res) => {
      if (err) return reject();

      // Parse XML
      if (res['FeatureInfoResponse']) {
        res['FeatureInfoResponse']['FIELDS'].forEach(f => {
          features.push(f['$']);
        });
      }

      // Return features not found
      if (!features.length) return reject();
      resolve(features[0]);
    });
  })
  .catch(err => {
    reject();
  });
}

const getFeatureInfoGML = (l, viewResolution, coordinate, resolve, reject) => {
  let layerProps = l.getProperties();
  const proxy = process.env.REACT_APP_PROXY_URL || process.env.REACT_APP_PUBLIC_URL;
  const url = l.getSource().getGetFeatureInfoUrl(
    coordinate,
    viewResolution,
    'EPSG:3857',
    { 'INFO_FORMAT': 'application/vnd.ogc.gml' }
  );
  fetch(proxy + url)
  .then(res => res.text())
  .then(gml => {

    // Parse GML feature
    let parser = new OlFormatGML();
    let parseOptions = {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857'
    };
    let features = parser.readFeatures(gml, parseOptions);

    // Try parse with GML v2
    if (!features.length) {
      parser = new OlFormatGML2();
      parseOptions = {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
      };
      features = parser.readFeatures(gml, parseOptions);
    }

    // Try parse with GML v3
    if (!features.length) {
      parser = new OlFormatGML3();
      parseOptions = {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857',
        featureType: layerProps.layers
      };
      features = parser.readFeatures(gml, parseOptions);
    }

    // Found GML features
    if (features.length) resolve(features[0]);
    else reject();
  })
  .catch(err => {
    reject();
  });
}

const getFeatureInfoHtml = (l, viewResolution, coordinate, resolve, reject) => {
  const proxy = process.env.REACT_APP_PROXY_URL || process.env.REACT_APP_PUBLIC_URL;
  const url = l.getSource().getGetFeatureInfoUrl(
    coordinate,
    viewResolution,
    'EPSG:3857',
    { 'INFO_FORMAT': 'text/html' }
  );
  fetch(proxy + url)
  .then(res => res.text())
  .then(text => {
    resolve(text);
  })
  .catch(err => {
    reject();
  });
}

const getFeatureInfoText = (l, viewResolution, coordinate, resolve, reject) => {
  const proxy = process.env.REACT_APP_PROXY_URL || process.env.REACT_APP_PUBLIC_URL;
  const url = l.getSource().getGetFeatureInfoUrl(
    coordinate,
    viewResolution,
    'EPSG:3857',
    { 'INFO_FORMAT': 'text/plain' }
  );
  fetch(proxy + url)
  .then(res => res.text())
  .then(text => {
    resolve(text);
  })
  .catch(err => {
    reject();
  });
}

const parseFeatureInfo = async (l, viewResolution, coordinate, cb) => {
  
  const callFormat = (format) => {
    return new Promise((resolve, reject) => {
      if (/xml/ig.test(format)) {
        getFeatureInfoXML(l, viewResolution, coordinate, resolve, reject);
      }
      else if (/gml/ig.test(format)) {
        getFeatureInfoGML(l, viewResolution, coordinate, resolve, reject);
      }
      else if (/geojson/ig.test(format)) {
        getFeatureInfoGeoJSON(l, viewResolution, coordinate, resolve, reject);
      }
      else if (/json/ig.test(format)) {
        getFeatureInfoJSON(l, viewResolution, coordinate, resolve, reject);
      }
      else if (/html/ig.test(format)) {
        getFeatureInfoHtml(l, viewResolution, coordinate, resolve, reject);
      }
      else if (/plain/ig.test(format)) {
        getFeatureInfoText(l, viewResolution, coordinate, resolve, reject);
      }
      else reject();
    });
  }

  // Start request
  const layerProps = l.getProperties();
  callFormat(layerProps.get_feature_info_format)
  .then(result => {
    cb(result);
  })
  .catch(err => {
    cb(false);
  });
}

export const deserializeFeatures = (data) => {
  const parser = new OlFormatGeoJSON();
  const parseOptions = {
    dataProjection: 'EPSG:3857',
    featureProjection: 'EPSG:3857'
  };
  const features = parser.readFeatures(data, parseOptions);
  return features;
}

export const serializeFeatures = (features) => {
  const parser = new OlFormatGeoJSON();
  const parseOptions = {
    dataProjection: 'EPSG:3857',
    featureProjection: 'EPSG:3857'
  };
  const geojson = parser.writeFeatures(features, parseOptions);
  return geojson;
}

/*
const parseFeatureInfoByTry = async (l, viewResolution, coordinate, cb) => {

  const tryGeoJSON = () => {
    return new Promise((resolve, reject) => {
      getFeatureInfoGeoJSON(l, viewResolution, coordinate, resolve, reject);
    });
  }

  const tryXML = () => {
    return new Promise((resolve, reject) => {
      getFeatureInfoXML(l, viewResolution, coordinate, resolve, reject);
    });
  }

  const tryGML = () => {
    return new Promise((resolve, reject) => {
      getFeatureInfoGML(l, viewResolution, coordinate, resolve, reject); 
    });
  }

  const requests = {
    tryGeoJSON,
    tryGML,
    tryXML
  };

  const tryNext = (index) => {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(requests);
      const fn = requests[keys[index]];
      fn().then(resolve).catch(err => {
        if (index+1 === keys.length) reject();
        index++;
        tryNext(index).then(resolve).catch(reject);
      });
    });
  }

  // Start HTTP requests
  tryNext(0)
  .then(feature => cb(feature))
  .catch(err => cb(false))
}
*/

export const getResolutionForScale = (scale, units) => {
  /*
  const dpi = 90 * OlHas.DEVICE_PIXEL_RATIO;
  const mpu = OlProj.METERS_PER_UNIT[units];
  //const inchesPerMeter = 39.37;
  return parseFloat(scale) / (mpu * dpi);
  */
  return parseFloat(scale) / (INCHES_PER_UNIT[units] * DOTS_PER_INCH)
}

export const getScaleForResolution = (resolution, units) => {
  const scale = INCHES_PER_UNIT[units] * DOTS_PER_INCH * resolution;
  let value = Math.round(scale);
  return value
}

export const getCurrentScale = (map) => {
    /*
    const view = map.getView(); ;
    const resolution = view.getResolution();
    const units = map.getView().getProjection().getUnits();
    const dpi = 25.4 / 0.28;
    const mpu = OlProj.METERS_PER_UNIT[units];
    let scale = resolution * mpu * 39.37 * dpi;
    return scale;
    */
    const view = map.getView(); ;
    const resolution = view.getResolution();
    const units = map.getView().getProjection().getUnits();   
    let value = getScaleForResolution(resolution, units);
    return value;
}

export const isThemeOnScale = (olmap, theme) => {
  let onScale = true;
  const mapResolution = olmap.getView().getResolution();
  if (theme.source_max_scale) {
    const themeMaxResolution = getResolutionForScale(theme.source_max_scale, olmap.getView().getProjection().getUnits());
    onScale = onScale && (mapResolution <= themeMaxResolution);
  }
  if (theme.source_min_scale) {
    const themeMinResolution = getResolutionForScale(theme.source_min_scale,  olmap.getView().getProjection().getUnits());
    onScale = onScale && (mapResolution >= themeMinResolution);
  }
  if (theme.max_scale) {
    const layerMaxResolution = getResolutionForScale(theme.max_scale,  olmap.getView().getProjection().getUnits());
    onScale = onScale && (mapResolution <= layerMaxResolution);
  }
  if (theme.min_scale) {
    const layerMinResolution = getResolutionForScale(theme.min_scale,  olmap.getView().getProjection().getUnits());
    onScale = onScale && (mapResolution >= layerMinResolution);
  }
  return onScale;
}

export const getThemeLegendUrl = (theme) => {
  let url = theme.legend_url;
  let style = theme.wms_style;
  if (style) {
    if (/style=/i.test(url)) url = url.replace(/style=(.*)&?/i, 'style=' + style + '&');
    else url += '&style=' + style;
  }
  return url;
}

export const getProjectionSrid = (proj) => {
  const code = (typeof proj === 'object' && proj !== null) ? proj.getCode() : proj;
  const srid = code.split(':')[1];
  return parseInt(srid);
}

export const getPolygonFromExtent = (extent, separator) => {
  let v = extent;

  if (typeof extent === 'string') {
      v = extent.split(separator || " ");
  }

  const coords = [
      [parseFloat(v[0]), parseFloat(v[3])],
      [parseFloat(v[2]), parseFloat(v[3])],
      [parseFloat(v[2]), parseFloat(v[1])],
      [parseFloat(v[0]), parseFloat(v[1])],
      [parseFloat(v[0]), parseFloat(v[3])]
  ];

  let poly = new OlGeom.Polygon(new Array(coords));

  return poly;
};

export const getWKTFromGeometry = function (geom) {
  const format = new OlWKT();

  let wkt = format.writeGeometry(geom);

  return wkt;
};

export const getGeometryFromWKT = function (wkt, options) {
  const format = new OlWKT();

  let geom = options ? format.readGeometry(wkt, options) : format.readGeometry(wkt);

  return geom;
};

export const getWMSVisibleLayers = function (map, scale) {
  const vlayers = [];

  const _getLayers = function (layer, list) {
      if (layer.getVisible()) {
          if (layer instanceof OlGroup) {
              const lls = layer.getLayers().getArray();
              for (let i=0; i<lls.length; i++) {
                  _getLayers(lls[i], list);
              }
          } else {
              const source = layer.getSource();
              if (source instanceof OlSourceTileWMS || source instanceof OlSourceImageWMS) {
                  let url = '';

                  if (source.getUrl) {
                      url = source.getUrl();
                  } else {
                      url = source.getUrls()[0];
                  }

                  const params = {};
                  const p = source.getParams()
                  for (let key in p) {
                      params[key] = p[key];
                  }

                  const ldata = {
                      'url': url,
                      'params': params,
                      'opacity': layer.getOpacity(),
                      'minScale': 0,
                      'maxScale': 0
                  };

                  if (layer.getMaxResolution && layer.getMaxResolution() > 0) {
                      ldata['minScale'] = getScaleForResolution(layer.getMaxResolution(), map.getView().getProjection().getUnits());
                  }
                  if (layer.getMinResolution && layer.getMinResolution() > 0) {
                      ldata['maxScale'] = getScaleForResolution(layer.getMinResolution(), map.getView().getProjection().getUnits());
                  }

                  list.push(ldata);
              } else if (layer.get('print')) {
                const print = layer.get('print').length ? layer.get('print') : [layer.get('print')];

                print.forEach(pitem => {
                  if (pitem.type === 'wms') {
                    const params = {};
                    params['FORMAT'] = pitem.format || 'image/png';
                    if (pitem.layers) params['LAYERS'] = pitem.layers;
                    params['STYLES'] = pitem.styles || '';
                    params['VERSION'] = pitem.version || '1.3.0';
                    if (pitem.cql_filter) params['CQL_FILTER'] = pitem.cql_filter;

                    const ldata = {
                      'url': pitem.url,
                      'params': params,
                      'opacity': layer.getOpacity(),
                      'minScale': 0,
                      'maxScale': 0
                    };

                    if (layer.getMaxResolution && layer.getMaxResolution() > 0) {
                      ldata['minScale'] = getScaleForResolution(layer.getMaxResolution(), map.getView().getProjection().getUnits());
                    }
                    if (pitem.maxResolution && pitem.maxResolution > 0) {
                      ldata['minScale'] = getScaleForResolution(pitem.maxResolution, map.getView().getProjection().getUnits());
                    }
                    if (pitem.minScale && pitem.minScale > 0) {
                      ldata['minScale'] = pitem.minScale;
                    }

                    if (layer.getMinResolution && layer.getMinResolution() > 0) {
                        ldata['maxScale'] = getScaleForResolution(layer.getMinResolution(), map.getView().getProjection().getUnits());
                    }
                    if (pitem.minResolution && pitem.minResolution > 0) {
                      ldata['maxScale'] = getScaleForResolution(pitem.minResolution, map.getView().getProjection().getUnits());
                    }
                    if (pitem.maxScale && pitem.maxScale > 0) {
                      ldata['maxScale'] = pitem.maxScale;
                    }

                    list.push(ldata);
                  }
                });
              }
          }
      }
  }

  const rootLayers = map.getLayers().getArray();
  for (let i=0; i<rootLayers.length; i++) {
      _getLayers(rootLayers[i], vlayers);
  }

  return vlayers;    
};

export const getArcGISVisibleLayers = function (map, scale) {
  const vlayers = [];

  const _getLayers = function (layer, list) {
      if (layer.getVisible()) {
          if (layer instanceof OlGroup) {
              const lls = layer.getLayers().getArray();
              for (let i=0; i<lls.length; i++) {
                  _getLayers(lls[i], list);
              }
          } else {
              const source = layer.getSource();
              if (source instanceof OlSourceTileArcGISRest || source instanceof OlSourceImageArcGISRest) {
                  let url = '';

                  if (source.getUrl) {
                      url = source.getUrl();
                  } else {
                      url = source.getUrls()[0];
                  }

                  const params = {};
                  const p = source.getParams()
                  for (let key in p) {
                      params[key] = p[key];
                  }

                  const ldata = {
                      'url': url,
                      'params': params,
                      'opacity': layer.getOpacity(),
                      'minScale': 0,
                      'maxScale': 0
                  };

                  if (layer.getMaxResolution && layer.getMaxResolution() > 0) {
                      ldata['minScale'] = getScaleForResolution(layer.getMaxResolution(), map.getView().getProjection().getUnits());
                  }
                  if (layer.getMinResolution && layer.getMinResolution() > 0) {
                      ldata['maxScale'] = getScaleForResolution(layer.getMinResolution(), map.getView().getProjection().getUnits());
                  }

                  list.push(ldata);
              } else if (layer.get('print')) {
                const print = layer.get('print').length ? layer.get('print') : [layer.get('print')];

                print.forEach(pitem => {
                  if (pitem.type === 'ArcGIS') {
                    const params = {};
                    params['FORMAT'] = pitem.format || 'image/png';
                    if (pitem.layers) params['LAYERS'] = pitem.layers;
                    params['STYLES'] = pitem.styles || '';
                    params['VERSION'] = pitem.version || '1.3.0';
                    if (pitem.cql_filter) params['CQL_FILTER'] = pitem.cql_filter;

                    const ldata = {
                      'url': pitem.url,
                      'params': params,
                      'opacity': layer.getOpacity(),
                      'minScale': 0,
                      'maxScale': 0
                    };

                    if (layer.getMaxResolution && layer.getMaxResolution() > 0) {
                      ldata['minScale'] = getScaleForResolution(layer.getMaxResolution(), map.getView().getProjection().getUnits());
                    }
                    if (pitem.maxResolution && pitem.maxResolution > 0) {
                      ldata['minScale'] = getScaleForResolution(pitem.maxResolution, map.getView().getProjection().getUnits());
                    }
                    if (pitem.minScale && pitem.minScale > 0) {
                      ldata['minScale'] = pitem.minScale;
                    }

                    if (layer.getMinResolution && layer.getMinResolution() > 0) {
                        ldata['maxScale'] = getScaleForResolution(layer.getMinResolution(), map.getView().getProjection().getUnits());
                    }
                    if (pitem.minResolution && pitem.minResolution > 0) {
                      ldata['maxScale'] = getScaleForResolution(pitem.minResolution, map.getView().getProjection().getUnits());
                    }
                    if (pitem.maxScale && pitem.maxScale > 0) {
                      ldata['maxScale'] = pitem.maxScale;
                    }

                    list.push(ldata);
                  }
                });
              }
          }
      }
  }

  const rootLayers = map.getLayers().getArray();
  for (let i=0; i<rootLayers.length; i++) {
      _getLayers(rootLayers[i], vlayers);
  }

  return vlayers;    
};

export default {
  processVisibility,
  traverseTree,
  processOpacity,
  processRemoveThemes,
  getViewerSessionConfig,
  transformExtent,
  createStyle,
  createLayer,
  checkLoading,
  addBaseLayers,
  addLayers,
  createLegendUrl,
  toggleinteractionDragBox,
  findActiveWMSLayer,
  toggleGetFeatureInfo,
  disableZoomExtent,
  updateBBOXCenter,
  setFeatureInfo,
  getFeatureInfo,
  getState,
  zoomTheme,
  parseFeatureInfo,
  getResolutionForScale,
  getScaleForResolution,
  getCurrentScale,
  getThemeLegendUrl,
  serializeFeatures,
  deserializeFeatures,
  getProjectionSrid,
  getPolygonFromExtent,
  getWKTFromGeometry,
  getGeometryFromWKT,
  getWMSVisibleLayers,
  getArcGISVisibleLayers
}
