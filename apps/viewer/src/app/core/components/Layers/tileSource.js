import OSM from "ol/source/OSM";
import OlSourceXYZ from "ol/source/XYZ";
import OlSourceTileJSON from "ol/source/TileJSON";
import { removeUrlParam, addUrlParam } from '../../utils';

/** Builds the OL tile source of an OSM, XYZ, WMTSXYZ or TileJSON layer config. */
export function createTileSource(config) {
  switch(config.type) {
    case 'OSM':
      return new OSM();
    case 'XYZ':
      return new OlSourceXYZ({ url: config.url });
    case 'WMTSXYZ':
      return new OlSourceXYZ({
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
          if (config.wmts_layer) {
            wmts_url = removeUrlParam(wmts_url, 'layer');
            wmts_url = addUrlParam(wmts_url, 'layer', config.wmts_layer);            
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
      });
    case 'TileJSON':
      return new OlSourceTileJSON({ url: config.url });
    default:
      return undefined;
  }
}
