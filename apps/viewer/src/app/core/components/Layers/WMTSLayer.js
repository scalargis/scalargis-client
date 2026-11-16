import { useContext, useEffect, useRef } from "react";
import OlSourceWMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import OLTileLayer from "ol/layer/Tile";
import AppContext from "../../../AppContext";
import { isUrlAppOrigin, isUrlAppHostname, removeUrlParam, addUrlParam } from '../../utils';

const WMTSLayer = ({ config, group, checked, viewer }) => {

  const { core, mainMap } = useContext(AppContext);
  const layer = useRef();

  const SOURCE_KEYS = ['url', 'layer', 'wmts_capabilities', 'wmts_tilematrixset', 'wmts_style', 'wmts_format',
    'attributions', 'proxy_http_image_requests'];
  const sourceConfig = useRef();

  /** Builds the WMTS source with the style, format, auth key, proxy, and attributions of the config. */
  function createSource(config) {
    const url = config.url;

    let proxy_requests = false;
    if (viewer && viewer.config_json && viewer.config_json.proxy_http_image_requests) {
      proxy_requests = true;
    }
    if(config && config.proxy_http_image_requests != null) {
      proxy_requests = config.proxy_http_image_requests;
    }

    let wmts_options = {
      layer: config.layer,
      matrixSet: config.wmts_tilematrixset || 'EPSG:900913',
      format: 'image/png'
    }

    try {
      wmts_options = optionsFromCapabilities(config.wmts_capabilities, {
        layer: config.layer,
        matrixSet: config.wmts_tilematrixset || 'EPSG:900913',
        format: 'image/png'
      });
    } catch (error) {
      console.log(`Coul not load WMTS layer capabilities: ${config?.title}`);
    }

    if (config.wmts_style) {
      wmts_options.style = config.wmts_style;
    }
    if (config.wmts_format && config.wmts_format.toLowerCase().indexOf('image/') !== -1) {
      wmts_options.format = config.wmts_format;
    }

    const auth = core.store.getState().root.auth;
    if (isUrlAppHostname(url) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';

        if (wmts_options.urls && wmts_options.urls.length) {
          const urls = wmts_options.urls.map(u => {
            let new_url = removeUrlParam(u, authkey);
            new_url = addUrlParam(new_url, authkey, auth.data.auth_token);
            return new_url;
          });
          wmts_options.urls = urls;
        };
      }
    }

    if (proxy_requests) {
      if (window.location.protocol === 'https:' && !isUrlAppOrigin(url) && navigator.userAgent.indexOf("Firefox") == -1) {
        const turl = new URL(url);
        if (turl.protocol === 'http:') {
          wmts_options["tileLoadFunction"] = function(imageTile, src) {
            imageTile.getImage().src = core.MAP_PROXY_URL + encodeURIComponent(src);
          };
        }
      }
    }

    if (config.attributions) {
      wmts_options['attributions'] = config.attributions;
    }

    sourceConfig.current = config;
    return new OlSourceWMTS(wmts_options);
  }

  useEffect(() => {
    if (!mainMap) return;

    layer.current = new OLTileLayer({
      ...config,
      visible: config.active,
      source: createSource(config)
    });
    group.getLayers().push(layer.current);

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
    if (!layer.current) return;
    const previous = sourceConfig.current;
    if (!previous || SOURCE_KEYS.some(k => previous[k] !== config[k])) {
      layer.current.setSource(createSource(config));
    }
    layer.current.set('selectable', config.selectable);
    layer.current.set('wmts_format', config.wmts_format);
    layer.current.set('wmts_style', config.wmts_style);    
    layer.current.set('get_feature_info_format', config.get_feature_info_format);
    layer.current.setOpacity(config.opacity);
  }, [config]);

  return null;
};

export default WMTSLayer;