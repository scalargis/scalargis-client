import { useContext, useEffect, useRef } from "react";
import OLTileLayer from "ol/layer/Tile";
import OLImageLayer from "ol/layer/Image";
import OlSourceTileWMS from 'ol/source/TileWMS';
import OlSourceImageWMS from 'ol/source/ImageWMS';
import AppContext from "../../../AppContext";
import { removeUrlParam } from "../../utils";
import { isUrlAppOrigin, isUrlAppHostname } from '../../utils';
import { getResolutionForScale } from '../../model/MapModel';

const WMSLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const auth = core.store.getState().root.auth;

  const MAP_PROXY = core.MAP_PROXY_URL;

  function createLayer(config) {
    let url = config.url;
    url = removeUrlParam(url, 'service');
    url = removeUrlParam(url, 'version');
    url = removeUrlParam(url, 'request');

    let proxy_requests = false;
    if (viewer && viewer.config_json && viewer.config_json.proxy_http_image_requests) {
      proxy_requests = true;
    }
    if(config && config.proxy_http_image_requests != null) {
      proxy_requests = config.proxy_http_image_requests;
    }

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
        'FORMAT': config.get_map_format || config.format || 'image/png',
        'STYLES': config.wms_style || config.styles
      }
    };

    //Add user authentication token  
    if (isUrlAppHostname(url) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        sourceConfig.params[authkey] = auth.data.auth_token;
      }
    }

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
      if (config.crs_options.indexOf('EPSG:4326') !== -1) {
        sourceConfig['projection'] = 'EPSG:4326';
      } else {
        sourceConfig['projection'] = 'CRS:84';
      }
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
        source: new OlSourceTileWMS(sourceConfig)
      });
    } else {
      t = new OLImageLayer({
        id: config.id,
        title: config.title,
        type: config.type,
        visible: config.active,
        opacity: config.opacity ? config.opacity : 1,       
        source: new OlSourceImageWMS(sourceConfig)
      })
    }
    if (t && config.datasource) t.set("datasource", config.datasource);
    if (t && config.get_feature_info_format) t.set('get_feature_info_format', config.get_feature_info_format);

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

    // Set legend URL
    let legendUrl = createLegendUrl(config.url, config.wms_layers || config.layers, config.crs)
    if (proxy_requests) {
      legendUrl = MAP_PROXY + encodeURIComponent(legendUrl);
    }
    t.set('legendURL', legendUrl);
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
      'LAYERS': config.layers,
      'TILED': config.tiled,
      'VERSION': config.version,
      'FORMAT': config.get_map_format || config.format || 'image/png',
      'STYLES': config.wms_style || config.styles
    }
    layer.current.getSource().updateParams(params);
    layer.current.set('selectable', config.selectable);
    layer.current.set('get_feature_info_format', config.get_feature_info_format)
    layer.current.setOpacity(config.opacity);
  }, [config]);

  return null;
};

const createLegendUrl = (url, layer, srs = 4326) => {
  var finalurl = url;
  finalurl += finalurl.indexOf('?') === -1 ? '?' : '';

  //console.log('SRS=' + (srs.indexOf(':') === -1 ? 'EPSG:' + srs : srs));

  return finalurl + '&' + ([
      'SERVICE=WMS',
      'VERSION=1.1.1',
      'REQUEST=GetLegendGraphic',
      'FORMAT=image%2Fpng',
      'SRS=' + (String(srs).indexOf(':') === -1 ? 'EPSG:' + srs : srs),
      'CRS=' + (String(srs).indexOf(':') === -1 ? 'EPSG:' + srs : srs),
      'LAYER=' + layer
  ].join('&'));
};

export default WMSLayer;