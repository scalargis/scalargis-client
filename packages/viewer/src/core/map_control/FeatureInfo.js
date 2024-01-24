import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from "react-i18next"
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import OlVectorTileLayer from "ol/layer/VectorTile";
import OlGroup from "ol/layer/Group";
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import OlSourceWMTS from 'ol/source/WMTS';
import OlSourceTileArcGISRest from 'ol/source/TileArcGISRest';
import OlSourceImageArcGISRest from 'ol/source/ImageArcGISRest';
import OlFormatGeoJSON from "ol/format/GeoJSON";
import OlFormatGML from "ol/format/GML";
import OlFormatGML2 from "ol/format/GML2";
import OlFormatGML3 from "ol/format/GML3";
import OlFormatEsriJSON from 'ol/format/EsriJSON';
import OlFeature from 'ol/Feature'
import OlCollection from 'ol/Collection'
import WMSGetFeatureInfo from 'ol/format/WMSGetFeatureInfo';
import { transform, transformExtent } from 'ol/proj'
import { Fill, Stroke, Style, Circle } from 'ol/style'
import { v4 as uuidV4 } from 'uuid'
import xml2js from 'xml2js'
import { isUrlAppOrigin, findOlLayer } from '../utils';
import { serializeFeatures, deserializeFeatures } from '../model/MapModel';

const selectionLayerStyle = new Style({
  image: new Circle({
    radius: 4,
    fill: new Fill({
    color: '#FF0000',
    }),
    stroke: new Stroke({
    color: '#fff',
    width: 2,
    }),
  }),
  stroke: new Stroke({
    color: '#ff0000',
    width: 3,
  })  
});

