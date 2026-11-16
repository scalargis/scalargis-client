import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { CollapsiblePanel, IconAngleUp, IconAngleDown } from '@scalargis/ui';
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

  const { mainMap, viewer, dispatch, Models, auth } = config;

  const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;


  const component_cfg = record.config_json || {};
  const title = record.title || 'Timeline';
  const header = component_cfg.header || title;


  const [opened, { toggle }] = useDisclosure(true);
  const [theme, setTheme] = useState();
  const [dimension, setDimension] = useState();

  const addedThemeId = useRef(null);

  useEffect(() => {
    if (!viewer?.config_json?.layers) return;

    const layers = viewer.config_json.layers;
    const datasource = component_cfg?.datasource;
    const configId = datasource?.layer?.id != null ? String(datasource.layer.id) : null;
    const themeId = addedThemeId.current || datasource?.layer_id || configId;

    const _theme = themeId ? layers.find(l => l.id === themeId) : null;
    if (_theme) {
      setTheme(_theme);
      return;
    }

    if (!datasource?.layer || addedThemeId.current) return;

    const newTheme = { ...datasource.layer, id: configId || String(uuidV4()) };
    addedThemeId.current = newTheme.id;

    const _parent = datasource.parent_id || "main";
    dispatch(actions.viewer_add_themes(_parent, [newTheme], true));
    dispatch(actions.layers_set_checked([ ...(viewer?.config_json?.checked || []), newTheme.id]));
    setTheme(newTheme);
  }, [viewer?.config_json?.layers, component_cfg?.datasource?.layer_id, component_cfg?.datasource?.layer]);

  useEffect(() => {
    if (!mainMap) return;
    if (!theme) {
      setDimension(undefined);
      return;
    }

    let dimension;
    let dimension_name = component_cfg?.dimension?.name;
    if (theme.dimension_name) dimension_name = theme.dimension_name;

    if (theme?.dimensions?.length) {
      dimension = dimension_name ? theme.dimensions.find(d => d.name === dimension_name) : theme.dimensions[0];
    }

    if (dimension) {
      setDimension(dimension);
      return;
    }

    setDimension(undefined);
    if (!theme.url) return;

    let url = theme.url;
    url = removeUrlParam(url, 'request')
    url = removeUrlParam(url, 'service')
    url = removeUrlParam(url, 'version')
    url = url + (url.indexOf('?') > -1 ? '' : '?')
    url = url + '&SERVICE=WMS&REQUEST=GetCapabilities';
    if (theme?.version) {
      url = url + '&VERSION=' + theme.version;
    }

    if (isUrlAppHostname(url) && viewer.integrated_authentication && auth?.data?.auth_token) {
      const authkey = viewer?.integrated_authentication_key || 'authkey';
      url = url + '&' + authkey + '=' + auth.data.auth_token;
    }

    if (!isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    }

    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
    .then(res => {
      if (!res.ok) throw Error(res.statusText);
      return res;
    })
    .then(res => res.text())
    .then((r) => {
      if (controller.signal.aborted) return;
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
            dimension = dimension_name ? layer.Dimension.find(d => d.name === dimension_name) : layer.Dimension[0];
          } else if (layer.Dimension) {
            dimension = layer.Dimension || null;
          }

          if (dimension) setDimension(dimension);
        }
      } catch (e) {
        console.log(e);
      }
    }).catch((error) => {
      if (error?.name !== 'AbortError') console.log(error);
    });

    return () => controller.abort();
  }, [mainMap, theme?.id, theme?.url, theme?.layers, theme?.version, theme?.dimensions, theme?.dimension_name, component_cfg?.dimension?.name]);

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
          type="button"
          fullWidth
          color="warning"
          rightSection={opened ? <IconAngleUp /> : <IconAngleDown />}
          title="Fechar"
          aria-expanded={opened}
          onClick={toggle}>
        {theme?.title || title}
      </Button>

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
    <CollapsiblePanel header={header} toggleable={false}>
      { renderContent() }
    </CollapsiblePanel>
  )

  // Render component
  return renderContent();
}
