import React, { useState, useEffect } from 'react'
import { transform } from 'ol/proj'
import { Button } from 'primereact/button'
import { InputSwitch } from 'primereact/inputswitch'
import { ToggleButton } from 'primereact/togglebutton';
import {Checkbox} from 'primereact/checkbox';
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import { Message } from 'primereact/message'

export default function GeoLocation({ config, actions, dispatch, record }) {

  const { viewer, mainMap, Models } = config;
  const { getProjectionSrid } = Models.MapModel;
  const { geolocation }  = viewer;

  const component_cfg = record.config_json;

  const geo_location_control = viewer.config_json.map_controls.find(c => c.id === 'GeoLocation');
  const geoLocationActive = geo_location_control ? geo_location_control.active : false;
  const geoLocationTracking = geo_location_control ? geo_location_control.tracking : false;
  const { viewer_update_mapcontrol, viewer_set_selectedmenu, map_set_extent, viewer_set_exclusive_mapcontrol } = actions;

  const [results, setResults] = useState([]);

  function getErrorMessage(error, messages) {
    let message = error.message;

    switch(error.code) {
      case 1:
        //The acquisition of the geolocation information failed because the page did not have the permission to do it.
        message = 'Não foi autorizada a obtenção da localização.';
        break;
      case 2:
        //The acquisition of the geolocation failed because one or several internal sources of position returned an internal error.
        message = 'Ocorreu um erro interno ao obter-se a localização.';
        break;
      case 3:
        //The time allowed to acquire the geolocation, defined by PositionOptions.timeout information that was reached before the information was obtained.
        message = 'Ocorreu um timeout antes de ter sido possível obter a localização.';
        break;
      default:
        message = messages?.error?.text ? messages.error.text : 'Não foi possível obter a localização.';
    }

    if (error.code && messages && messages['error' + error.code] && messages['error' + error.code].text) {
      message = messages['error' + error.code].text;
    }

    return message;
  }

  function buildResultsTable() {
    const results = [];

    const precision = 10000;

    if (geolocation && geolocation.coordinates) {
      results.push({ field: 'Longitude (dd)', value: (Math.round(geolocation.coordinates[0] * precision) / precision) });
      results.push({ field: 'Latitude (dd)', value: (Math.round(geolocation.coordinates[1] * precision) / precision) });

      if (viewer.config_json.display_crs && viewer.config_json.display_crs != 4326) {
        const display_coords = transform(geolocation.coordinates, 'EPSG:4326', 'EPSG:' + viewer.config_json.display_crs);
        results.push({ field: 'X [EPSG:' + viewer.config_json.display_crs + ']', value: (Math.round(display_coords[0] * 100) / 100) });
        results.push({ field: 'Y [EPSG:' + viewer.config_json.display_crs + ']', value: (Math.round(display_coords[1] * 100) / 100) });
      }

      geolocation.accuracy && results.push({ field: 'Precisão', value: ((Math.round(geolocation.accuracy * 100) / 100) + ' m')});
      geolocation.altitude && results.push({ field: 'Altitude', value: ((Math.round(geolocation.altitude * 100) / 100) + ' m')});
      geolocation.altitudeAccuracy && results.push({ field: 'Precisão da Altitude', value: ((Math.round(geolocation.altitudeAccuracy * 100) /100) + ' m')});
      geolocation.heading && results.push({ field: 'Direção', value: ((Math.round(geolocation.heading * 100) / 100) + ' rad')});
      geolocation.speed && results.push({ field: 'Velocidade', value: ((Math.round(geolocation.speed  * 100) / 100) + ' m/s')});
    }
    setResults(results);
  }

  function toggleGeoLocationControl(val) {
    const active = val;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, active }));
    /*
    const active = !geoLocationActive;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, active }));
    if (active && geo_location_component) dispatch(viewer_set_selectedmenu('geolocation'));
    */
  }

  function trackingGeoLocationControl(val) {
    const tracking = val;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, tracking }));
    /*
    const active = !geoLocationActive;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, active }));
    if (active && geo_location_component) dispatch(viewer_set_selectedmenu('geolocation'));
    */
  }

  function zoomGeoLocation(position) {
    // Zoom to extent        
    if (position && position.coordinates) {
        const coordinates = transform(position.coordinates, 'EPSG:4326', mainMap.getView().getProjection());
        const extent = [coordinates[0] - 500, coordinates[1] - 500, 
                        coordinates[0] + 500, coordinates[1] + 500];
        const srid = getProjectionSrid(mainMap.getView().getProjection()); 
        dispatch(actions.map_set_extent(coordinates, extent, srid));
    }
  }  

  useEffect(()=>{
    buildResultsTable();
  },[viewer.config_json.display_crs]);

  useEffect(()=>{
    buildResultsTable();
  }, [geolocation]);

  if (geolocation && geolocation.error) return (
    <Message
      severity="warn"
      text={getErrorMessage(geolocation.error, component_cfg?.messages)}
    />
  )

  return (
    <div>
      <Message
        severity="info"
        text={component_cfg?.messages?.intro?.text ? component_cfg.messages.intro.text : "Selecione a opção 'Ver Posição' para ativar a visualização da sua posição."}
      />

      <div className="p-mt-3 p-pt-3 p-pr-2 p-pl-2" style={{"border": "1px solid rgb(111 57 57 / 12%)"}}>
        <div className="p-grid">
          <div className="p-col" style={{ textAlign: 'left'}}>
            <InputSwitch
              className="p-mr-1"
              inputId="geolocationSwitch"
              checked={geoLocationActive}
              onChange={(e) => toggleGeoLocationControl(e.value)}
            />
            {' '}
            <label htmlFor="geolocationSwitch">
              <span className="p-text-bold">Ver Posição</span>
            </label>
          </div>
        </div>
        <div className="p-grid p-mt-2">
          <div className="p-col" style={{ textAlign: 'left'}}>
            <div className="p-field-checkbox p-mb-1">
            <Checkbox onChange={e => trackingGeoLocationControl(e.checked)} checked={geoLocationTracking} disabled={!geoLocationActive}></Checkbox>
            <label className={"p-checkbox-label" + (!geoLocationActive ? " p-disabled" : "")}>Atualizar</label>
            </div>
          </div>
          <div className="p-col" style={{ textAlign: 'right'}}>
            <Button
              label="Localizar"
              icon="pi pi-search"
              className="p-button-sm"
              onClick={e => { zoomGeoLocation(geolocation); }}
              disabled={!geoLocationActive}
            />
          </div>        
        </div>
      </div>

      { geolocation &&
      <div className="card p-pt-1">          
          <DataTable value={results}>
            <Column field="field" header=""></Column>
            <Column field="value" header=""></Column>
          </DataTable>          
      </div> }
  </div>
  )

}