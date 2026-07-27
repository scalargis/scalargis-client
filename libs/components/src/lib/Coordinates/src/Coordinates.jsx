import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation} from "react-i18next";
import { v4 as uuidV4 } from 'uuid';
import { DataView } from 'primereact/dataview';
import { transform } from 'ol/proj'
import { Button } from 'primereact/button'
import {SplitButton} from 'primereact/splitbutton';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { InputMask } from 'primereact/inputmask';
import { RadioButton } from 'primereact/radiobutton';
import OlFeature from 'ol/Feature';
import OlPoint from 'ol/geom/Point'
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import * as OlProj from 'ol/proj';

import { MAPCONTROL_NAME } from './utils';

import './style.css';


const positivenumberFieldStrictInput = function(event) {
  const e = event || window.event;  // get event object
  const key = e.keyCode || e.which; // get key cross-browser

  if(key==8 || key==46 || key == 9 || key==17 || key==91 || key==18 ||
          key==116 || key==89 || key==67 || key==88 || key==35 || key==36) //back, delete tab, ctrl, win, alt, f5, paste, copy, cut, home, end
      return true;

  if (key==16) //shift
      return true;

  if (key==86) //ctrl-v
      return true;

  if(key==190 && e.target.value.split(".").length == 1) //point
    return true;

  if(key>=37 && key<=40) //arrows
      return true;

  if(key>=48 && key<=57) // top key
      return true;

  if(key>=96 && key<=105) //num key
      return true;
  
  //console.log('Not allowed key pressed '+key);

  if (e.preventDefault) e.preventDefault(); //normal browsers
      e.returnValue = false; //IE
}


