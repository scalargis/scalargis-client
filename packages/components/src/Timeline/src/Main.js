import React, { useEffect, useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import TimelineControl from './TimelineControl';
import { WMSCapabilities } from 'ol/format';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  return (React.Fragment);
}

export default function Main(props) {

  const { as, core, config, utils, actions, record } = props;

  const { mainMap, viewer, dispatch, Models } = config;

  const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;


  const component_cfg = record.config_json || {};
  const title = record.title || 'Timeline';
  const header = component_cfg.header || title;


  const [opened, setOpened] = useState(true);
  const [theme, setTheme] = useState();
  const [dimension, setDimension] = useState();

  useEffect(() => {
    if (!mainMap) return;

    let _theme;

    if (component_cfg?.datasource?.layer_id) {
      _theme = viewer.config_json.layers.find(l => l.id === component_cfg?.datasource?.layer_id);
    }

    if (_theme) {
      setTheme(_theme);
    } else {
      if (component_cfg?.datasource?.layer) {
        _theme = { id: String(uuidV4()), ...component_cfg?.datasource?.layer}
        const _parent = component_cfg?.datasource?.parent_id || "main";
        dispatch(actions.viewer_add_themes(
          _parent,
          [_theme],
          true
        ));
        dispatch(actions.layers_set_checked([ ...viewer.config_json.checked, _theme.id])); 
        setTheme(_theme);
      }
    }

  }, [mainMap]);

  useEffect(() => {

    if (!mainMap) return;
    if (!theme) return;

    let dimension;
    let dimension_name;
      
    if (theme) {
      if (theme.dimension_name) dimension_name = theme.dimension_name;

      if (theme?.dimensions?.length) {
        dimension = theme.dimensions.find(d => d.name === dimension_name);
      }

      if (dimension) {
        //Set Dimension to state
        setDimension(dimension);
      } else {
        let url = theme.url;;
        url = removeUrlParam(url, 'request')
        url = removeUrlParam(url, 'service')
        url = removeUrlParam(url, 'version')
        url = url + (url.indexOf('?') > -1 ? '' : '?')
        url = url + '&SERVICE=WMS&REQUEST=GetCapabilities';
        if (theme?.version) {
          url = url + '&VERSION=' + theme.version;
        }
    
        //Add user authentication token
        if (isUrlAppHostname(url) && viewer.integrated_authentication) {
          if (auth && auth.data && auth.data.auth_token) {
            const authkey = viewer?.integrated_authentication_key || 'authkey';
            url = url + '&' + authkey + '=' + auth.data.auth_token;
          }
        }
    
        if (!isUrlAppOrigin(url)) {
          url = core.MAP_PROXY_URL + encodeURIComponent(url);
        }

        fetch(url)
        .then(res => {
          if (!res.ok) throw Error(res.statusText);
          return res;
        })
        .then(res => res.text())
        .then((r) => {
          try {
            const parser = new WMSCapabilities();
            const wms = parser.read(r);

            let layer;
            if (wms?.Capability?.Layer?.Layer.length) {
              layer = wms.Capability.Layer.Layer.find(l => l.Name === theme.layers);
            } else {
              layer = wms.Capability.Layer.Layer;
            }

            if (layer) {
              if (layer?.Dimension?.length) {
                dimension = layer.Dimension.find(d => d.name === theme.dimension_name);
              } else if (layer.Dimension) {
                dimension = layer.Dimension || null;
              }
              
              if (dimension) {
                //Set Dimension to state
                setDimension(dimension);
              }
            }
          } catch (e) {
            console.log(e);
          }
        }).catch((error) => {
            console.log(e);
        });
      }
    } else {
      //TODO
    }

  }, [theme]);

  useEffect(() => {
    if (!mainMap) return;
    if (!theme) return;

    if (component_cfg?.hideLayerOnCollapse === true) {
      let checked = [...viewer.config_json.checked];
      if (opened) {
        if (!checked.includes(theme.id)) checked.push(theme.id);
      } else {
        checked = checked.filter(p => p !== theme.id);
      }
      dispatch(actions.layers_set_checked(checked));
    }
  }, [opened]);

  function renderContent() {
    return (
      <div style={{backgroundColor: "white", padding: "10px", borderRadius: "10px"}}>

      <Button
          style={{ width: '100%' }}
          className="p-button-warning"
          label={theme?.title || title}
          iconPos="right"
          icon={opened ? "pi pi-angle-up" : "pi pi-angle-down"}
          title="Fechar"
          onClick={e => setOpened(!opened)} />

        <TimelineControl
          core={core}
          viewer={viewer}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          record={record}
          utils={utils}
          Models={Models}
          theme={theme}
          dimension={dimension} 
          opened={opened}/>
      </div>
    )  
  }

  if (as === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  // Render component
  return renderContent();
}