import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation} from "react-i18next";
import { v4 as uuidV4 } from 'uuid';
import { transform } from 'ol/proj'
import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Menu,
  NativeSelect,
  NumberInput,
  Pagination,
  Radio,
  Select,
  TextInput,
} from '@mantine/core';
import OlFeature from 'ol/Feature';
import OlPoint from 'ol/geom/Point'
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import * as OlProj from 'ol/proj';

import { MAPCONTROL_NAME } from './utils';

import './style.css';


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
  const [resultsPage, setResultsPage] = useState(1);

  const userRoles = useMemo(()=>{
    const logged = core.getLoggedUser();
    let user_roles = [];
    if (logged && logged.userroles && logged.userroles.length) {
      user_roles = [...logged.userroles];
    }
    return user_roles;
  }, []);

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== MAPCONTROL_NAME;


  // Prime's SplitButton had an empty label and no default action — only its
  // dropdown mattered, so one Menu-wrapped download button replaces the pair.
  const renderSaveBtn = data => (
    <Menu>
      <Menu.Target>
        <ActionIcon
          type="button"
          radius={0}
          aria-label={t("exportResults", "Exportar resultados")}
          title={t("exportResults", "Exportar resultados")}
        >
          <i className="pi pi-download" aria-hidden="true" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<i className="pi pi-align-justify" aria-hidden="true" />}
          onClick={() => exportItem(data, 'csv')}
        >
          CSV
        </Menu.Item>
        <Menu.Item
          leftSection={<i className="pi pi-globe" aria-hidden="true" />}
          onClick={() => exportItem(data, 'geojson')}
        >
          GeoJSON
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

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

    const item = { id: uuidV4(), coordinates: new_coords, crs: mainMap.getView().getProjection().getCode(), results: trans_coords };
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
    let val = null;

    const parts = dms.replace("º", "").replace("''","").replace("'","").split(" ");

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
        <Group className="coordinates-item-tools" justify="flex-end" gap={0}>
          <ActionIcon
            type="button"
            radius={0}
            title={t("zoomToElement", "Aproximar ao elemento")}
            aria-label={t("zoomToElement", "Aproximar ao elemento")}
            onClick={e => zoomItem(data)}
          >
            <i className="pi pi-search" aria-hidden="true" />
          </ActionIcon>
          {renderSaveBtn(data)}
          <ActionIcon
            type="button"
            radius={0}
            title={t("removeElement","Remover elemento")}
            aria-label={t("removeElement","Remover elemento")}
            onClick={e => removeItem(data)}
          >
            <i className="pi pi-times" aria-hidden="true" />
          </ActionIcon>
        </Group>
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

  const previousResults = (coordinates || []).slice(1);
  const resultsPageSize = 9;
  const resultsPages = Math.ceil(previousResults.length / resultsPageSize);
  const safeResultsPage = Math.min(resultsPage, resultsPages) || 1;

  return (
    <div>

      { (isInactive || !coordinates?.length) ?
        <div className="mt-2 mb-3">
          <Alert color="informative" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-info-circle" />
              <span>{msg}</span>
            </Group>
          </Alert>
        </div> : null }

      {(showDegrees &&
      <div className="grid formgrid mt-2">
          <div className="field col-12">
            <Select
              label={t("coordinateSystem", "Sistema de Coordenadas")}
              data={listCRS}
              value={CRS}
              onChange={(value) => value && setCRS(value)}
              allowDeselect={false}
              placeholder={t("selectCRS", "Selecione um CRS")}
              className="w-full"
            />
          </div>
          <div className="field col-12">
            <Radio.Group value={units} onChange={setUnits}>
              <Radio size="md" value="dd" label={t("decimalDegrees", "Graus decimais")} mb={4} />
              <Radio size="md" value="dms" label={`${t("degrees", "Graus")} / ${t("minutes", "Minutos")} / ${t("seconds", "Segundos")}`} />
            </Radio.Group>
          </div>
          <div className="field col-12">
          { units === 'dd' &&
            <div className="grid formgrid">
              <div className="field col-12 md:col-6">
                <NumberInput label={t("longitude", "Longitude")} value={coordX ?? ''} onChange={(value) => setCoordX(value === '' ? null : value)} hideControls decimalScale={8} className="w-full" />
              </div>
              <div className="field col-12 md:col-6">
                <NumberInput label={t("latitude", "Latitude")} value={coordY ?? ''} onChange={(value) => setCoordY(value === '' ? null : value)} hideControls decimalScale={8} className="w-full" />
              </div>
            </div>
          }
          { units === 'dms' &&
            <div className="grid formgrid">
              <div className="field col-12 md:col-6">
                <label>{t("longitude", "Longitude")}</label>
                <Group gap={0} wrap="nowrap">
                  <NativeSelect
                    value={optLongitude}
                    onChange={e => setOptLongitude(e.target.value)}
                    data={['E', 'W']}
                    aria-label={t("longitude", "Longitude")}
                    w={64}
                  />
                  <TextInput
                    value={coordLon || ''}
                    onChange={(e) => setCoordLon(e.target.value)}
                    placeholder="008º 30' 15.00''"
                    aria-label={t("longitude", "Longitude")}
                    style={{ flex: 1 }}
                  />
                </Group>
              </div>
              <div className="field col-12 md:col-6">
                <label>{t("latitude", "Latitude")}</label>
                <Group gap={0} wrap="nowrap">
                  <NativeSelect
                    value={optLatitude}
                    onChange={e => setOptLatitude(e.target.value)}
                    data={['N', 'S']}
                    aria-label={t("latitude", "Latitude")}
                    w={64}
                  />
                  <TextInput
                    value={coordLat || ''}
                    onChange={(e) => setCoordLat(e.target.value)}
                    placeholder="39º 30' 15.00''"
                    aria-label={t("latitude", "Latitude")}
                    style={{ flex: 1 }}
                  />
                </Group>
              </div>
            </div>
          }
          </div>
        </div>
      )}
      {(!showDegrees &&
      <div className="grid formgrid mt-2">
            <div className="field col-12">
              <Select
                label={t("coordinateSystem", "Sistema de Coordenadas")}
                data={listCRS}
                value={CRS}
                onChange={(value) => value && setCRS(value)}
                allowDeselect={false}
                placeholder={t("selectCRS", "Selecione um CRS")}
                className="w-full"
              />
            </div>
            <div className="field col-12 md:col-6">
                <NumberInput id="coordX" label="X" value={coordX ?? ''} onChange={(value) => setCoordX(value === '' ? null : value)} hideControls decimalScale={8} className="w-full" />
            </div>
            <div className="field col-12 md:col-6">
                <NumberInput id="coordY" label="Y" value={coordY ?? ''} onChange={(value) => setCoordY(value === '' ? null : value)} hideControls decimalScale={8} className="w-full" />
            </div>
        </div>)}
      <div className="card text-center">
        <Button
            leftSection={<i className="pi pi-search" aria-hidden="true" />}
            onClick={e => { transformCoordinatesByApi(); }}
        >
          {t("locate","Localizar")}
        </Button>
        </div>

      { ( coordinates && coordinates.length && coordinates.length > 0 ? 
        <React.Fragment>
          <hr className="rounded" />

          <Group justify="flex-end" gap="xs" style={ {padding: "1rem 0"} }>
            <Button
              variant="outline"
              size="xs"
              title={t("clearResults", "Limpar resultados")}
              leftSection={<i className="pi pi-times" aria-hidden="true" />}
              onClick={e => removeAll()}
            >
              {t("clear", "Limpar")}
            </Button>
            <Button
              variant="outline"
              size="xs"
              title={t("exportResults", "Exportar resultados")}
              leftSection={<i className="pi pi-download" aria-hidden="true" />}
              onClick={e => exportAll('csv')}
            >
              CSV
            </Button>
            <Button
              variant="outline"
              size="xs"
              title={t("exportResults", "Exportar resultados")}
              leftSection={<i className="pi pi-download" aria-hidden="true" />}
              onClick={e => exportAll('geojson')}
            >
              GeoJSON
            </Button>
          </Group>

          { renderCoordinatesItem(coordinates[0]) }
        </React.Fragment> : null
      ) }

      { ( coordinates.length > 1 ?
        <React.Fragment><h4>{t("previousResults", "Resultados anteriores")}</h4>
          <div className="coordinates-results" style={{fontSize: ".8rem"}}>
            { previousResults
                .slice((safeResultsPage - 1) * resultsPageSize, safeResultsPage * resultsPageSize)
                .map(item => (
                  <React.Fragment key={item.id}>
                    { renderCoordinatesItem(item) }
                  </React.Fragment>
                )) }
            { resultsPages > 1 &&
              <Group justify="center" mt="xs">
                <Pagination size="sm" siblings={0} total={resultsPages} value={safeResultsPage} onChange={setResultsPage} />
              </Group> }
          </div>
        </React.Fragment> : null)
      }

    </div>
  )

}