const numberFieldStrictInput = function(event) {
  const e = event || window.event;  // get event object
  const key = e.keyCode || e.which; // get key cross-browser

  if(key==8 || key==46 || key == 9 || key==17 || key==91 || key==18 ||
          key==116 || key==89 || key==67 || key==88 || key==35 || key==36) //back, delete tab, ctrl, win, alt, f5, paste, copy, cut, home, end
      return true;

  if (key==16) //shift
      return true;

  if (key==86) //ctrl-v
      return true;

  if (key==189 || key==173 || key==109) //minus (173 - firefox; 109 - numpad)
      return true;

  if(key==190 && e.target.value.split(".").length == 1) //point
      return true;

  if(key>=37 && key<=40) //arrows
      return true;

  if(key>=48 && key<=57) // top key
      return true;

  if(key>=96 && key<=105) //num key
      return true;

  //console.log('Not allowed key pressed '+key);

  if (e.preventDefault) e.preventDefault(); //normal browsers
      e.returnValue = false; //IE
}

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
  const [newCoord, setNewCoord] = useState(null);

  const userRoles = useMemo(()=>{
    const logged = core.getLoggedUser();
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
      const values = [];     
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

  function transformCoordinatesByApi() {

    let x;
    let y;

    if (!CRS || coordX == null || coordY == null || coordX == "" || coordY == "") return;

    if (['dms', 'dd'].includes(units)) {
      x = parseFloat(coordX);
      y = parseFloat(coordY);

      if (optLongitude == 'W' && x > 0) {
        x = x * -1
      }
      if (optLatitude == 'S' && y > 0) {
        y = y * -1
      }
    } else {
      x = parseFloat(coordX);
      y = parseFloat(coordY);
    }

    const url = core.API_URL + '/app/utils/transcoord';

    const options = {
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
    const parts = dms.replace("º", "").replace("''","").replace("'","").split(" ");

    parts[0] = parseInt(parts[0]);
    parts[1] = parseInt(parts[1]);
    parts[2] = parseFloat(parts[2]);

    const val = parts[0] + parts[1]/60 + parts[2]/3600;

    return val;
  }

  function convertDD2DMS (deg, is_lon) {
      let val = null;

      const d = Math.floor(Math.abs(deg));
      const minfloat = (Math.abs(deg)-d)*60;
      const m = Math.floor(minfloat);
      const secfloat = (minfloat-m)*60;
      const s = parseFloat(Math.round(secfloat * 100) / 100).toFixed(2);

      if (is_lon) {
          val = ("000" + Math.abs(d)).slice(-3) + "º " + ("00" + m).slice(-2) + "' " + ("0000" + s).slice(-5) + "''";
      } else {
          val = ("00" + Math.abs(d)).slice(-2) + "º " + ("00" + m).slice(-2) + "' " + ("0000" + s).slice(-5) + "''";
      }

      return  val;
  }  
  
  function formatCoordValue (value, units, is_lon) {
    if (value == null || value === '') return '';
    if (units === 'dms') {
      return convertDD2DMS(value, is_lon);
    }
    if (units === 'dd') {
      return (Math.abs(value));
    }
    return value;
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
    const index = coordinates.findIndex(c => c.id === item.id);
    if (index === -1) return;
    const updated = [...coordinates];
    updated.splice(index, 1);
    dispatch(actions.viewer_set_coordinates(updated));
  }   

  function renderCoordinatesItem(data) {
    return (data ? (
      <div className="col-12 coordinates-item">
        <div className="coordinates-item-tools text-right">
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
          <tbody>
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

              return <React.Fragment key={key}>
                  <tr>
                    <td colSpan="2" className="coordinates-item-title">{item.title} ({item.code})</td>
                  </tr>          
                  <tr>
                    <td>{crs_units === 'degrees'? 'lon (dd): ' : (crs_units ? 'x (' +  crs_units + '): ': 'x: ')}<span>{(Math.round(item.coordinates[0] * item.precision)  / item.precision)}</span></td>
                    <td>{crs_units === 'degrees'? 'lat (dd): ' : (crs_units ? 'y (' +  crs_units + '): ': 'y: ')}<span>{(Math.round(item.coordinates[1] * item.precision)  / item.precision)}</span></td>
                  </tr>
                  {crs_units === 'degrees' && 
                  <tr>
                    <td>lon: <span>{convertDD2DMS(item.coordinates[0], true)}  {item.coordinates[0] < 0 ? 'W': 'E'}</span></td>
                    <td>lat: <span>{convertDD2DMS(item.coordinates[1], false)}  {item.coordinates[1] < 0 ? 'S': 'N'}</span></td>
                  </tr>
                  }
                </React.Fragment>
            } else {
              return null;
            }
          }) }
          </tbody>
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

    setCoordX(null);
    setCoordY(null);   
    setShowDegrees(isDegrees);
    setUnits(isDegrees ? 'dd' : 'm');
  }, [CRS]);

  useEffect(() => {
    if (coordinates && coordinates.length > 0) dispatch(actions.viewer_set_selectedmenu('coordinates'));
  }, [coordinates]);


  let msg = t("searchByCoordinateInfo", "Clique no mapa para obter as coordenadas ou indique os seus valores através seguinte formulário.");
  if (isInactive) msg = t("searchByCoordinateNotActive", "Clique no botão do menu principal para ativar a ferramenta e depois clique no mapa para obter as coordenadas. Poderá também indicar os valores das coordenadas através do formulário.");

  return (
    <div>

      { (isInactive || !coordinates?.length) ?
        <div className="mt-2 mb-3">
          <Message
            severity="info"
            text={msg}
          />
        </div> : null }

      {(showDegrees &&
      <div className="grid formgrid mt-2">
          <div className="field col-12">
            <label htmlFor="coordsys">{t("coordinateSystem", "Sistema de Coordenadas")}</label>
            <Dropdown options={listCRS} value={CRS} onChange={(e) => setCRS(e.value)} placeholder={t("selectCRS", "Selecione um CRS")} className="w-full"/>
          </div>
          <div className="field col-12">
            <div className="field-checkbox">
                <RadioButton value="dd" onChange={(e) => setUnits(e.value)} checked={units === 'dd'}  />
                <label>{t("decimalDegrees", "Graus decimais")}</label>
            </div>
            <div className="field-checkbox mb-1">
                <RadioButton value="dms" onChange={(e) => setUnits(e.value)} checked={units === 'dms'}  />
                <label>{`${t("degrees", "Graus")} / ${t("minutes", "Minutos")} / ${t("seconds", "Segundos")}`}</label>
            </div>
          </div>
          <div className="field col-12">
          { units === 'dd' &&
            <div className="grid formgrid">
              <div className="field col-12 md:col-6">
                <label>{t("longitude", "Longitude")}</label>
                <div className="p-inputgroup">
                  <select value={optLongitude} onChange={e => setOptLongitude(e.target.value)}>
                    <option value="E">{t("E", "E")}</option>
                    <option value="W">{t("W", "O")}</option>
                  </select>
                  <input type="text" value={coordX} onKeyDown={positivenumberFieldStrictInput}
                    onChange={(e) => {
                        if (e.target.value) {
                          const txtval = e.target.value.replace(",", ".");
                          let val = parseFloat(txtval);
                          if (typeof val === 'number' && isFinite(val) && val < 0) {
                            setOptLongitude('W');
                            setCoordX(txtval.substring(1));
                          } else {
                            setCoordX(txtval);
                          }
                        } else {
                          setCoordX(null);
                        }
                      }}
                    className="p-inputmask p-inputtext p-component" />
                </div>
              </div>
              <div className="field col-12 md:col-6">
                <label>{t("latitude", "Latitude")}</label>
                <div className="p-inputgroup">
                  <select value={optLatitude} onChange={e => setOptLatitude(e.target.value)}>
                    <option value="N">{t("N", "N")}</option>
                    <option value="S">{t("S", "S")}</option>
                  </select>
                  <input type="text" value={coordY} onKeyDown={positivenumberFieldStrictInput}
                      onChange={(e) => {
                        if (e.target.value) {
                          let val = parseFloat(e.target.value);
                          if (typeof val === 'number' && isFinite(val) && val < 0) {
                            setOptLatitude('S');
                            setCoordY(e.target.value.substring(1));
                          } else {
                            setCoordY(e.target.value);
                          }
                        } else {
                          setCoordY(e.target.value);
                        }
                      }}
                      className="p-inputmask p-inputtext p-component" />
                </div>
              </div>
            </div>          
          }
          { units === 'dms' &&
            <div className="grid formgrid">
              <div className="field col-12 md:col-6">
                <label>{t("longitude", "Longitude")}</label>
                <div className="p-inputgroup">
                  <select value={optLongitude} onChange={e => setOptLongitude(e.target.value)}>
                    <option value="E">{t("E", "E")}</option>
                    <option value="W">{t("W", "O")}</option>
                  </select>
                  <InputMask mask="?999º 99' 99.99''" slotChar="0" value={formatCoordValue(coordX, units, true)}
                    onBlur={(e) => {
                      const coordx = convertDMS2DD(e.target.value.replaceAll("_", "0"));
                      setCoordX(coordx);
                    }}
                  />
                </div>
              </div>
              <div className="field col-12 md:col-6">
                <label>{t("latitude", "Latitude")}</label>
                <div className="p-inputgroup">
                <select value={optLatitude} onChange={e => setOptLatitude(e.target.value)}>
                    <option value="N">{t("N", "N")}</option>
                    <option value="S">{t("S", "S")}</option>
                  </select>
                  <InputMask mask="99º 99' 99?.99''" slotChar="0" value={formatCoordValue(coordY, units)}
                    onBlur={(e) => {
                      const coordy = convertDMS2DD(e.target.value.replaceAll("_", "0"), false);
                      setCoordY(coordy);
                    }}
                  />
                </div>
              </div>
            </div>
          }
          </div>
        </div>      
      )}
      {(!showDegrees &&
      <div className="grid formgrid mt-2">
            <div className="field col-12">
              <label htmlFor="coordsys">{t("coordinateSystem", "Sistema de Coordenadas")}</label>
              <Dropdown options={listCRS} value={CRS} onChange={(e) => setCRS(e.value)} placeholder={t("selectCRS", "Selecione um CRS")} className="w-full" />
            </div>
            <div className="field col-12 md:col-6">
                <label htmlFor="coordX">X</label>
                <input type="text" id="coordX" value={coordX} onKeyDown={numberFieldStrictInput}
                  onChange={(e) => setCoordX(e.target.value)}
                  className="p-inputtext w-full" />
            </div>
            <div className="field col-12 md:col-6">
                <label htmlFor="coordY">Y</label>              
                <input type="text" id="coordY" value={coordY} onKeyDown={numberFieldStrictInput}
                  onChange={(e) => setCoordY(e.target.value)}
                  className="p-inputtext w-full" />
            </div>
        </div>)}
      <div className="card text-center">
        <Button
            label={t("locate","Localizar")}
            icon="pi pi-search"
            className="p-button-md"
            onClick={transformCoordinatesByApi}
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
              outlined size="small"
              onClick={e => removeAll()}
            />
            <Button
              title={t("exportResults", "Exportar resultados")}
              label="CSV"
              icon="pi pi-download"
              outlined size="small"
              className="ml-2"
              onClick={e => exportAll('csv')}
            />
            <Button
              title={t("exportResults", "Exportar resultados")}
              label="GeoJSON"
              icon="pi pi-download"
              outlined size="small"
              className="ml-2"
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