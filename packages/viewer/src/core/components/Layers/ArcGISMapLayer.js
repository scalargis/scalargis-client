import { useContext, useEffect, useRef, useState } from "react";
import OLTileLayer from "ol/layer/Tile";
import OLImageLayer from "ol/layer/Image";
import OlSourceTileArcGISRest from 'ol/source/TileArcGISRest';
import OlSourceImageArcGISRest from 'ol/source/ImageArcGISRest';
import AppContext from "../../../AppContext";
import { removeUrlParam } from "../../utils";
import { dumpLayers } from "./MorphLayer";
import { isUrlAppOrigin, isUrlAppHostname } from '../../utils';
import { getResolutionForScale } from '../../model/MapModel';

const ArcGISMapLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  //const auth = core.store.getState().root.auth;

  const MAP_PROXY = core.MAP_PROXY_URL;

  function createLayer(config) {
    let url = config.url;

    let proxy_requests = false;
    if (viewer && viewer.config_json && viewer.config_json.proxy_http_image_requests) {
      proxy_requests = true;
    }
    if(config && config.proxy_http_image_requests != null) {
      proxy_requests = config.proxy_http_image_requests;
    }

    let sourceConfig = {
      url: url,
      //hidpi: false,
      params: {
        'LAYERS': config.layers,
      }
    };

    /*
    //Add user authentication token  
    if (isUrlAppHostname(url) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        sourceConfig.params[authkey] = auth.data.auth_token;
      }
    }
    */

    if (proxy_requests) {
      if (window.location.protocol === 'https:' && !isUrlAppOrigin(url) && navigator.userAgent.indexOf("Firefox") == -1) {
        const turl = new URL(url);
        if (turl.protocol === 'http:') {
          if (config.tiled) {
            sourceConfig["tileLoadFunction"] = function(imageTile, src) {
              imageTile.getImage().src = MAP_PROXY + encodeURIComponent(src);
            };
          } else {
            sourceConfig["imageLoadFunction"] = function(image, src) {
              image.getImage().src = MAP_PROXY + encodeURIComponent(src);
            };            
          }
        } else {
          proxy_requests = false;
        }
      } else {
        proxy_requests = false;
      }
    }

    // Check theme has map CRS
    let crs = mainMap.getView().getProjection().getCode();
    if (config.crs_options && config.crs_options.indexOf(crs) === -1) {
      sourceConfig['projection'] = 'EPSG:4326';
    }

    if (config.attributions) {
      sourceConfig['attributions'] = config.attributions;
    }

    // Create layer
    let t;
    if (config.tiled) {
      t = new OLTileLayer({
        id: config.id,
        title: config.title,
        type: config.type,
        visible: config.active,
        opacity: config.opacity ? config.opacity : 1,
        source: new OlSourceTileArcGISRest(sourceConfig)
      });
    } else {
      t = new OLImageLayer({
        id: config.id,
        title: config.title,
        type: config.type,
        visible: config.active,
        opacity: config.opacity ? config.opacity : 1,       
        source: new OlSourceImageArcGISRest(sourceConfig)
      })
    }
    if (t && config.datasource) t.set("datasource", config.datasource);
    if (t && config.get_feature_info_layers) t.set('get_feature_info_layers', config.get_feature_info_layers);
    if (t && config.get_feature_info_tolerance) t.set('get_feature_info_tolerance', config.get_feature_info_tolerance);

    if (t && config.min_resolution) {
      t.setMinResolution(config.min_resolution);
    }
    if (t && config.max_resolution) {
      t.setMaxResolution(config.max_resolution);
    }
    if (t && config.min_scale) {
      const res = getResolutionForScale(config.min_scale, mainMap.getView().getProjection().getUnits());
      t.setMinResolution(res);
    }    
    if (t && config.max_scale) {
      const res = getResolutionForScale(config.max_scale, mainMap.getView().getProjection().getUnits());
      t.setMaxResolution(res);
    }

    if (t && config.layerId != null) {
      t.set('layerId', Array.isArray(config.layerId) ? config.layerId : [config.layerId]);
    }
    if (t && config.layerName) {
      t.set('layerName', Array.isArray(config.layerName) ? config.layerName : [config.layerName]);
    }       

    return t;
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
    layer.current.setVisible(checked.includes(config.id));
  }, [checked]);
  
  // Changed config
  useEffect(() => {
    let params = {
      'LAYERS': config.layers
    }
    layer.current.getSource().updateParams(params);
    layer.current.set('selectable', config.selectable);
    layer.current.set('get_feature_info_layers', config.get_feature_info_layers)
    layer.current.set('get_feature_info_tolerance', config.get_feature_info_tolerance)
    layer.current.setOpacity(config.opacity);
  }, [config]);

  return null;
};

export default ArcGISMapLayer;