export default function FeatureInfo({ core, config, actions }) {

  const { viewer, mainMap, dispatch } = config;
  const { featureinfo } = viewer;
  const feature_info_control = viewer.config_json.map_controls.find(c => c.id === 'FeatureInfo');
  const feature_info_component = viewer.config_json.components.find(c => c.config_json && 
                c.config_json.map_control === 'FeatureInfo');
  const layers = viewer.config_json.layers;

  const { t } = useTranslation();

  const [search, setSearch] = useState(null);

  const selectionLayer = useRef();

  const utils = new FeatureInfoUtils(core);
  
  function selectSingleClick(e) {
    setSearch({ coords: e.coordinate, pixel: e.pixel });
    feature_info_component && dispatch(actions.viewer_set_selectedmenu(feature_info_component.id));    
  }

  function searchAll(coordinate, pixel) {

    const acc = [];
    let features = [];

    // Display vector feature
    const displayFeature = (feature, l) => {
      if ((typeof feature === 'object')) {
        if ((feature instanceof OlFeature)) {
          return {
            id: uuidV4(),
            type: 'ol',
            data: serializeFeatures([feature]),
            layer: l ? l.get('title') : '',
            layerId: l ? l.get('id') : null, 
            feature_tpl: l.get('feature_tpl') ? l.get('feature_tpl') : null
          };
        } else {
          let data = {};
          Object.keys(feature)
            .filter(k => typeof feature[k] !== 'object')
            .forEach(k => data[k] = feature[k]);
          return { id: uuidV4(), type: 'object', data, layer: l ? l.get('title') : '', "layerId": l ? l.get('id') : null };
        }
      }
    }

    //List o vector tile features for remote query
    let fvt_remote = [];

    const layers_selected = [];

    // Find vector features strategy
    mainMap.forEachFeatureAtPixel(pixel, (f, l) => {
      if (!l) return;
      if (l == selectionLayer.current) return;
      if (l.get('selectable') == false) return;
      if (l instanceof OlVectorTileLayer) {
        let fvt = new OlFeature();
        let props = f.getProperties();
        Object.keys(props).forEach(k => {
          fvt.set(k, props[k]);;
        });
        if (props.id) fvt.setId(props.id)        
        if (l.get("datasource") && l.get("datasource").cql_fields && l.get("datasource").cql_filter) {
          if (l.get("datasource").allow_multi === false) {
            if (!layers_selected.includes(l.get('id'))) {
              fvt_remote.push({ feature: fvt, layer: l });
              layers_selected.push(l.get('id'));
            }
          } else {
            fvt_remote.push({ feature: fvt, layer: l });
          }
        } else {
          features.push({ feature: fvt, layer: l });
        }
      } else {
        features.push({ feature: f, layer: l });
      }
      //return true;
    });

    // Found vector features
    if (features.length) {
      //const acc = featureinfo;
      features.forEach(fl => {
        acc.push(displayFeature(fl.feature, fl.layer));
        dispatch(actions.viewer_set_featureinfo(acc));
      });
    }

    //Get info for VectorTile features
    fvt_remote.forEach(item => {
      let nativeCRS = item.layer.get("datasource").crs || 'EPSG:4326';
      let filter = item.layer.get("datasource").cql_filter;
      let fields = item.layer.get("datasource").cql_fields;
      fields.forEach((f, index) => {
        //replace based on field names
        filter = filter.replaceAll('{' + f + '}', item.feature.get(f));
        //replace based on field index
        filter = filter.replaceAll('{' + index + '}', item.feature.get(f));
      });
      //replace based on XY coordinates
      const coords = transform(coordinate, mainMap.getView().getProjection().getCode(), nativeCRS);
      filter = filter.replaceAll('{X}', coords[0]);
      filter = filter.replaceAll('{Y}', coords[1]);

      utils.getWFSFeaturesFilterByGeom(
        item.layer.get("datasource").url, 
        item.layer.get("datasource").typeNames,
        nativeCRS,
        50,
        null,
        filter
      )
      .then(res => res.json())
      .then(json => {

        // Parse JSON feature
        const parser = new OlFormatGeoJSON();
        const parseOptions = {
          dataProjection: nativeCRS,
          featureProjection: mapCRS
        };
        const features = parser.readFeatures(json, parseOptions);
        if (!features) return;

        // Add results
        features.forEach(feat => {
          acc.push(displayFeature(feat, item.layer));
        });
        dispatch(actions.viewer_set_featureinfo(acc));          
      })
      .catch(err => console.log(err));
    });
      
    // Find features from WMS layers strategy
    const viewResolution = (mainMap.getView().getResolution());
    const mapCRS = mainMap.getView().getProjection().getCode();
    const lrs = utils.findActiveWMSLayer(mainMap.getLayers());
    lrs.forEach(l => {
      if (l.get('selectable') === false) return;

      // Get features using datasource
      if (l.get("datasource")) {
        let buffer = 2;
        let nativeCRS = l.get("datasource").crs || 'EPSG:4326';
        let bbox = [coordinate[0]-buffer, coordinate[1]-buffer, coordinate[0]+buffer, coordinate[1]+buffer];
        const nativeBBOX = transformExtent(bbox, mapCRS, nativeCRS);
        utils.getWFSFeaturesFilterByGeom(
          l.get("datasource").url, 
          l.get("datasource").typeNames,
          nativeCRS,
          50,
          nativeBBOX
          //"CONTAINS(" + l.get("datasource").geomName + ",POINT(" + coordinate.join(" ") + "))"
        )
        .then(res => res.json())
        .then(json => {

          // Parse JSON feature
          const parser = new OlFormatGeoJSON();
          const parseOptions = {
            dataProjection: nativeCRS,
            featureProjection: mapCRS
          };
          const features = parser.readFeatures(json, parseOptions);
          if (!features) return;

          // Add results
          features.forEach(feat => {
            acc.push(displayFeature(feat, l));
          });
          dispatch(actions.viewer_set_featureinfo(acc));          
        })
        .catch(err => console.log(err));

      // Get features using any other strategy
      } else {
        utils.parseFeatureInfo(mainMap, l, viewResolution, coordinate, mapCRS, (result) => {
          const format = l.getProperties().get_feature_info_format || 'application/json';
          if (!result) acc.push({ id: uuidV4(), type: 'error', format });
          if (typeof result === 'object') {
            if (Array.isArray(result)) {
              result.forEach(feat => {
                acc.push(displayFeature(feat, l));
              });
            } else {
              acc.push(displayFeature(result, l));
            }          
          } else {
           acc.push({id: uuidV4(), type: 'text', data: result, layer: l ? l.get('title') : '', "layerId": l ? l.get('id') : null});
          }
          dispatch(actions.viewer_set_featureinfo(acc));
        });
      }
    });

    // Find features from ArcGIS layers strategy
    const aglrs = utils.findActiveArcGISMapLayer(mainMap.getLayers());;
    aglrs.forEach(l => {
      if (l.get('selectable') === false) return;

      // Get features using datasource
      if (l.get("datasource")) {
      /*
        let buffer = 2;
        let nativeCRS = l.get("datasource").crs || 'EPSG:4326';
        let bbox = [coordinate[0]-buffer, coordinate[1]-buffer, coordinate[0]+buffer, coordinate[1]+buffer];
        const nativeBBOX = transformExtent(bbox, mapCRS, nativeCRS);
        getWFSFeaturesFilterByGeom(
          l.get("datasource").url, 
          l.get("datasource").typeNames,
          nativeCRS,
          50,
          nativeBBOX
          //"CONTAINS(" + l.get("datasource").geomName + ",POINT(" + coordinate.join(" ") + "))"
        )
        .then(res => res.json())
        .then(json => {

          // Parse JSON feature
          const parser = new OlFormatGeoJSON();
          const parseOptions = {
            dataProjection: nativeCRS,
            featureProjection: mapCRS
          };
          const features = parser.readFeatures(json, parseOptions);
          if (!features) return;

          // Add results
          features.forEach(feat => {
            acc.push(displayFeature(feat, l));
          });
          dispatch(actions.viewer_set_featureinfo(acc));          
        })
        .catch(err => console.log(err));
      // Get features using any other strategy
      */      
      } else {
        utils.parseArcGISFeatureInfo(mainMap, l, viewResolution, coordinate, mapCRS, (result) => {
          const format = l.getProperties().get_feature_info_format || 'application/json';
          if (!result) acc.push({ id: uuidV4(), type: 'error', format });
          if (typeof result === 'object') {
            if (Array.isArray(result)) {
              result.forEach(feat => {
                acc.push(displayFeature(feat, l));
              });
            } else {
              acc.push(displayFeature(result, l));
            }          
          } else {
           acc.push({id: uuidV4(), type: 'text', data: result, layer: l ? l.get('title') : '', "layerId": l ? l.get('id') : null});
          }
          dispatch(actions.viewer_set_featureinfo(acc));
        });
      }
    });    

    // No layers found, disable GetFeatureInfo
    //if (features.length === 0 && lrs.length === 0) {
      if (features.length === 0 && fvt_remote.length === 0) {
      let emptyResults = [{
        id: uuidV4(),
        type: 'text',
        data: `<p>${t("noResultsFound", "Não foram encontrados resultados")}</p>`
      }];
      dispatch(actions.viewer_set_featureinfo(emptyResults));
    }
  }

  useEffect(() => {
    if (!feature_info_control) return;
    if (feature_info_control.active) mainMap.on('singleclick', selectSingleClick);
    else mainMap.un('singleclick', selectSingleClick);
    return () => {
      mainMap.un('singleclick', selectSingleClick);
    }
  }, [feature_info_control]);  

  useEffect(() => {
    if (search) searchAll(search.coords, search.pixel);
  }, [search]);

  // Add highlight layer
  useEffect(() => {
    if (!mainMap) return;

    selectionLayer.current = new VectorLayer({
      id: 'featureinfo',
      renderMode: 'vector',
      source: new Vector({}),
      style: selectionLayerStyle,
      selectable: false
    });

    //const parentLayer = findOlLayer(mainMap, 'overlays');

    mainMap.addLayer(selectionLayer.current); 
    /*
    if (parentLayer) {
      parentLayer.getLayers().getArray().push(selectionLayer.current);
    } else {
      mainMap.addLayer(selectionLayer.current); 
    }
    */



    /*
    setTimeout(() => {
      //Add theme
      dispatch(actions.viewer_add_themes(
          "overlays",
          [
              {
                id: "featureinfo",
                title: 'Elementos Selecionados',
                description: "Elementos Selecionados",
                active: true,
                open: false,
                type: "VECTOR",
                opacity: 1
              }
          ]
      ));
      
      setTimeout(() => {
          selectionLayer.current = findOlLayer(mainMap, 'featureinfo');
          selectionLayer.current.setStyle(selectionLayerStyle);          

          // Turn layer on
          dispatch(actions.layers_set_checked([ ...viewer.config_json.checked, 'featureinfo']));
      }, 500);

    }, 1000);
    */

  }, [mainMap]); 

  /*
  useEffect(() => {
    if (!mainMap) return;
    if (selectionLayer) return;

    // Find selection layer
    selectionLayer = findOlLayer(mainMap, 'featureinfo');
    console.log('find featureinfo layer', selectionLayer);
    if (selectionLayer) {
      selectionLayer.setStyle(selectionLayerStyle);
    }    
  }, [layers]);
  */

  // Highlight features
  useEffect(() => {
    if (!selectionLayer.current) return;

    selectionLayer.current.getSource().clear();
    let features;
    featureinfo.forEach(feat => {
      if (feat.type === 'ol') {
        features = deserializeFeatures(feat.data);
        features = features instanceof OlCollection ? features.getArray() : features;
        //features.forEach(f => f.setStyle([selectionLayerStyle]));
        selectionLayer.current.getSource().addFeatures(features);
      }      
    });

    return () => {
      selectionLayer.current.getSource().clear();
    }
  }, [featureinfo]);

  return null
}


