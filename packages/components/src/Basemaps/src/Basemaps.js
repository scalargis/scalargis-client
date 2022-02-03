import { Button } from 'primereact/button'
import { Card } from 'primereact/card';
import React, { useEffect, useState } from 'react'
import BasemapItem from './BasemapItem'
import './style.css'

export default function Basemaps({ viewer, mainMap, config, actions, record, layers, selectedLayer }) {
    
  const dispatch = config.dispatch;

  const [autoClose, setAutoClose] = useState(record.config_json && record.config_json.auto_close)
  const [opened, setOpened] = useState(false);

  const layersIds = layers.map(l => l.id);

  function selectLayer (layer) {
    let checked = viewer.config_json.checked.filter(c => { return !layersIds.includes(c); });
    if (layer) {
      checked.push(layer);
    }
    if (layer && autoClose) {
      setOpened(false);
    }
    dispatch(actions.layers_set_checked(checked));
  }

  return (
    record.target == 'mainmenu' ? 
    <div className="basemaps-menu">
          { layers.map((item, i) => <BasemapItem key={item.id}  viewer={viewer} mainMap={mainMap} layer={item} 
            selected={selectedLayer && selectedLayer===item.id} setSelected={selectLayer}  />) }
    </div> :
    <div className="basemaps map-controls">
      <Button 
        icon="pi pi-image"
        className={opened ? "p-button-rounded p-button-raised active" : "p-button-rounded p-button-raised" } 
        onClick={(e) => { e.currentTarget.blur(); setOpened(!opened) } } 
      />
      { opened &&
      <div className="basemaps-control">
        <div className="p-d-inline-flex p-flex-row p-flex-wrap">
          { layers.map((item, i) => <BasemapItem key={item.id}  viewer={viewer} mainMap={mainMap} layer={item} 
            selected={selectedLayer && selectedLayer===item.id} setSelected={selectLayer}  />) }
        </div>      
      </div>
      }
    </div>
  )
}