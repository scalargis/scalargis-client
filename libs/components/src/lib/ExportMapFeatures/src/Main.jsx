import React, { useEffect, useMemo, useRef, useState } from 'react'
import GeoJSON from 'ol/format/GeoJSON'
import { Button, Switch } from '@mantine/core'
import { Feature } from 'ol'
import Point from 'ol/geom/Point'
import OLGroupLayer from "ol/layer/Group"
import Select from 'ol/interaction/Select'
import VectorSource from "ol/source/Vector"
import './index.css'

export function traverseOlLayers(collection, cb) {
  collection.forEach(l => {
    cb(l);
    if (l instanceof OLGroupLayer) traverseOlLayers(l.getLayers(), cb);
  })
}

export default function Main({ config }) {

  //console.log('ExportMapFeatures', config);
  const { layer, actions, dispatch, mainMap } = config;

  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState({ items: [], coord: null });

  // Resolve the OL layer in render (was a module-scope `let` set only in an
  // effect, so the first render always hit the null gate and never re-rendered,
  // and instances shared the same global). Per-instance select lives in a ref.
  const selectSingleClick = useRef();

  function findOlLayer(id) {
    let found;
    traverseOlLayers(mainMap.getLayers(), l => {
      if (l.get('id') === id) found = l;
    });
    return found;
  }

  const olLayer = useMemo(() => findOlLayer(layer.id), [mainMap, layer.id]);

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

  useEffect(() => {
    if (!olLayer) return;
    const select = new Select({
      layers: [olLayer]
    });
    select.on('select', e => {
      if (e.selected.length) setSelected({ items: e.selected, coord: e.mapBrowserEvent.coordinate });
    })
    mainMap.addInteraction(select);
    selectSingleClick.current = select;
    return () => {
      mainMap.removeInteraction(select);
      selectSingleClick.current = undefined;
    }
  }, [olLayer, mainMap]);

  useEffect(() => {
    if (selectSingleClick.current) selectSingleClick.current.setActive(active);
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
              <Switch size="md" checked={active} onChange={(e) => setActive(!active)} />
            </th>
          </tr>
          
        </thead>
        <tbody>
          
          { !!selected.coord && selected.coord.length && (
          <tr>
            <td>Ponto</td>
            <td>
              <Button type="button" size="xs" onClick={exportCoord} leftSection={<i className="pi pi-arrow-circle-down" aria-hidden="true" />}>Exportar</Button>
            </td>
          </tr>
          ) }

          { selected.items.map((feat, i) => (
          <tr key={i}>
            <td>Geometria</td>
            <td>
              <Button type="button" size="xs" onClick={exportSelected} leftSection={<i className="pi pi-arrow-circle-down" aria-hidden="true" />}>Exportar</Button>
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