class FeatureInfoUtils  {
  constructor(core) {
    this.core = core;
  }

  /**
   * TODO: add description
   *
   * @param {String} serviceUrl Url of wfs service to query
   */
  getWFSFeaturesFilterByGeom(serviceUrl, typeNames, srsName, count, bbox, cql_filter) {
    let params = [
      "SERVICE=wfs",
      "REQUEST=GetFeature",
      "VERSION=1.1.0",
      "typeNames=" + typeNames,
      "srsName=" + srsName,
      "outputFormat=application/json",
      "COUNT=" + (count || 50),
    ];

    // Add bbox
    if (bbox) params.push("bbox=" + bbox.join(","));

    // Add CQL_FILTER
    if (cql_filter) params.push("cql_filter=" + cql_filter)
    
    // Build final URL
    let url = serviceUrl + params.join('&');

    // Use map proxy
    if (!isUrlAppOrigin(url)) {
      url = this.core.MAP_PROXY_URL + encodeURIComponent(url);
    };

    // Set headers
    let headers = {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest"
    };

    // Set request options
    const options = {
      //"headers": headers,
      //"referrer": "",
      //"referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      //"mode": "cors",
      //"credentials": "include"
    };

    // return request
    return fetch(url, options);
  }

  getFeatureInfoGeoJSON(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject) {
    let url = requestBuilder.call(this, map, l, viewResolution, coordinate, crs, 'application/geojson');
    fetch(url)
    .then(res => res.json())
    .then(geojson => {
  
      // Parse JSON feature
      const parser = new OlFormatGeoJSON();
      let data_crs = crs;
      if (geojson.crs && geojson.crs.properties && geojson.crs.properties.name) {
        if (geojson.crs.properties.name.indexOf('EPSG::4326') != -1) {
          data_crs = 'EPSG:4326';
        } else if (geojson.crs.properties.name.indexOf('CRS::84') != -1) {
          data_crs = 'EPSG:4326';
        }
      }    
      const parseOptions = {
        dataProjection: crs,
        featureProjection: crs
      };
      const features = parser.readFeatures(geojson, parseOptions);
  
      // Found GeoJSON features
      if (features.length) resolve(features);
      else reject();
    })
    .catch(err => {
      console.log('getFeatureInfoGeoJSON error', err);
      reject();
    })
  }
  
