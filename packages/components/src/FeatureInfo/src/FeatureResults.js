import React, { useState, useEffect } from 'react'
import Cookies from 'universal-cookie';
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import OlCollection from 'ol/Collection'
import OlFeature from 'ol/Feature'
import OlFormatGeoJSON from "ol/format/GeoJSON"
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Message } from 'primereact/message'
import { Button } from 'primereact/button'

export default function FeatureResults({ config, features, layers, actions, dispatch, mainMap, record }) {

  const { viewer } = config;

  const [activeIndex, setActiveIndex] = useState(null);

  //Export permissions
  const [userRoles, setUserRoles] = useState([]);
  const [showExport, setShowExport] = useState(true);  
  const [showExportAll, setShowExportAll] = useState(true);
  const [showExportRecord, setShowExportRecord] = useState(true);  

  // Group by layer
  const grouped = groupResults(features, mainMap);

  const showExportAllFeatures = getShowExportAllFeatures(grouped, layers, userRoles);

  //Set Export permissions
  useEffect(() => {
    const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'websig_dgt';
    const cookies = new Cookies();
    const logged = cookies.get(cookieAuthName);
  
    let user_roles = [];
    if (logged && logged.userroles && logged.userroles.length) {
      user_roles = [...logged.userroles];
    }

    let roles = [];
    let showExport = true;    
    if (record.config_json && record.config_json.export_roles && record.config_json.export_roles.length) {
      roles = record.config_json.export_roles.filter(x => user_roles.includes(x));
      if (!roles || roles.length == 0) {
        showExport = false;
      }
    }
  
    const showExportAll = (record.config_json && record.config_json.export_all != null) ? record.config_json.export_all : true;
    const showExportRecord = (record.config_json && record.config_json.export_record != null) ? record.config_json.export_record : true;
    
    setUserRoles(user_roles || []);
    setShowExport(showExport);
    setShowExportAll(showExportAll);
    setShowExportRecord(showExportRecord);
  }, []);

  // Update accordion active items
  useEffect(() => {
    let active = Object.keys(grouped).map((title, i) => i);

    if (active && active.length) {
      setActiveIndex(active);
    } else {
      setActiveIndex([0]);
    }
  }, [features.length]);

  // Zoom to feature
  function zoomFeature(feat) {
    if (feat.getGeometry()) {
      const extent = feat.getGeometry().getExtent();
      //extent validation
      if (!extent) return;
      if (!extent.length) return;
      if (extent[0] === Infinity) return;
      //zoom to extent
      let center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2]
      dispatch(actions.map_set_extent(center, extent));
    }
  }

  // Remove one item
  function removeItem(item) {
    let index = -1;
    if (item.get) {
      index = features.findIndex(f => f.id === item.get('resultId'));
    } else if (item.id) {
      index = features.findIndex(f => f.id === item.id);
    }
    if (index === -1) return;
    let updated = [...features];
    updated.splice(index, 1);
    dispatch(actions.viewer_set_featureinfo(updated));
  }

  // Remove all items
  function removeAll() {
    dispatch(actions.viewer_set_featureinfo([]));
  }

  // Export one
  function exportItem(item) {
    let outCRS = null;
    if (record && record.config_json && record.config_json.export_crs) {
      outCRS = record.config_json.export_crs;
    }

    let results = [item];
    let text = serializeFeatures(results, mainMap, viewer, outCRS);
    download('selecao.geojson', text);
  }

  // Export all results
  function exportAll() {
    let outCRS = null;
    if (record && record.config_json && record.config_json.export_crs) {
      outCRS = record.config_json.export_crs;
    }

    let results = [];
    Object.keys(grouped).map(title => {
      if (allowExportFeatures(title, layers, userRoles)) {
        results = results.concat(grouped[title]);
      }
    });
    let text = serializeFeatures(results, mainMap, viewer, outCRS);
    download('selecao.geojson', text);
  }

  if (Object.keys(grouped).length === 0) return (
    <Message
      severity="info"
      text="Sem resultados. Clique no mapa para identificar." 
    />
  ) 

  return (
    <div>
      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button
          title="Limpar resultados"
          label="Limpar"
          icon="pi pi-times"
          className="p-button-outlined p-button-sm"
          onClick={e => removeAll()}
        />
        { (showExport && showExportAll && showExportAllFeatures) ?
        <Button
          title="Exportar resultados"
          label="Exportar"
          icon="pi pi-download"
          className="p-button-outlined p-button-sm p-ml-2"
          onClick={e => exportAll()}
        /> : null }
      </div>

      <Accordion
        className="p-pt-2"
        multiple
        activeIndex={activeIndex} 
        onTabChange={(e) => setActiveIndex(e.index)}>
          { Object.keys(grouped).map(title => {

            // Validate layer
            const layer = layers.find(l => l.title === title);
            //if (!layer) return null;

            //Get export permissions from layer config
            let layerRecordExport = true;
            if (layer && layer.featureinfo_export_roles && layer.featureinfo_export_roles.length) {
              const roles = layer.featureinfo_export_roles.filter(x => userRoles.includes(x));
              if (roles && roles.length == 0) {
                layerRecordExport = false;
              }
            }
            
            return (
              <AccordionTab header={title}>
                { grouped[title].map((feat, i) => {
                    
                  let key;                  
                  if (feat.getId) key = feat.getId();
                  else if (feat.get) key = feat.get('id') || feat.get('uid') || feat.get('fid');
                  else if (feat.id) key = feat.id;
                  else key = String(i);

                  const rows = getFeatureRows(feat, layer);
                  const hasGeometry = (feat.getGeometry && feat.getGeometry() != null);
                  const isText = (feat.type === 'text');
                  return (
                    <div key={key} className="fi-result-feat">
                      <div className="fi-result-tools">
                        {hasGeometry &&
                        <Button
                          title="Aproximar ao elemento"
                          icon="pi pi-search"
                          onClick={e => zoomFeature(feat)}
                        />}
                        {(!isText && showExport && showExportRecord && layerRecordExport) &&
                        <Button
                          title="Exportar elemento"
                          icon="pi pi-download"
                          onClick={e => exportItem(feat)}
                        />}
                        <Button
                          title="Remover elemento"
                          icon="pi pi-times"
                          onClick={e => removeItem(feat)}
                        />
                      </div>
                      <DataTable
                        value={rows}
                        groupField="layer"
                        className="p-datatable-striped">
                          {!isText &&
                          <Column
                            header="&nbsp;"
                            field="name"
                            style={{whiteSpace: "pre-wrap", overflowWrap: "break-word"}}
                          />}
                          <Column
                            header="&nbsp;"
                            field="value"
                            style={{whiteSpace: "pre-wrap", overflowWrap: "break-word"}}
                          />
                      </DataTable>
                    </div>
                  )
                
                })} 
              </AccordionTab>
            )
          }) }
      </Accordion>
    </div>
    
  )
}

