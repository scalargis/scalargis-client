import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, LoadingOverlay } from '@mantine/core';
import { CollapsiblePanel, IconSearch } from '@scalargis/ui';

import { MainMenuButton } from '../../components';

import componentActions from './actions';
import componentReducers from './reducers';
import SearchLayers from './SearchLayers';
import { createLayer } from './map';
import './style.scss';


/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  const title = record.title || 'Pesquisar Temas';
  const icon = record.icon || <IconSearch />;

  if (record.mode !== 'child') {
  return (
    <MainMenuButton
      title={title}
      className={className}
      icon={icon}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
  } else {
    return null;
  }
}

/**
 * Actions
 */
export const actions = {
  ...componentActions
}

/**
 * Reducers
 */
 export const reducers = {
  ...componentReducers
 }

/**
 * Main component
 */
export default function Main(props) {

  const { as, core, config, actions, record } = props;

  const { viewer, dispatch, mainMap, Models } = config;
  const { selected_menu } = viewer.config_json;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Pesquisar Temas';
  const header = component_cfg.header || title;

  const layer_id = component_cfg.exclusive_layer === true ? record.id : 'searchlayers';
  const layer = useRef();

  const buildLayersList = () => {
    if (component_cfg?.use_layers_datatables === true) {
      return (viewer?.config_json?.layers || []).filter(l => l.datatable).map(l => {
        return {
          id: l.id,
          title: l.title,
          description: l.description,
          ...l.datatable
        }
      });
    }
    return component_cfg.layers || [];
  }

  const [blockedPanel, setBlockedPanel] = useState(false);
  const [layers, setLayers] = useState(() => buildLayersList());


  const component_store_state = useSelector((state) => {
    return state?.searchlayers;
  });

  useEffect(() => {
    if (!mainMap || !config?.viewer?.loaded || layer?.current) return;

    createLayer(layer, layer_id, mainMap, component_cfg.style);

  }, [mainMap, config?.viewer?.loaded]);

  useEffect(() => {
    //if (selected_menu === 'searchlayers') dispatch(actions.viewer_set_exclusive_mapcontrol('SearchLayers'));
  }, [selected_menu]);

  useEffect(() => {
    if (component_store_state && component_store_state[record.id]) {
      const new_layers = component_store_state[record.id].layers.map(l=>{
        return {
          id: l.id,
          title: l.title,
          description: l.description,
          ...l.datatable
        }
      });
      setLayers(new_layers);
    }
  }, [component_store_state, record.id]);


  // Render content
  function renderContent() {
    return (
      <div className="search-layers">
        <SearchLayers
          core={core}
          config={config}
          layer={layer}
          layers={layers}
          setLayersList={() => setLayers(buildLayersList())}
          actions={actions}
          pubsub={core.pubsub}
          dispatch={dispatch}
          mainMap={mainMap}
          record={record}
          Models={Models}
          setBlockedPanel={setBlockedPanel}
        />
      </div>
    )
  }

  if (as === 'panel') return (
    <Box pos="relative" style={{height: 'calc(100%)'}}>
      <CollapsiblePanel header={header} toggleable={false}>
        { renderContent() }
      </CollapsiblePanel>
      <LoadingOverlay visible={blockedPanel} zIndex={1003} loaderProps={{ size: 50 }} />
    </Box>
  )

  return null
}