  getFeatureInfoJSON(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject) {
    let url = requestBuilder.call(this, map, l, viewResolution, coordinate, crs, 'application/json'); 
    fetch(url)
    .then(res => res.json())
    .then(json => {
  
      // Parse JSON feature
      const parser = new OlFormatGeoJSON();
      let data_crs = crs;
      if (json.crs && json.crs.properties && json.crs.properties.name) {
        if (json.crs.properties.name.indexOf('EPSG::4326') !== -1) {
          data_crs = 'EPSG:4326';
        } else if (json.crs.properties.name.indexOf('CRS::84') !== -1) {
          data_crs = 'EPSG:4326';
        }
      }
      const parseOptions = {
        dataProjection: data_crs,
        featureProjection: crs
      };
      const features = parser.readFeatures(json, parseOptions);
  
      // Found GeoJSON features
      if (features.length) resolve(features);
      else reject();
    })
    .catch(err => {
      reject();
    })
  }
  
  getFeatureInfoXML(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject) {
    let url = requestBuilder.call(this, map, l, viewResolution, coordinate, crs, 'text/xml');  
    fetch(url)
    .then(res => res.text())
    .then(xml => {
  
      // Found features
      let features = [];
  
      // Try GML format (in some services)
      let parser = new OlFormatGML();
      let parseOptions = {
        dataProjection: crs,
        featureProjection: crs
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
  
        // Found XML features
        if (features.length) resolve(features);
        else reject();
      });
    })
    .catch(err => {
      reject();
    });
  }
  
  getFeatureInfoGML(map, l, viewResolution, coordinate, crs, format, requestBuilder, resolve, reject) {
    let layerProps = l.getProperties();
    let url = requestBuilder.call(this, map, l, viewResolution, coordinate, crs, format || 'application/vnd.ogc.gml');
    fetch(url)
    .then(res => res.text())
    .then(gmlt => {
  
      //TODO: Add logic to identify geometry field name (assuming 'geometry')
      let gml = gmlt.replace('the_geom', 'geometry');
      gml = gml.replace('the_geom', 'geometry');
      gml = gml.replace('st_union', 'geometry');
      gml = gml.replace('st_union', 'geometry');
  
      let features = [];
      // Parse GML feature
      let parser = new OlFormatGML();
      let parseOptions = {
        dataProjection: crs,
        featureProjection: crs
      };
      try {
        features = parser.readFeatures(gml, parseOptions);
      } catch (e) {
        //console.log(e);
      }
  
      // Try parse with GML v2
      if (!features.length) {
        parser = new OlFormatGML2();
        parseOptions = {
          dataProjection: crs,
          featureProjection: crs
        };
        try {
          features = parser.readFeatures(gml, parseOptions);
        } catch (e) {
          //console.log(e);
        }
      }
  
      // Try parse with GML v3
      if (!features.length) {
        parser = new OlFormatGML3();
        parseOptions = {
          dataProjection: crs,
          featureProjection: crs,
          featureType: layerProps.layers
        };
        try {
          features = parser.readFeatures(gml, parseOptions);
        } catch (e) {
          //console.log(e);
        }
      }
  
      // Try parse with WMSGetFeatureInfo
      if (!features.length) {
        parseOptions = {
          dataProjection: crs,
          featureProjection: crs
        };      
        try {
          features = new WMSGetFeatureInfo().readFeatures(gml, parseOptions);
        } catch (e) {
          //console.log(e);
        }
      }   
  
      // Found GML features
      if (features.length) resolve(features);
      else reject();
    })
    .catch(err => {
      reject();
    });
  }
  
  getFeatureInfoHtml(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject) {
    let url = requestBuilder.call(this, map, l, viewResolution, coordinate, crs, 'text/html');  
    fetch(url)
    .then(res => res.text())
    .then(text => {
      resolve(text);
    })
    .catch(err => {
      reject();
    });
  }
  
  getFeatureInfoText(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject) {
    let url = requestBuilder.call(this, map, l, viewResolution, coordinate, crs, 'text/plain');
    fetch(url)
    .then(res => res.text())
    .then(text => {
      resolve(text);
    })
    .catch(err => {
      reject();
    });
  }
  
  getFeatureInfoEsriJSON(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject) {
    let url = requestBuilder.call(this, map, l, viewResolution, coordinate, crs, 'application/json'); 
    fetch(url)
    .then(res => res.json())
    .then(json => {
      const parser = new OlFormatEsriJSON();
      let data_crs = 'EPSG:4326' //crs;
      /*
      if (json.crs && json.crs.properties && json.crs.properties.name) {
        if (json.crs.properties.name.indexOf('EPSG::4326') !== -1) {
          data_crs = 'EPSG:4326';
        } else if (json.crs.properties.name.indexOf('CRS::84') !== -1) {
          data_crs = 'EPSG:4326';
        }
      }
      */   
      const parseOptions = {
        dataProjection: data_crs,
        featureProjection: crs
      };
  
      let results = json.results || [];
  
      if (l.get('layerId') || l.get('layerName')) {
        results = results.filter(r => {
          const val = (l.get('layerId') || []).includes(r.layerId);
          if (val) return true;
          return (l.get('layerName') || []).includes(r.layerName);
        });
      }
      const features = results.map(r => {
        const ft = parser.readFeatures(r, parseOptions);
        return ft[0];
      });  
      // Found EsriJSON features
      if (features.length) resolve(features);
      else reject();
    })
    .catch(err => {
      reject();
    })
  }
  
  async parseFeatureInfo (map, l, viewResolution, coordinate, crs, cb) {
    const callFormat = (format) => {
      return new Promise((resolve, reject) => {
        let requestBuilder = this.buildFeatureInfoWMSUrl;
        if (l.getSource() instanceof OlSourceWMTS) requestBuilder = this.buildFeatureInfoWMTSUrl;
        if (l.get('type') === 'WMTSXYZ') requestBuilder = this.buildFeatureInfoWMTSXYZUrl;
  
        if (/gml/ig.test(format)) {
          this.getFeatureInfoGML(map, l, viewResolution, coordinate, crs, format, requestBuilder, resolve, reject);
        } else if (/xml/ig.test(format)) {
          this.getFeatureInfoXML(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject);
        }
        else if (/geojson/ig.test(format)) {
          this.getFeatureInfoGeoJSON(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject);
        }
        else if (/json/ig.test(format)) {
          this.getFeatureInfoJSON(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject);
        }
        else if (/html/ig.test(format)) {
          this.getFeatureInfoHtml(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject);
        }
        else if (/plain/ig.test(format)) {
          this.getFeatureInfoText(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject);
        }
        else reject();
      });
    }
  
    // Start request
    const layerProps = l.getProperties();
    const format = layerProps.get_feature_info_format || 'application/json';
    callFormat(format)
    .then(result => {
      cb(result);
    })
    .catch(err => {
      cb(false);
    });
  }
  
  async parseArcGISFeatureInfo (map, l, viewResolution, coordinate, crs, cb) {
    const callFormat = (format) => {
      return new Promise((resolve, reject) => {
        //let requestBuilder = l.getSource() instanceof OlSourceWMTS ? buildFeatureInfoWMTSUrl : buildFeatureInfoArcGISUrl;
        let requestBuilder = this.buildFeatureInfoArcGISUrl;
        if (/json/ig.test(format)) {
          this.getFeatureInfoEsriJSON(map, l, viewResolution, coordinate, crs, requestBuilder, resolve, reject);
        }
        else reject();
      });
    }
  
    // Start request
    const layerProps = l.getProperties();
    const format = layerProps.get_feature_info_format || 'application/json';
    callFormat(format)
    .then(result => {
      cb(result);
    })
    .catch(err => {
      cb(false);
    });
  }
  
  findActiveWMSLayer(layers) {
    let result = [];
    layers.forEach(l => {
      if (l.getVisible() 
        && l.getSource 
        && (l.getSource() instanceof OlSourceTileWMS || l.getSource() instanceof OlSourceImageWMS || l.getSource() instanceof OlSourceWMTS)
      ) {
        result.push(l);
      }
  
      if (l.getVisible()
        && l.get("type") === "WMTSXYZ"
      ) {
        result.push(l);
      }
  
      if ((l instanceof OlGroup) && l.getVisible()) {
        let temp = this.findActiveWMSLayer(l.getLayers());
        temp.forEach(t => result.push(t));
      }
    });
    return result;
  }
  
  buildFeatureInfoWMSUrl(map, layer, viewResolution, coordinate, crs, format) {  
    let url = layer.getSource().getFeatureInfoUrl(
      coordinate,
      viewResolution,
      crs,
      //TODO: Add option to set FEATURE_COUNT by config
      { 'INFO_FORMAT': format, 'FEATURE_COUNT': 10 }
    );
    if (!isUrlAppOrigin(url)) {
      url = this.core.MAP_PROXY_URL + encodeURIComponent(url);
    }
    return url;
  }
  
  buildFeatureInfoWMTSUrl(map, layer, viewResolution, coordinate, crs, format) {
  
    const source = layer.getSource();
    const tilegrid = source.getTileGrid();
    const tileResolutions = tilegrid.getResolutions();
    let zoomIdx, diff = Infinity;
    let resolution;
  
    for (let i = 0; i < tileResolutions.length; i++) {
        const tileResolution = tileResolutions[i];
        const diffP = Math.abs(viewResolution-tileResolution);
        if (diffP < diff) {
            diff = diffP;
            zoomIdx = i;
            resolution =  tileResolution;
        }
        if (tileResolution < viewResolution) {
          break;
        }
    }
    const tileSize = tilegrid.getTileSize(zoomIdx);
    const tileSizeX = Array.isArray(tileSize) ? tileSize[0] : tileSize;
    const tileSizeY = Array.isArray(tileSize) ? tileSize[1] : tileSize;
    const tileOrigin = tilegrid.getOrigin(zoomIdx);
  
    const fx = (coordinate[0] - tileOrigin[0]) / (resolution * tileSizeX);
    const fy = (tileOrigin[1] - coordinate[1]) / (resolution * tileSizeY);  
    const tileCol = Math.floor(fx);
    const tileRow = Math.floor(fy);
    const tileI = Math.floor((fx - tileCol) * tileSizeX);
    const tileJ = Math.floor((fy - tileRow) * tileSizeY);
    const matrixIds = tilegrid.getMatrixIds()[zoomIdx];
    const matrixSet = source.getMatrixSet();
  
    let url = layer.get('get_feature_info_url');
    if (url.indexOf('?') < 0) {
      url += '?';
    }
  
    url = url    
      + 'SERVICE=WMTS&REQUEST=GetFeatureInfo'
      + '&TILEMATRIXSET=' + matrixSet
      + '&TILEMATRIX=' + matrixIds
      + '&LAYER=' + layer.get('layer')
      + '&STYLE=' + (layer.get('wmts_style') || '')
      + '&INFOFORMAT=' +  format
      + '&TileCol=' +  tileCol
      + '&TileRow=' +  tileRow
      + '&I=' +  tileI
      + '&J=' +  tileJ;
  
  
    if (!isUrlAppOrigin(url)) {
      url = this.core.MAP_PROXY_URL + encodeURIComponent(url);
    }
  
    return url;
  }
  
  buildFeatureInfoWMTSXYZUrl(map, layer, viewResolution, coordinate, crs, format) { 
    const source = layer.getSource();
    const tilegrid = source.getTileGrid();
    const tileResolutions = tilegrid.getResolutions();
    let zoomIdx, diff = Infinity;
    let resolution;
  
    for (let i = 0; i < tileResolutions.length; i++) {
        const tileResolution = tileResolutions[i];
        const diffP = Math.abs(viewResolution-tileResolution);
        if (diffP < diff) {
            diff = diffP;
            zoomIdx = i;
            resolution =  tileResolution;
        }
        if (tileResolution < viewResolution) {
          break;
        }
    }
    const tileSize = tilegrid.getTileSize(zoomIdx);
    const tileSizeX = Array.isArray(tileSize) ? tileSize[0] : tileSize;
    const tileSizeY = Array.isArray(tileSize) ? tileSize[1] : tileSize;
    const tileOrigin = tilegrid.getOrigin(zoomIdx);
  
    const fx = (coordinate[0] - tileOrigin[0]) / (resolution * tileSizeX);
    const fy = (tileOrigin[1] - coordinate[1]) / (resolution * tileSizeY);  
    const tileCol = Math.floor(fx);
    const tileRow = Math.floor(fy);
    const tileI = Math.floor((fx - tileCol) * tileSizeX);
    const tileJ = Math.floor((fy - tileRow) * tileSizeY);
  
    let zIndex = ('0' + zoomIdx).slice(-2);
    if (layer.get('zformat') === 'integer') {
      zIndex = zoomIdx;
    }
  
    const tileMatrixSet = layer.get('wmts_tilematrixset') || '';
    const tileMatix = tileMatrixSet + ':' + zIndex;
  
    let url = layer.get('url');
    if (layer.get('get_feature_info_url')) {
      url = layer.get('get_feature_info_url');
    }
    if (url.indexOf('?') < 0) {
      url += '?';
    } 
  
    url = url    
      + 'SERVICE=WMTS&REQUEST=GetFeatureInfo'
      + '&TILEMATRIXSET=' + tileMatrixSet
      + '&TILEMATRIX=' + tileMatix
      + '&LAYER=' + (layer.get('wmts_layer') || layer.get('layer') || '')
      + '&STYLE=' + (layer.get('wmts_style') || '')
      + '&INFOFORMAT=' +  format
      + '&TileCol=' +  tileCol
      + '&TileRow=' +  tileRow
      + '&I=' +  tileI
      + '&J=' +  tileJ;
  
    if (!isUrlAppOrigin(url) && layer.get('get_feature_info_proxy_request') !== false) {
      url = this.core.MAP_PROXY_URL + encodeURIComponent(url);
    }
  
    return url;
  }
  
  buildFeatureInfoArcGISUrl(map, layer, viewResolution, coordinate, crs, format) {
    
    const geometryType = 'esriGeometryPoint';
    const mapSize = map.getSize();
    const mapExtent = transformExtent(map.getView().calculateExtent(mapSize), crs, 'EPSG:4326');
  
    let params = [
      `geometry=${transform(coordinate, crs, 'EPSG:4326').join(',')}`,
      `geometryType=${geometryType}`,
      `layers=${layer.get('get_feature_info_layers') || 'visible'}`,
      `sr=4326`,
      `tolerance=${layer.get('get_feature_info_tolerance') || 1}`,
      `mapExtent=${mapExtent.join(',')}`,
      `imageDisplay=${mapSize.join(',')},96`,
      `returnGeometry=true`,
      `f=json`
    ];
  
    let url = layer.getSource().getUrls ? layer.getSource().getUrls()[0] : layer.getSource().getUrl();
    url = `${url}/identify?${params.join('&')}`;
    if (!isUrlAppOrigin(url)) {
      url = this.core.MAP_PROXY_URL + encodeURIComponent(url);
    }
    return url;
  }
  
  findActiveArcGISMapLayer(layers) {
    let result = [];
    layers.forEach(l => {
      if (l.getVisible() 
        && l.getSource 
        && (l.getSource() instanceof OlSourceTileArcGISRest || l.getSource() instanceof OlSourceImageArcGISRest)
      ) {
        result.push(l);
      }
      if ((l instanceof OlGroup) && l.getVisible()) {
        let temp = this.findActiveArcGISMapLayer(l.getLayers());
        temp.forEach(t => result.push(t));
      }
    });
    return result;
  }  

}