import React, { useState } from 'react';
import { Button } from 'primereact/button';
import WMS from './type/WMS';
import WMTS from './type/WMTS';
import WFS from './type/WFS';
import ArcGISMap from './type/ArcGISMap';
import Shapefile from './type/Shapefile';
import GeoJSON from './type/GeoJSON';
import KML from './type/KML';
import GML from './type/GML';
import DXF from './type/DXF';
import Group from './type/Group';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import WMSThemesSelector from './WMSThemesSelector';
import WMTSThemesSelector from './WMTSThemesSelector';
import ThemesSelector from './ThemesSelector';

let toastEl = null;

export default function WizardStepData(props) {

  const { Models, fastFetch } = props;
  let [data, setData] = useState(props.wizardData);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState({});
  const { getWindowSize, showOnPortal } = Models.Utils;
  const winSize = getWindowSize();

  //Set default upload max file size (2MB)
  //Filesize configuration is in KB
  let maxFileSize = 2048;
  if (props.viewer && props.viewer.upload_maxfilesize) {
    maxFileSize = props.viewer.upload_maxfilesize;
  }
  if (props.record && props.record.config_json && props.record.config_json.upload_maxfilesize) {
    maxFileSize = props.record.config_json.upload_maxfilesize;
  }

  function editField(field, value) {
    setData({ ...data, [field]: value });
  }

  function getUrlHistory() {
    const items = props.cookies || [];
    return items;
  }

  function setError(message) {
    toastEl.show({
      severity: 'error',
      summary: 'Ocorreu um erro inesperado',
      detail: message,
      sticky: true
    });
  }

  function saveSelection() {
    const filterSelectedLayerItems = function (items) {
      const selectedItems = items.filter(l => {
        if (l.children) {
          const children = filterSelectedLayerItems(l.children);
          l.children = children;
        }
        return Object.keys(selected).includes(l.id);
      });
      return selectedItems;
    }

    let clone = JSON.parse(JSON.stringify(data.dataitems));
    clone = filterSelectedLayerItems(clone);
    data.items = clone;
     
    props.onSave(data);
  }

  let TypeComponent = null;
  switch(data.type) {
    case 'wms': TypeComponent = WMS; break;
    case 'wmts': TypeComponent = WMTS; break;
    case 'wfs': TypeComponent = WFS; break;
    case 'arcgismap': TypeComponent = ArcGISMap; break;
    case 'shape': TypeComponent = Shapefile; break;
    case 'geojson': TypeComponent = GeoJSON; break;
    case 'kml': TypeComponent = KML; break;
    case 'gml': TypeComponent = GML; break;
    case 'dxf': TypeComponent = DXF; break;
    case 'group': TypeComponent = Group; break;
    default: TypeComponent = null;
  }

  return (
    <div>
      {showOnPortal(<Toast ref={(el) => toastEl = el} />)}
      
      <TypeComponent
        core={props.core}
        auth={props.auth}
        record={props.record}
        Models={props.Models}
        data={data}
        mainMap={props.mainMap}
        viewer={props.viewer}
        loading={props.loading}
        setLoading={props.setLoading}
        setError={setError}
        setData={setData}
        setSelected={setSelected}
        getUrlHistory={getUrlHistory}
        editField={editField}
        winSize={winSize}
        fastFetch={fastFetch}
        maxFileSize={maxFileSize}
      />

      {{wms: <WMSThemesSelector
          core={props.core}
          record={props.record}
          themes={data.dataitems}
          selected={selected}
          filter={filter}
          setSelected={setSelected}
        />,
        wmts: <WMTSThemesSelector
          core={props.core}
          record={props.record}     
          themes={data.dataitems}
          tileMatrixSet={data.wmtsTileMatrixSet || []}
          selected={selected}
          filter={filter}
          setSelected={setSelected}
          data={data}
          setData={setData}
        />
      }[props.wizardData.type] || <ThemesSelector
          core={props.core}
          record={props.record}
          hide={data.type === 'group'}
          themes={data.dataitems}
          selected={selected}
          filter={filter}
          setSelected={setSelected}
        />
      }

      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button 
          onClick={e => saveSelection()} 
          label="Seguinte" 
          disabled={props.loading || (Object.keys(selected).length === 0) || 
            (Object.keys(selected).length === 1 && !selected[Object.keys(selected)[0]].checked) }
          style={{ marginTop: '1em' }}
        />
      </div>
    </div>
  )
}
