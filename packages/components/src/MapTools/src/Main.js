import React, { useEffect, useState, useRef } from 'react'
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import componentActions from './actions';
import MapTools from './MapTools'


const maptoolsReducer = (state = {}, action) => {
  switch (action.type) {
    case 'MAPTOOLS_SET_SELECTEDCONTROL':
      return { 
        ...state, 
        selected_control: action.selected_control
      }
    default:
      return state
  }
}


/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const component_cfg = record.config_json || {};
  const title = record.title || 'Ferramentas de Medição';

  return (
    <Button
      title={title}
      className={className}
      icon="fas fa-ruler"
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}

//export default function Main({ type, region, as, config, actions, record, utils }) {
  export default function Main(props) {

  const { type, region, as, config, actions, record, utils } = props;

  const core = props.core;
  const component_store_state = core.store.getState().maptools;

  const { dispatch, viewer, mainMap } = config;
  const { selected_menu, layers } = viewer.config_json;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Ferramentas de Medição';
  const header = component_cfg.header || title;

  useEffect(() => {
    Object.entries(componentActions).forEach(([key, action]) => {
      if (!props.core.actions[key]) {
        props.core.actions[key] = action;
      }
    });
    if (!('maptools' in props.core.store.reducerManager.getReducerMap())) {
      props.core.store.reducerManager.add('maptools', maptoolsReducer);
    }
  }, []);

  useEffect(() => {
    if (selected_menu === 'maptools') {
      dispatch(actions.viewer_set_exclusive_mapcontrol('MapTools'));
    } else {
      dispatch(actions.maptools_set_selectedcontrol(null));
    }
  }, [selected_menu]);

  function renderContent() {
    return (
      <div className="maptools">
        <MapTools
          onControlSelect={(control)=> {
            dispatch(actions.maptools_set_selectedcontrol(control));
          }}
          viewer={viewer}
          core={core}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          utils={utils}
          record={record}
          selected_control={component_store_state?.selected_control}
        />
      </div>  
    )  
  }

  if (type === 'link' && region === record.links) {

    const classname = (viewer?.exclusive_mapcontrol === 'MapTools' && 
      component_store_state?.selected_control) ? 'active' : '';

    return <Button
      title={title}
      icon="fas fa-ruler"
      className={ classname ? "p-button-rounded p-button-raised " + classname : "p-button-rounded p-button-raised" }
      onClick={e => {
        if (selected_menu === 'maptools') {
          dispatch(actions.maptools_set_selectedcontrol(null));
          dispatch(actions.layout_show_menu(true));
        } else {
          dispatch(actions.viewer_set_selectedmenu(record.id));
          dispatch(actions.layout_show_menu(true));
        }
      }}
    />
  }  

  if (as === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  //// Render component
  //return renderContent()

  return null;
}
