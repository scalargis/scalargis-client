import React, { useEffect, useState } from 'react'
import GeoJSON from 'ol/format/GeoJSON'
import { Button } from 'primereact/button'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import OLGroupLayer from "ol/layer/Group"
import Select from 'ol/interaction/Select'
import {InputSwitch} from 'primereact/inputswitch'
import VectorSource from "ol/source/Vector"
import './index.css'

export function traverseOlLayers(collection, cb) {
  collection.forEach(l => {
    cb(l);
    if (l instanceof OLGroupLayer) traverseOlLayers(l.getLayers(), cb);
  })
}

let selectSingleClick;
let olLayer;

export default function Main({ config }) {

  //console.log('ExportMapFeatures', config);
  const { layer, actions, dispatch, mainMap } = config;

  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState({ items: [], coord: null });

  function exportSelected() {
    const format = new GeoJSON();
    const text = format.writeFeatures(selected.items);
    //console.log(text);
    download('selecao.geojson', text);
  }

  function exportCoord() {
    const feat = new Feature({
      name: 'Coordenada',
      geometry: new Point(selected.coord)
    });
    const format = new GeoJSON();
    const text = format.writeFeatures([feat]);
    download('coordenada.geojson', text);
  }

  function findOlLayer(id) {
    let layer;
    traverseOlLayers(mainMap.getLayers(), l => {
      if (l.get('id') === id) layer = l;
    });
    return layer;
  }

  useEffect(() => {
    olLayer = findOlLayer(layer.id);
    selectSingleClick = new Select({
      layers: [olLayer]
    });
    selectSingleClick.on('select', e => {
      if (e.selected.length) setSelected({ items: e.selected, coord: e.mapBrowserEvent.coordinate });
    })
    mainMap.addInteraction(selectSingleClick);
    return () => {
      mainMap.removeInteraction(selectSingleClick)
    }
  }, []);

  useEffect(() => {
    selectSingleClick.setActive(active);
  }, [active]);

  // Filter by layer type
  if (!olLayer) return null;
  //console.log('type', olLayer.getSource() instanceof VectorSource);
  if (!(olLayer.getSource() instanceof VectorSource)) return null;

  return (
    <div className="export-map-features">

      <table>
        <thead>
          <tr>
            <th>Selecionar Elementos</th>
            <th>
              <InputSwitch checked={active} onChange={(e) => setActive(!active)} />
            </th>
          </tr>
          
        </thead>
        <tbody>
          
          { !!selected.coord && selected.coord.length && (
          <tr>
            <td>Ponto</td>
            <td>
              <Button className="p-button-sm" onClick={exportCoord} label="Exportar" icon="pi pi-arrow-circle-down" />
            </td>
          </tr>
          ) }

          { selected.items.map((feat, i) => (
          <tr>
            <td>Geometria</td>
            <td>
              <Button className="p-button-sm" onClick={exportSelected} label="Exportar" icon="pi pi-arrow-circle-down" />
            </td>
          </tr>
          )) }

        </tbody>
      </table>
    </div>
  )
}

function download(filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}