function getFeatureRows(feat, layer) {
  const rows = [];
  if (feat.type === 'text') {
    rows.push({ name: 'name', value: feat.data });
  } else {
    let feature_tpl = null;
    if (layer && layer.feature_tpl && layer.feature_tpl.fields && layer.feature_tpl.fields.length) {
      feature_tpl = layer.feature_tpl;
    } else if (feat.get('feature_tpl') && feat.get('feature_tpl').fields && feat.get('feature_tpl').fields.length) {
      feature_tpl = feat.get('feature_tpl');
    }

    if (feat instanceof OlFeature) {
      if (feature_tpl) {
        feature_tpl.fields.forEach((field, i) => {
          let key = field.name;
          if (typeof feat.get(key) != 'object') {
            rows.push({ key, name: field.title, value: feat.get(field.name) });
          }
        })
      } else {
        let geometryName = feat.getGeometryName() || 'geometry';
        feat.getKeys().forEach((key, i) => {
          if ((typeof feat.get(key) !='object') && (![geometryName, 'st_union', 'boundedBy', 'resultId'].includes(key))) {
            rows.push({ key, name: key, value: feat.get(key) });
          }
        });
      }
    } else {
      if (feature_tpl) {
        feature_tpl.fields.forEach((field, i) => {
          let key = field.name;
          if (typeof feat.get(key) != 'object') {
            rows.push({ key, name: field.title, value: feat.data[field.name] });
          }
        })
      } else {
        Object.keys(feat.data).forEach(k => {
          if (typeof feat.data[k] != 'object') {
            rows.push({ name: k, value: feat.data[k] })
          }
        });
        //rows.push({ name: 'name', value: JSON.stringify(feat.data) });
      }
    }
  }
  return rows;
}

function groupResults(features, map) {
  const grouped = {};
  features.forEach(feat => {
    if (feat.layer) {
      if (!grouped[feat.layer]) grouped[feat.layer] = [];
      if (feat.type === 'ol') {
        let items = parseOlFeatures(feat.data, map);
        items.forEach(f => {
          f.set('resultId', feat.id)
          f.set('feature_tpl', {...feat.feature_tpl});
        });
        grouped[feat.layer] = grouped[feat.layer].concat(items);
      }
      else {
        grouped[feat.layer].push(feat);
      }
    }
  });
  return grouped;
}

function allowExportFeatures(layerKey, layers, userRoles) {
  let allowExport = false;

  const layer = layers.find(l => l.title === layerKey);
  if (layer) {
    //Get export permissions from layer config
    if (layer && layer.featureinfo_export_roles && layer.featureinfo_export_roles.length) {
      const roles = layer.featureinfo_export_roles.filter(x => userRoles.includes(x));
      if (roles && roles.length > 0) {
        allowExport = true;
      }
    } else {
      allowExport = true;
    }
  }

  return allowExport;
}

function getShowExportAllFeatures(groups, layers, userRoles) {
  let show = false;

  Object.keys(groups).forEach((key, i) => {
    if (allowExportFeatures(key, layers, userRoles)) {
      show = true;
    }
  });

  return show;
}

function parseOlFeatures(data, map) {
  // Parse OL feature
  const parser = new OlFormatGeoJSON();
  const parseOptions = {
    dataProjection: map.getView().getProjection().getCode(),
    featureProjection: map.getView().getProjection().getCode()
  };
  let features = parser.readFeatures(data, parseOptions);
  features = features instanceof OlCollection ? features.getArray() : features;
  return features;
}

function serializeFeatures(features, map, viewer, outCRS) {
  let crs = outCRS;
  if (!crs) {
    if (viewer.config_json && viewer.config_json.export_crs) {
      crs = viewer.config_json.export_crs;    
    } else if (viewer.config_json && viewer.config_json.display_crs) {
      crs = viewer.config_json.display_crs;
    } else {
      crs = 4326;
    }
  }

  const parser = new OlFormatGeoJSON();
  const parseOptions = {
    dataProjection: 'EPSG:' + crs,
    featureProjection: map.getView().getProjection().getCode()
  };
  const tmpjson = parser.writeFeatures(features, parseOptions);
  const geojson = JSON.parse(tmpjson);
  const crsinfo = {
                  "type": "name",
                  "properties": {
                      "name": "urn:ogc:def:crs:EPSG::" + crs
                  }
              };
  geojson['crs'] = crsinfo;  
  return JSON.stringify(geojson);
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