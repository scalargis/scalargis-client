import React from "react";
import TileLayer from "./TileLayer";
import WMSLayer from "./WMSLayer";
import WFSLayer from "./WFSLayer";
import OLGroupLayer from "ol/layer/Group";
import WMTSLayer from "./WMTSLayer";
import VectorTileLayer from "./VectorTileLayer";
import VectorLayer from "./VectorLayer";
import GeoJSONLayer from "./GeoJSONLayer";
import KMLLayer from "./KMLLayer";
import ArcGISMapLayer from "./ArcGISMapLayer";
import COGLayer from "./COGLayer";
import OGCMapTileLayer from "./OGCMapTileLayer";
import OGCVectorTileLayer from "./OGCVectorTileLayer";
import OGCFeaturesLayer from "./OGCFeaturesLayer";
import OGCMap from "./OGCMap";

import GroupLayer from './GroupLayer';

export function dumpLayers(collection, only) {
  collection.forEach(l => {
    //console.log(l.get('id'), l.get('type'), l.get('title'), l.getVisible());
    if (l instanceof OLGroupLayer) dumpLayers(l.getLayers(), only);
  })
}

const MorphLayer = React.memo(({ layers, config, group, checked, viewer }) => {

  if (!config) return null;

  // Create component layer
  let LayerComponent;
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
      LayerComponent = TileLayer;
      break;
      
    case 'XYZ': 
      LayerComponent = TileLayer;
      break;

    case 'WMTSXYZ':
      LayerComponent = TileLayer;
      break;
      
    case 'BING':
      LayerComponent = TileLayer;
      break;
      
    case 'TileJSON':
      LayerComponent = TileLayer;
      break;

    case 'ArcGISMap': 
      LayerComponent = ArcGISMapLayer;
      break; 
      
    case 'COG':      
      LayerComponent = COGLayer;
      break;

    case 'OGCMapTile':
      LayerComponent = OGCMapTileLayer;
      break;

    case 'OGCVectorTile':
      LayerComponent = OGCVectorTileLayer;
      break;

    case 'OGCFeatures':
      LayerComponent = OGCFeaturesLayer;
      break;

    case 'OGCMap':
      LayerComponent = OGCMap;
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
      checked={checked}
      viewer={viewer}
    />
  )

}, (prev, next) =>
  prev.config === next.config &&
  prev.layers === next.layers &&
  prev.group === next.group &&
  prev.checked === next.checked &&
  prev.viewer?.config_json?.drawings === next.viewer?.config_json?.drawings
);

export default MorphLayer;