import React from "react";
import TileLayer from "./TileLayer";
import WMSLayer from "./WMSLayer";
import WFSLayer from "./WFSLayer";
import OSM from "ol/source/OSM";
import OlSourceXYZ from "ol/source/XYZ";
import OlSourceTileJSON from "ol/source/TileJSON";
import OLGroupLayer from "ol/layer/Group";
import WMTSLayer from "./WMTSLayer";
import VectorTileLayer from "./VectorTileLayer";
import VectorLayer from "./VectorLayer";
import GeoJSONLayer from "./GeoJSONLayer";
import KMLLayer from "./KMLLayer";
import GroupLayer from './GroupLayer';
import { removeUrlParam, addUrlParam} from '../../utils';

export function dumpLayers(collection, only) {
  collection.forEach(l => {
    console.log(l.get('id'), l.get('type'), l.get('title'), l.getVisible());
    if (l instanceof OLGroupLayer) dumpLayers(l.getLayers(), only);
  })
}

const MorphLayer = ({ layers, config, group, checked, viewer }) => {

  if (!config) return null;

  // Create component layer
  let source, LayerComponent;
  switch(config.type) {

    case 'VTILE': 
      LayerComponent = VectorTileLayer;
      break;
      
    case 'VECTOR': 
      LayerComponent = VectorLayer;
      break; 

    case 'GeoJSON': 
      LayerComponent = GeoJSONLayer;
      break;

    case 'KML': 
      LayerComponent = KMLLayer;
      break;      
    
    case 'WMS': 
      LayerComponent = WMSLayer;
      break;
      
    case 'WFS': 
      LayerComponent = WFSLayer;
      break;
      
    case 'WMTS': 
      LayerComponent = WMTSLayer;
      break;
      
    case 'OSM':
      source = new OSM()
      LayerComponent = TileLayer;
      break;
      
    case 'XYZ': 
      source = new OlSourceXYZ({ url: config.url })
      LayerComponent = TileLayer;
      break;

    case 'WMTSXYZ':
      source = new OlSourceXYZ({
        tileUrlFunction: function(coordinate) {
          let wmts_url = config.url;

          wmts_url = removeUrlParam(wmts_url, 'service');
          wmts_url = addUrlParam(wmts_url, 'service', 'WMTS');

          wmts_url = removeUrlParam(wmts_url, 'request');
          wmts_url = addUrlParam(wmts_url, 'request', 'GetTile');          

          if (config.wmts_version) {
            wmts_url = removeUrlParam(wmts_url, 'version');
            wmts_url = addUrlParam(wmts_url, 'version', config.wmts_version);
          }

          let z = ('0' + coordinate[0]).slice(-2);
          if (config.zformat === 'integer') {
            z = coordinate[0];
          }
          wmts_url = wmts_url.replace('{z}', z);
          wmts_url = wmts_url.replace('{x}', coordinate[1]);
          wmts_url = wmts_url.replace('{y}', coordinate[2]);

          if (config.layer) {
            wmts_url = removeUrlParam(wmts_url, 'layer');
            wmts_url = addUrlParam(wmts_url, 'layer', config.layer);            
          }
          if (config.wmts_tilematrixset) {
            wmts_url = removeUrlParam(wmts_url, 'tilematrixset');
            wmts_url = addUrlParam(wmts_url, 'tilematrixset', config.wmts_tilematrixset);
            wmts_url = wmts_url.replace('{tilematrixset}', config.wmts_tilematrixset);
          }                 
          if (config.wmts_style) {
            wmts_url = removeUrlParam(wmts_url, 'style');
            wmts_url = addUrlParam(wmts_url, 'style', config.wmts_style);
          }
          //Legacy, replaced by wmts_format
          if (config.get_tile_format) {
            wmts_url = removeUrlParam(wmts_url, 'format');
            wmts_url = addUrlParam(wmts_url, 'format', config.get_tile_format);
          }          
          if (config.wmts_format) {
            wmts_url = removeUrlParam(wmts_url, 'format');
            wmts_url = addUrlParam(wmts_url, 'format', config.wmts_format);
          }

          return wmts_url;
        }
      })
      LayerComponent = TileLayer;
      break;
      
    case 'BING':
      LayerComponent = TileLayer;
      break;
      
    case 'TileJSON':
      source = new OlSourceTileJSON({ url: config.url })
      LayerComponent = TileLayer;
      break;
      
    case 'GROUP':
      LayerComponent = GroupLayer;
      break;
      
    default:
      return null;
  }

  // Render component layer
  return (
    <LayerComponent 
      key={config.id}
      config={config}
      layers={layers}
      group={group}
      source={source}
      checked={checked}
      viewer={viewer}
    />
  )

};

export default MorphLayer;