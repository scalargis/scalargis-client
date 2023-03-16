import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import OLGroupLayer from 'ol/layer/Group';
import { Panel } from 'primereact/panel';
import componentActions from './actions';
import componentReducers from './reducers';
import SearchLayers from './SearchLayers';
import { createLayer } from './map';
import './style.scss';


/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  const component_cfg = record.config_json || {};
  const title = record.title || 'Pesquisar Temas';
  const icon = record.icon || "pi pi-search";

  if (record.mode !== 'child') {
  return (
    <Button
      title={title}
      className={className}
      icon={icon}
      style={{ margin: '0.5em 1em' }}
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

  const ref = useRef(null);
  const [blockedPanel, setBlockedPanel] = useState(false);
  const [layers, setLayers] = useState(component_cfg.layers || []);


  const component_store_state = useSelector((state) => {
    return state?.searchlayers || {};
  });

  useEffect(() => {
    if (!mainMap) return;
  
    createLayer(layer, layer_id, mainMap, component_cfg.style);
    //changeMapLoaded(true)
  }, [mainMap]);

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


  const getBlockFullHeight = () => {

    const oDiv = ref.current;
    
    let clientHeight = 0;
    let height = 0;
    
    try {
      clientHeight = oDiv.clientHeight;
    
      const sOriginalOverflow = oDiv.style.overflow;
      const sOriginalHeight = oDiv.style.height;
      oDiv.style.overflow = "";
      oDiv.style.height = "";

      height = oDiv.offsetHeight;
      oDiv.style.height = sOriginalHeight;
      oDiv.style.overflow = sOriginalOverflow;
    } catch {}
        
    return clientHeight > height ? clientHeight : height;
  }

  // Render content
  function renderContent() {
    return (     
      <div className="search-layers">
        <SearchLayers
          core={core}
          config={config}
          layer={layer}
          layers={layers}
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
    <div ref={ref} className="p-blockui-container" style={{height: 'calc(100%)'}}>
      <Panel header={header}>
        { renderContent() }
      </Panel>
      { blockedPanel && <div className="p-blockui p-component-overlay p-component-overlay-enter" style={{zIndex: 1003, height: getBlockFullHeight()}}>
        <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="8" fill="#EEEEEE" animationDuration=".5s"/>
      </div> }
    </div>
  )

  return null
}