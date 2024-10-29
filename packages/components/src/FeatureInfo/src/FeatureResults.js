import React, { useState, useEffect } from 'react'
import { useTranslation } from "react-i18next"
import Cookies from 'universal-cookie';
import { Column } from 'primereact/column'
import { DataTable } from 'primereact/datatable'
import OlCollection from 'ol/Collection'
import OlFeature from 'ol/Feature'
import OlFormatGeoJSON from "ol/format/GeoJSON"
import { Accordion, AccordionTab } from 'primereact/accordion'
import { Message } from 'primereact/message'
import { Button } from 'primereact/button'
import convert from 'convert'

import { i18n } from '@scalargis/components';

import componentMessages from './messages'
import { MAPCONTROL_NAME } from './utils'

export default function FeatureResults({ core, config, features, layers, actions, pubsub, dispatch, mainMap, record }) {
  const { viewer, Models } = config;
  const { findOlLayer } = Models.Utils;
  const { selected_menu } = viewer.config_json;
  const { exclusive_mapcontrol } = viewer;
  const { publish, subscribe } = pubsub ? pubsub : {};

  const { t } = useTranslation();

  const [activeIndex, setActiveIndex] = useState(null);
  
  //Export permissions
  const [userRoles, setUserRoles] = useState([]);
  const [showExport, setShowExport] = useState(true);  
  const [showExportAll, setShowExportAll] = useState(true);
  const [showExportRecord, setShowExportRecord] = useState(true);  

  // Group by layer
  const grouped = groupResults(features, mainMap);

  const showExportAllFeatures = getShowExportAllFeatures(grouped, layers, userRoles);

  const isInactive = selected_menu === record.id && exclusive_mapcontrol !== MAPCONTROL_NAME;

  //Set Export permissions
  useEffect(() => {
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
  
    let user_roles = [];
    if (logged && logged.userroles && logged.userroles.length) {
      user_roles = [...logged.userroles];
    }

    let roles = [];
    let showExport = true;    
    if (record.config_json && record.config_json.export_roles && record.config_json.export_roles.length) {
      roles = record.config_json.export_roles.filter(x => user_roles.includes(x));
      if (!roles || roles.length === 0) {
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
    let active = Object.keys(grouped).map((layerId, i) => i);
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
    Object.keys(grouped).map(layerId => {
      if (allowExportFeatures(layerId, layers, userRoles)) {
        if (grouped[layerId]?.features?.length) {
          results = results.concat(grouped[layerId].features);
        }
      }
    });
    let text = serializeFeatures(results, mainMap, viewer, outCRS);
    download('selecao.geojson', text);
  }

  const valueTemplate = (rowData) => {
    let val = rowData.value;
    if (rowData.action && rowData.action.type) {
      const action = rowData.action || {};

      if (action.show_null === true || rowData.value != null) {
        val = <Button label={i18n.translateValue(action.label)} icon={action.icon}
            className={action.classname || action.className}
            title={i18n.translateValue(action.tooltip)}
            onClick={(e) => {
              publish(action.type, action.data);
            }}
          />
      } else {
        val = null;
      }
    } else if ((rowData.type || '') === 'html') {
      val = <div
          dangerouslySetInnerHTML={{__html: rowData.value}}
        />
    }
    return val;
  }

  if (Object.keys(grouped).length === 0) {
    let msg = t("identifyNoResults", "Sem resultados. Clique no mapa para identificar.");
    if (isInactive) msg = `${t("noResults", "Sem resultados")}. ${t("identifyNotActive", "Clique no botão do menu principal para ativar a ferramenta, depois clique no mapa para identificar elementos.")}`;
    return (
      <Message
        severity="info"
        text={msg}
      />
    )
  }

  return (
    <div>

      { isInactive &&
        <Message
          severity="info"
          text={t("identifyNotActive", "Clique no botão do menu principal para ativar a ferramenta, depois clique no mapa para identificar elementos.")} 
        />
      }

      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button
          title={t("clearResults", "Limpar resultados")}
          label={t("clear", "Limpar")}
          icon="pi pi-times"
          className="p-button-outlined p-button-sm"
          onClick={e => removeAll()}
        />
        { (showExport && showExportAll && showExportAllFeatures) ?
        <Button
          title={t("exportResults", "Exportar resultados")}
          label={t("export", "Exportar")}
          icon="pi pi-download"
          className="p-button-outlined p-button-sm ml-2"
          onClick={e => exportAll()}
        /> : null }
      </div>

      <Accordion
        className="pt-2"
        multiple
        activeIndex={activeIndex} 
        onTabChange={(e) => setActiveIndex(e.index)}>
          { Object.keys(grouped).map(layerId => {
            // Validate layer
            let layer = layers.find(l => l.id === layerId);

            //If layer was added programmatically to map
            if (!layer) {
              const olLayer = findOlLayer(mainMap, layerId);
              if (olLayer) {
                const lprops = olLayer.getProperties();
                const { id, title, feature_tpl, featureinfo_export_roles } = lprops;
                layer = { id, title, feature_tpl, featureinfo_export_roles }
              }
            }

            if (!layer) return null;

            //Get export permissions from layer config
            let layerRecordExport = true;
            if (layer && layer.featureinfo_export_roles && layer.featureinfo_export_roles.length) {
              const roles = layer.featureinfo_export_roles.filter(x => userRoles.includes(x));
              if (roles && roles.length === 0) {
                layerRecordExport = false;
              }
            }
            
            return (
              <AccordionTab key={layerId} header={i18n.translateValue(grouped[layerId].layerName)}>
                { grouped[layerId].features.map((feat, i) => {
                    
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
                          title={t("zoomToElement", "Aproximar ao elemento")}
                          icon="pi pi-search"
                          onClick={e => zoomFeature(feat)}
                        />}
                        {(!isText && showExport && showExportRecord && layerRecordExport) &&
                        <Button
                          title={t("exportElement", "Exportar elemento")}
                          icon="pi pi-download"
                          onClick={e => exportItem(feat)}
                        />}
                        <Button
                          title={t("removeElement", "Remover elemento")}
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
                            body={valueTemplate}
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
    rows.push({ name: 'name', value: feat.data, type: 'text' });
  } else {
    let feature_tpl = null;
    if (layer && layer?.feature_tpl?.fields?.length) {
      feature_tpl = layer.feature_tpl;
    } else if (feat.get('feature_tpl') && feat.get('feature_tpl')?.fields?.length) {
      feature_tpl = feat.get('feature_tpl');
    }

    // Make copy of feature template (deep clone) 
    feature_tpl = JSON.parse(JSON.stringify(feature_tpl));

    if (feat instanceof OlFeature) {
      const feat_properties = JSON.parse(JSON.stringify(feat.getProperties()));
      if (feature_tpl) {
        feature_tpl.fields.forEach((field, i) => {
          let key = field.name;
            if (typeof feat_properties[key] != 'object') {

            //let new_value = feat.get(field.name);
            let new_value = feat_properties[field.name];

            //Apply field template
            if (field.value) {
              new_value = field.value;
            }
            new_value = formatTemplateValue(feat_properties, new_value);

            if (field.action) {              
              let action = {...field.action, data: feat_properties};
              delete action.data.feature_tpl;

              if (field.action.data) {
                const new_data = {}
                Object.entries(field.action.data).forEach(([key, value]) => {
                  new_data[key] = formatTemplateValue(feat_properties, value);
                });

                action.data = new_data;
              }

              rows.push({ 
                key, 
                name: i18n.translateValue(field.title),
                action,
                value: new_value,
                type: field.type
              });
            } else {
              rows.push({ 
                key,
                name: i18n.translateValue(field.title),
                value: formatValue(new_value, field.format),
                type: field.type
              });
            }
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

            let new_value = feat.data[field.name];

            //Apply field template
            if (field.value) {
              new_value = field.value;
            }
            const rf = (new_value && new_value.match) ? new_value.match(/[^{}]+(?=})/g) : null;
            if (rf) {
              rf.forEach(fld => {
                new_value = new_value.replace(`{${fld}}`, feat.get(fld) || '');      
              });                 
            }

            rows.push({ 
              key, 
              name: field.title, 
              value: formatValue(new_value, field.format), 
              type: field.type
            });
          }
        })
      } else {
        Object.keys(feat.data).forEach(k => {
          if (typeof feat.data[k] != 'object') {
            rows.push({ name: k, value: feat.data[k] })
          }
        });
      }
    }
  }
  return rows;
}

function groupResults(features, map) {
  const grouped = {};
  features.forEach(feat => {
    if (feat.layer && feat.data) {
      const layerId = feat.layerId
      const layerName = i18n.translateValue(feat.layer);

      if (!grouped[layerId]) grouped[layerId] = {layerId, layerName, features: []};
      if (feat.type === 'ol') {
        let items = parseOlFeatures(feat.data, map);
        items.forEach(f => {
          f.set('layerId', layerId);
          f.set('resultId', feat.id);
        });
        grouped[layerId].features = grouped[layerId].features.concat(items);
      } else {
        grouped[layerId].features.push(feat);
      }
    }
  });
  return grouped;
}

function allowExportFeatures(layerId, layers, userRoles) {
  let allowExport = false;

  const layer = layers.find(l => l.id === layerId);
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

function formatValue(value, format) {
  let new_value = value;
  if (format) {
    let val = value;
    if (format.source_unit && format.output_unit) {
      val = convert(val, format.source_unit).to(format.output_unit);
    }
    if (format.options) {
      val =  val.toLocaleString(format.locale || 'en-US', format.options);
      if (format.options.useGrouping !== false) {
        val = val.replace(/,/g," ");
      }
    }
    if (format.expression) {
      val = format.expression.replace('{value}', val);
    }
    new_value = val;
  }
  return new_value;
}

const formatTemplateValue = (rowData, value) => {
  let new_value = value;

  const _isPureObject = (input) => {
    return null !== input && 
      typeof input === 'object' &&
      Object.getPrototypeOf(input).isPrototypeOf(Object);
  }

  const _formatValue = (data, value) => {
    let _new_value = value;

    const rf = (_new_value && _new_value.match) ? _new_value.match(/[^{}]+(?=})/g) : null;
    if (rf) {
      if (rf.length === 1) {
        const fld = rf[0];
        if (fld in data) {
          _new_value = _new_value.replace(`{${fld}}`, data[fld] || '');
        }
      } else {
        rf.forEach(fld => {
          _new_value = _new_value.replace(`{${fld}}`, data[fld] || '');
        });
      }
    }
    return _new_value;
  }

  if (_isPureObject(value)) {
    function iter(o) {
      Object.keys(o).forEach(function (k) {
          if (o[k] !== null && typeof o[k] === 'object') {
              iter(o[k]);
              return;
          }
          o[k] = _formatValue(rowData, o[k]);
      });
    }
    iter(new_value);
  } else {
    new_value = _formatValue(rowData, value);
  }
  return new_value;
}