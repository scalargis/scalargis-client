import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation} from "react-i18next";
import Cookies from 'universal-cookie';
import { DataView, DataViewLayoutOptions } from 'primereact/dataview';
import { transform } from 'ol/proj'
import { Button } from 'primereact/button'
import {SplitButton} from 'primereact/splitbutton';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { InputMask } from 'primereact/inputmask';
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton } from 'primereact/radiobutton';
import OlFeature from 'ol/Feature';
import OlPoint from 'ol/geom/Point'
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import * as OlProj from 'ol/proj';
import { v4 as uuidV4 } from 'uuid';

import { MAPCONTROL_NAME } from './utils'
import './style.css'

export default function Coordinates({ core, config, actions, dispatch, record }) {

  const { viewer, mainMap, Models } = config; 
  const { selected_menu } = viewer.config_json;
  const { exclusive_mapcontrol } = viewer;
  const { getProjectionSrid } = Models.MapModel;  
  const { coordinates }  = viewer;

  const { t } = useTranslation();

  const [listCRS, setListCRS] = useState([]);
  const [CRS, setCRS] = useState(null);
  const [coordX, setCoordX] = useState(null);
  const [coordY, setCoordY] = useState(null);
  const [units, setUnits] = useState('m');
  const [showDegrees, setShowDegrees] = useState(false);
  const [optLatitude, setOptLatitude] = useState('N');
  const [optLongitude, setOptLongitude] = useState('W');
  const [coordLon, setCoordLon] = useState(null);
  const [coordLat, setCoordLat] = useState(null);
  const [newCoord, setNewCoord] = useState(null);

  const userRoles = useMemo(()=>{
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
  
    let user_roles = [];
    if (logged && logged.userroles && logged.userroles.length) {
      user_roles = [...logged.userroles];
    }
    return user_roles;
  }, []);

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== MAPCONTROL_NAME;


  const buildSaveBtnItems = data => {
    const btns = [
      {
          label: 'CSV',
          icon: 'pi pi-align-justify',
          data: data,
          command: (e) => {
            exportItem(e.item.data, 'csv');
          }
      },
      {
          label: 'GeoJSON',
          icon: 'pi pi-globe',
          data: data,
          command: (e) => {
            exportItem(e.item.data, 'geojson');
          }
      }
    ]

    return btns;
  }

  const serializeCoordinatesGeoJSON = (list) => {
    const features = [];

    const component_cfg = record ? record.config_json : null;

    let crs = null;
    if (component_cfg && component_cfg.export_crs) {
      crs = component_cfg.export_crs;
    } else if (viewer.config_json && viewer.config_json.export_crs) {
      crs = viewer.config_json.export_crs;    
    } else if (viewer.config_json && viewer.config_json.display_crs) {
      crs = viewer.config_json.display_crs;
    } else {
      crs = 4326;
    }

    const parser = new OlFormatGeoJSON();
    const parseOptions = {
      dataProjection: 'EPSG:' + crs,
      featureProjection: mainMap.getView().getProjection().getCode()
    };

    if (list.length && list[0]?.results['EPSG:' + crs]?.precision) {
      parseOptions["decimals"] = String(list[0].results['EPSG:' + crs].precision).length - 1;
    }

    list.forEach(item => {
      const rec =  new OlFeature({
        geometry: new OlPoint(item.coordinates)
      });

      Object.entries(item.results).map(([key, elem]) => {
        let found = true;            
        if (listCRS && listCRS.length) {
          const ss = listCRS.find(c => c.value == key);
          if (!ss) {
            found = false;
          } 
        }
        if (found) {
          const field_prefix = (key || '').replace(':','');

          let x = elem.coordinates[0];
          let y = elem.coordinates[1];

          //Set output precision
          if (elem?.precision) {
            const precision = elem.precision;
            x = (Math.round(x * precision)  / precision);
            y = (Math.round(y * precision)  / precision)
          }

          rec.set(field_prefix + '_x', x);
          rec.set(field_prefix + '_y', y);
        }
      });

      features.push(rec);
    });

    //const geojson = parser.writeFeatures(features, parseOptions);
    const geojson = parser.writeFeaturesObject(features, parseOptions);

    // Hack: OL does not serialize with CRS attribute
    //json.crs = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4326" } }
    const crsinfo = {
      "type": "name",
      "properties": {
          "name": "urn:ogc:def:crs:EPSG::" + crs
      }
    };
    geojson.crs = crsinfo;    
    const data = JSON.stringify(geojson);

    return data;
  }

  const serializeCoordinatesCSV = (list) => {

    if (list == null || !list.length) {
      return null;
    }    
    
    const col_dlm = ';';
    const ln_dlm = '\n';

    const keys  = [];
    let csv = '';
    
    //Build field names
    const fields = [];
    Object.entries(list[0].results).map(([key, elem]) => {
      let found = true;
      if (listCRS && listCRS.length) {
        const ss = listCRS.find(c => c.value == key);
        if (!ss) {
          found = false;
        } 
      }
      if (found) {
        keys.push(key);      
        const field_prefix = (key || '').replace(':','');      
        fields.push((field_prefix + '_x').replace(':',''));
        fields.push((field_prefix + '_y').replace(':',''));
      }
    });
    csv = fields.join(col_dlm);
    csv += ln_dlm;

    //Build values
    const rows = [];
    list.forEach(item => {
      let values = [];     
      keys.forEach(key => {
        let found = true;            
        if (listCRS && listCRS.length) {
          const ss = listCRS.find(c => c.value == key);
          if (!ss) {
            found = false;
          } 
        }
        if (found) {
          let x = item.results[key].coordinates[0];
          let y = item.results[key].coordinates[1];
          //Set output precision
          if (item.results[key]?.precision) {
            const precision = item.results[key]?.precision;
            x = (Math.round(x * precision)  / precision);
            y = (Math.round(y * precision)  / precision)
          }
          values.push(x);
          values.push(y);
        }
      });
      rows.push(values.join(col_dlm));
    });
    csv += rows.join(ln_dlm);

    return csv;
  }  

  function transformCoordinates () {
    let x;
    let y;

    if (units === 'dms') {
      if (!coordLon || !coordLat) return;

      x = convertDMS2DD(optLongitude + ' ' + coordLon);
      y = convertDMS2DD(optLatitude + ' ' + coordLat);
      setCoordX(x);
      setCoordY(y);
    } else {
      x = coordX;
      y = coordY;
    }

    if (!(CRS && (x != null) || (x != null))) return;

    const trans_coords = {};

    const new_coords = transform([parseFloat(x), parseFloat(y)], CRS, mainMap.getView().getProjection());

    viewer.config_json.crs_list.forEach(crs => {
      const coords = transform(new_coords,  mainMap.getView().getProjection(), crs.code);

      //Set precision for user role
      let precision = crs.precision;
      if (crs.precision_roles?.length && userRoles?.length) {
        const rp = crs.precision_roles.find(elem => (elem?.roles || []).some(item => userRoles.includes(item)));
        if (rp?.precision) {
          precision = rp?.precision;
        }
      }

      trans_coords[crs.code] = { code: crs.code, title: crs.title, description: crs.description, 
        srid: crs.srid, precision: precision, coordinates: coords }
    }); 

    let item = { id: uuidV4(), coordinates: new_coords, crs: mainMap.getView().getProjection().getCode(), results: trans_coords };
    setNewCoord(item);
    zoomItem(item);
  }

  function transformCoordinatesByApi() {

    let x;
    let y;

    if (units === 'dms') {
      if (!coordLon || !coordLat) return;

      x = convertDMS2DD(optLongitude + ' ' + coordLon);
      y = convertDMS2DD(optLatitude + ' ' + coordLat);
      setCoordX(x);
      setCoordY(y);
    } else {
      x = coordX;
      y = coordY;
    }

    if (!(CRS && (x != null) || (x != null))) return;

    const url = core.API_URL + '/app/utils/transcoord';

    let options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'        
      },
      method: 'POST',
      body: JSON.stringify({ x: x, y: y, srid: getProjectionSrid(CRS)})
    }

    fetch(url, options).then(res => {
        return res.json();
    }).then(result => {
        if (result.results) {
          const trans_coords = {};
          viewer.config_json.crs_list.forEach(crs => {
            let coords = [];
            if (result.results[crs.code]) {
              coords = [result.results[crs.code].x, result.results[crs.code].y];

              //Set precision for user role
              let precision = crs.precision;
              if (crs.precision_roles?.length && userRoles?.length) {
                const rp = crs.precision_roles.find(elem => (elem?.roles || []).some(item => userRoles.includes(item)));
                if (rp?.precision) {
                  precision = rp?.precision;
                }
              }

              trans_coords[crs.code] = { code: crs.code, title: crs.title, description: crs.description, 
                srid: crs.srid, precision: precision, coordinates: coords }
            }
          });          
          const new_coords = trans_coords[mainMap.getView().getProjection().getCode()].coordinates;    
          const item = { id: uuidV4(), coordinates: new_coords, crs: mainMap.getView().getProjection().getCode(), results: trans_coords };
          setNewCoord(item);
          zoomItem(item);
        }
    })
    .catch(error => {
        console.log('error', error);
    })
  }   
  
	function convertDMS2DD (dms) {
    var val = null;

    var parts = dms.replace("º", "").replace("''","").replace("'","").split(" ");

    parts[1] = parseInt(parts[1]);
    parts[2] = parseInt(parts[2]);
    parts[3] = parseFloat(parts[3]);

    val = parts[1] + parts[2]/60 + parts[3]/3600;
    if (parts[0] == 'W' || parts[0] == 'O' || parts[0] == 'S') {
        val = val * -1;
    }
    return val;
  }

  function convertDD2DMS (deg, is_lon) {
      var val = null;

      var d = Math.floor(Math.abs(deg));
      var minfloat = (Math.abs(deg)-d)*60;
      var m = Math.floor(minfloat);
      var secfloat = (minfloat-m)*60;
      var s = parseFloat(Math.round(secfloat * 100) / 100).toFixed(2);

      if (is_lon) {
          val = ("000" + Math.abs(d)).slice(-3) + "º " + ("00" + m).slice(-2) + "' " + ("0000" + s).slice(-5) + "''";
      } else {
          val = ("00" + Math.abs(d)).slice(-2) + "º " + ("00" + m).slice(-2) + "' " + ("0000" + s).slice(-5) + "''";
      }

      return  val;
  }  
  
  function download(filename, text, format) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename + '.' + format);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  // Remove all items
  function removeAll() {
    dispatch(actions.viewer_set_coordinates([]));
  }

  // Zoom to coordinates
  function zoomItem(item) {
    if (item && item.coordinates) {
      const coords = transform(item.coordinates, item.crs || mainMap.getView().getProjection(), mainMap.getView().getProjection());
      const extent = [coords[0] - 500, coords[1] - 500, 
                      coords[0] + 500, coords[1] + 500];

      const srid = getProjectionSrid(mainMap.getView().getProjection()); 
      dispatch(actions.map_set_extent(coords, extent));
    }
  }

  // Export item
  function exportItem(data, format='geojson') {
    let text = '';
    switch (format) {
      case 'csv':
        text = serializeCoordinatesCSV([data], format);
        break;
      case 'geojson':
        text = serializeCoordinatesGeoJSON([data], format);
        break;
      default:
        text = serializeCoordinatesGeoJSON([data], format);
    }
    download('coordenadas', text, format);
  }

  // Export all results
  function exportAll(format='geojson') {
    let text = '';
    switch (format) {
      case 'csv':
        text = serializeCoordinatesCSV(coordinates, format);
        break;
      case 'geojson':
        text = serializeCoordinatesGeoJSON(coordinates, format);
        break;
      default:
        text = serializeCoordinatesGeoJSON(coordinates, 'geojson');
    }    
    download('coordenadas', text, format);
  }  

  // Remove one item
  function removeItem(item) {
    let index = coordinates.findIndex(c => c.id === item.id);
    if (index === -1) return;
    let updated = [...coordinates];
    updated.splice(index, 1);
    dispatch(actions.viewer_set_coordinates(updated));
  }   

  function renderCoordinatesItem(data) {
    return (data ? (
      <div className="p-col-12 coordinates-item">
        <div className="coordinates-item-tools p-text-right">
          <Button
            title={t("zoomToElement", "Aproximar ao elemento")}
            icon="pi pi-search"
            onClick={e => zoomItem(data)}
          />
          <SplitButton label="" icon="pi pi-download" model={buildSaveBtnItems(data)} />
          <Button
            title={t("removeElement","Remover elemento")}
            icon="pi pi-times"
            onClick={e => removeItem(data)}
          />
        </div>              
        <table>
          { Object.entries(data.results).map(([key, item]) => {
            let found = true;            
            if (listCRS && listCRS.length) {
              const ss = listCRS.find(c => c.value == key);
              if (!ss) {
                found = false;
              } 
            }

            if (found) {
              let crs_units = 'm';
              const prj = OlProj.get(item.code);
              if (prj) {
                crs_units = prj.getUnits();
              }

              return <React.Fragment>
                <tr>
                  <td colspan="2" className="coordinates-item-title">{item.title} ({item.code})</td>
                </tr>          
                <tr>
                  <td>{crs_units === 'degrees'? 'lon (dd): ' : (crs_units ? 'x (' +  crs_units + '): ': 'x: ')}<span>{(Math.round(item.coordinates[0] * item.precision)  / item.precision)}</span></td>
                  <td>{crs_units === 'degrees'? 'lat (dd): ' : (crs_units ? 'y (' +  crs_units + '): ': 'y: ')}<span>{(Math.round(item.coordinates[1] * item.precision)  / item.precision)}</span></td>
                </tr>
                {crs_units === 'degrees' && 
                <tr>
                  <td>lon: <span>{convertDD2DMS(item.coordinates[0], true)}  {item.coordinates[0] < 0 ? 'W': 'E'}</span></td>
                  <td>lat: <span>{convertDD2DMS(item.coordinates[1], false)}  {item.coordinates[1] < 0 ? 'S': 'N'}</span></td>
                </tr>}
              </React.Fragment>
            } else {
              return null;
            }
          }) }
        </table>
      </div> ) : null
    );
  }

  function itemTemplate(item, layout) {
    if (layout === 'list')
      return item && renderCoordinatesItem(item);
    else if (layout === 'grid')
      return null;
  }  

  useEffect(()=>{
    let list = viewer.config_json.crs_list.map( item => ({ label: (item.title + ' (' + item.code + ')'),
      value: item.code}));

    if (record && record.config_json && record.config_json.crs_list && record.config_json.crs_list.length) {
      list = (viewer.config_json.crs_list || []).filter( c => {
        return record.config_json.crs_list.includes(c.srid);
      }).map( item => ({ label: (item.title + ' (' + item.code + ')'), value: item.code}));
    }

    setListCRS(list);

    if (record.config_json.selected_crs) {
      let selectedCRS;
      
      if (Number.isInteger(record.config_json.selected_crs)) {
        selectedCRS = viewer.config_json.crs_list.find( item => item.srid ==  record.config_json.selected_crs);
      } else {
        selectedCRS = viewer.config_json.crs_list.find( item => item.code ==  record.config_json.selected_crs);
      }

      if (selectedCRS) {
        if (list.find( item => item.value == selectedCRS.code)) {
          setCRS(selectedCRS.code);
        }
      }

    }
  }, []);

  useEffect(() => {      
    if (newCoord) dispatch(actions.viewer_set_coordinates([newCoord, ...coordinates]));
  }, [newCoord]);   

  useEffect(() => {
    let isDegrees = false;
    if (CRS) {
      const prj = OlProj.get(CRS);
      if (prj) {
        const units = prj.getUnits();
        if (units === 'degrees') isDegrees = true;
      }
    }
    if (isDegrees) {
      setCoordX(null);
      setCoordY(null);
      setCoordLat(null);
      setCoordLon(null);
    }    
    setShowDegrees(isDegrees);
    setUnits(isDegrees ? 'dd' : 'm');
  }, [CRS]);

  useEffect(() => {

    if (!showDegrees) return;

    if (units==='dd' && coordLon && coordLat) {
      const x = convertDMS2DD(optLongitude + ' ' + coordLon);
      const y = convertDMS2DD(optLatitude + ' ' + coordLat);
      setCoordX(x);
      setCoordY(y);
    } else if (units==='dms' && coordX && coordY) {
      const lon = convertDD2DMS(Math.abs(coordX), true);
      const lat = convertDD2DMS(Math.abs(coordY), false);
      setCoordLon(lon);
      setOptLongitude(coordX < 0 ? 'W': 'E');
      setCoordLat(lat);
      setOptLatitude(coordY < 0 ? 'S': 'N');      
    }
  }, [units]);

  useEffect(() => {
    if (coordinates && coordinates.length > 0) dispatch(actions.viewer_set_selectedmenu('coordinates'));
  }, [coordinates]);


  let msg = t("searchByCoordinateInfo", "Clique no mapa para obter as coordenadas ou indique os seus valores através seguinte formulário.");
  if (isInactive) msg = t("searchByCoordinateNotActive", "Clique no botão do menu principal para ativar a ferramenta e depois clique no mapa para obter as coordenadas. Poderá também indicar os valores das coordenadas através do formulário.");

  return (
    <div>

      { (isInactive || !coordinates?.length) ?
        <div className="p-mt-2 p-mb-3">
          <Message
            severity="info"
            text={msg}
          />
        </div> : null }

      {(showDegrees &&
      <React.Fragment>
        <div className="p-fluid p-formgrid p-grid p-mt-2">
          <div className="p-field p-col-12">
            <label htmlFor="coordsys">{t("coordinateSystem", "Sistema de Coordenadas")}</label>
            <Dropdown options={listCRS} value={CRS} onChange={(e) => setCRS(e.value)} placeholder={t("selectCRS", "Selecione um CRS")}/>
          </div>
          <div className="p-field p-col-12">
            <div className="p-formgroup-inline flex-no-wrap">
                <div className="p-field-checkbox">
                    <RadioButton value="dd" onChange={(e) => setUnits(e.value)} checked={units === 'dd'}  />
                    <label>{t("decimalDegrees", "Graus decimais")}</label>
                </div>
                <div className="p-field-checkbox">
                    <RadioButton value="dms" onChange={(e) => setUnits(e.value)} checked={units === 'dms'}  />
                    <label>{`${t("degrees", "Graus")} / ${t("minutes", "Minutos")} / ${t("seconds", "Segundos")}`}</label>
                </div>
            </div>
          </div>
          <div className="p-field p-col-12">
          { units === 'dd' &&
            <div className="p-fluid p-formgrid p-grid">
              <div className="p-field p-col">
                <label>{t("longitude", "Longitude")}</label>
                <InputNumber value={coordX} onValueChange={(e) => setCoordX(e.value)} mode="decimal" minFractionDigits={1} maxFractionDigits={8} className="p-inputtext-sm" />
              </div>
              <div className="p-field p-col">
                <label>{t("latitude", "Latitude")}</label>
                <InputNumber value={coordY} onValueChange={(e) => setCoordY(e.value)} mode="decimal" minFractionDigits={1} maxFractionDigits={8} className="p-inputtext-sm" />
              </div>
            </div>          
          }
          { units === 'dms' &&
            <div className="p-fluid p-formgrid p-grid">
              <div className="p-field p-col">
                <label>{t("longitude", "Longitude")}</label>
                <div className="p-inputgroup">
                  <select value={optLongitude} onChange={e => setOptLongitude(e.target.value)}>
                    <option value="E">E</option>
                    <option value="W">W</option>
                  </select>
                  <InputMask mask="999º 99' 99?.99''" value={coordLon} onChange={(e) => setCoordLon(e.value)} />
                </div>
              </div>
              <div className="p-field p-col">
                <label>{t("latitude", "Latitude")}</label>
                <div className="p-inputgroup">
                <select value={optLatitude} onChange={e => setOptLatitude(e.target.value)}>
                    <option value="N">N</option>
                    <option value="S">S</option>
                  </select>
                  <InputMask mask="99º 99' 99?.99''" value={coordLat} onChange={(e) => setCoordLat(e.value)} />
                </div>
              </div>
            </div>
          }
          </div>
        </div>
      </React.Fragment>      
      )}
      {(!showDegrees &&
      <React.Fragment>
        <div className="p-fluid p-formgrid p-grid p-mt-2">
            <div className="p-field p-col-12">
              <label htmlFor="coordsys">{t("coordinateSystem", "Sistema de Coordenadas")}</label>
              <Dropdown options={listCRS} value={CRS} onChange={(e) => setCRS(e.value)} placeholder={t("selectCRS", "Selecione um CRS")}/>
            </div>
            <div className="p-field p-col">
                <label htmlFor="coordX">X</label>
                <InputNumber id="coordX" value={coordX} onValueChange={(e) => setCoordX(e.value)} mode="decimal" minFractionDigits={1} maxFractionDigits={8} className="p-inputtext-sm" />
            </div>
            <div className="p-field p-col">
                <label htmlFor="coordY">Y</label>              
                <InputNumber id="coordY" value={coordY} onValueChange={(e) => setCoordY(e.value)} mode="decimal" minFractionDigits={1} maxFractionDigits={8} className="p-inputtext-sm" />
            </div>
        </div>      
      </React.Fragment>)}
      <div className="card p-text-center">
        <Button
            label={t("locate","Localizar")}
            icon="pi pi-search"
            className="p-button-md"
            onClick={e => { transformCoordinatesByApi(); }}
        />
        </div>           

      { ( coordinates && coordinates.length && coordinates.length > 0 ? 
        <React.Fragment>
          <hr className="rounded" />

          <div style={ {padding: "1rem 0", textAlign: "right"} }>
            <Button
              title={t("clearResults", "Limpar resultados")}
              label={t("clear", "Limpar")}
              icon="pi pi-times"
              className="p-button-outlined p-button-sm"
              onClick={e => removeAll()}
            />
            <Button
              title={t("exportResults", "Exportar resultados")}
              label="CSV"
              icon="pi pi-download"
              className="p-button-outlined p-button-sm p-ml-2"
              onClick={e => exportAll('csv')}
            />
            <Button
              title={t("exportResults", "Exportar resultados")}
              label="GeoJSON"
              icon="pi pi-download"
              className="p-button-outlined p-button-sm p-ml-2"
              onClick={e => exportAll('geojson')}
            />                       
          </div>         

          { renderCoordinatesItem(coordinates[0]) }
        </React.Fragment> : null 
      ) }

      { ( coordinates.length > 1 ?
        <React.Fragment><h4>{t("previousResults", "Resultados anteriores")}</h4>
          <DataView value={coordinates.slice(1)} layout="list"
            itemTemplate={itemTemplate} paginator alwaysShowPaginator={false} pageLinkSize={2} rows={9} style={{fontSize: ".8rem"}} />
        </React.Fragment> : null)
      }    

    </div>
  )

}