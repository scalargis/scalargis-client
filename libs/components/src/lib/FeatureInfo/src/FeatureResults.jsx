import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, ActionIcon, Alert, Button, Group } from '@mantine/core';
import { AttributeTable, IconInfoCircle, IconX, IconDownload, IconSearch } from '@scalargis/ui';
import OlCollection from 'ol/Collection';
import OlFeature from 'ol/Feature';
import OlFormatGeoJSON from "ol/format/GeoJSON";
import convert from 'convert';

import { i18n, ScriptHtmlContent } from '../../components';

import { MAPCONTROL_NAME } from './utils';


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
    const logged = core.getLoggedUser();
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

  // Update accordion active items: every result group opens on new results.
  // The Accordion items are keyed by layer id, not Prime's numeric indices.
  // Keying on the grouped-id set (not features.length) re-opens the panels
  // even when a new identify returns the same count on different layers (C-05).
  const groupedKey = Object.keys(grouped).join(',');
  useEffect(() => {
    setActiveIndex(Object.keys(grouped));
  }, [groupedKey]);

  // Zoom to feature
  function zoomFeature(feat) {
    if (feat.getGeometry()) {
      const extent = feat.getGeometry().getExtent();
      //extent validation
      if (!extent) return;
      if (!extent.length) return;
      if (extent[0] === Infinity) return;
      //zoom to extent
      const center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2]
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
    const updated = [...features];
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

    const results = [item];
    const text = serializeFeatures(results, mainMap, viewer, outCRS);
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
    const text = serializeFeatures(results, mainMap, viewer, outCRS);
    download('selecao.geojson', text);
  }

  const valueTemplate = (rowData) => {
    let val = rowData.value;
    if (rowData.action && rowData.action.type) {
      const action = rowData.action || {};

      if (action.show_null === true || rowData.value != null) {
        val = <Button
            type="button"
            size="xs"
            variant={action.variant}
            leftSection={action.icon ? <i className={action.icon} aria-hidden="true" /> : undefined}
            className={action.classname || action.className}
            title={i18n.translateValue(action.tooltip)}
            onClick={(e) => {
              publish(action.type, action.data);
            }}
          >
            {i18n.translateValue(action.label)}
          </Button>
      } else {
        val = null;
      }
    } else if ((rowData.type || '') === 'html') {
      if (rowData.value && rowData.value.includes('<script')) {
        val = <ScriptHtmlContent markup={rowData.value} />
        return val;
      }

      val = <div
          dangerouslySetInnerHTML={{__html: rowData.value}}
        />
    }
    return val;
  }

  const infoMessage = (text) => (
    <Alert color="informative" py="xs">
      <Group justify="center" gap="xs" wrap="nowrap">
        <IconInfoCircle />
        <span>{text}</span>
      </Group>
    </Alert>
  );

  if (Object.keys(grouped).length === 0) {
    let msg = t("identifyNoResults", "Sem resultados. Clique no mapa para identificar.");
    if (isInactive) msg = `${t("noResults", "Sem resultados")}. ${t("identifyNotActive", "Clique no botão do menu principal para ativar a ferramenta, depois clique no mapa para identificar elementos.")}`;
    return infoMessage(msg);
  }

  return (
    <div>

      { isInactive &&
        infoMessage(t("identifyNotActive", "Clique no botão do menu principal para ativar a ferramenta, depois clique no mapa para identificar elementos."))
      }

      <Group justify="flex-end" gap="xs" py="xs" px="md">
        <Button
          type="button"
          size="xs"
          variant="outline"
          title={t("clearResults", "Limpar resultados")}
          leftSection={<IconX />}
          onClick={e => removeAll()}
        >
          {t("clear", "Limpar")}
        </Button>
        { (showExport && showExportAll && showExportAllFeatures) ?
        <Button
          type="button"
          size="xs"
          variant="outline"
          title={t("exportResults", "Exportar resultados")}
          leftSection={<IconDownload />}
          onClick={e => exportAll()}
        >
          {t("export", "Exportar")}
        </Button> : null }
      </Group>

      <Accordion
        className="pt-2"
        multiple
        value={activeIndex || []}
        onChange={setActiveIndex}>
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
              <Accordion.Item key={layerId} value={layerId}>
                <Accordion.Control>{i18n.translateValue(grouped[layerId].layerName)}</Accordion.Control>
                <Accordion.Panel>
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
                        <ActionIcon
                          variant="filled"
                          size="md"
                          title={t("zoomToElement", "Aproximar ao elemento")}
                          aria-label={t("zoomToElement", "Aproximar ao elemento")}
                          onClick={e => zoomFeature(feat)}
                        >
                          <IconSearch />
                        </ActionIcon>}
                        {(!isText && showExport && showExportRecord && layerRecordExport) &&
                        <ActionIcon
                          variant="filled"
                          size="md"
                          title={t("exportElement", "Exportar elemento")}
                          aria-label={t("exportElement", "Exportar elemento")}
                          onClick={e => exportItem(feat)}
                        >
                          <IconDownload />
                        </ActionIcon>}
                        <ActionIcon
                          variant="filled"
                          size="md"
                          title={t("removeElement", "Remover elemento")}
                          aria-label={t("removeElement", "Remover elemento")}
                          onClick={e => removeItem(feat)}
                        >
                          <IconX />
                        </ActionIcon>
                      </div>
                      <AttributeTable
                        className="fi-result-table"
                        hideLabels={isText}
                        rows={rows.map((row, ri) => ({
                          key: row.key ?? ri,
                          label: isText ? undefined : row.name,
                          value: valueTemplate(row),
                        }))}
                      />
                    </div>
                  )

                })}
                </Accordion.Panel>
              </Accordion.Item>
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
          const key = field.name;
            if (typeof feat_properties[key] != 'object') {

            //let new_value = feat.get(field.name);
            let new_value = feat_properties[field.name];

            //Apply field template
            if (field.value) {
              new_value = field.value;
            }
            new_value = formatTemplateValue(feat_properties, new_value);

            if (field.action) {              
              const action = {...field.action, data: feat_properties};
              delete action.data.feature_tpl;

              if (field.action.data) {
                const new_data = {}
                Object.entries(field.action.data).forEach(([key, value]) => {
                  new_data[key] = formatTemplateValue(feat_properties, value);
                });

                action.data = new_data;
              }
              if (field.action.label) action.label = formatTemplateValue(feat_properties, field.action.label);

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
        const geometryName = feat.getGeometryName() || 'geometry';
        feat.getKeys().forEach((key, i) => {
          if ((typeof feat.get(key) !='object') && (![geometryName, 'st_union', 'boundedBy', 'resultId'].includes(key))) {
            rows.push({ key, name: key, value: feat.get(key) });
          }
        });
      }
    } else {
      if (feature_tpl) {
        feature_tpl.fields.forEach((field, i) => {
          const key = field.name;
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
        const items = parseOlFeatures(feat.data, map);
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
      Object.prototype.isPrototypeOf.call(Object.getPrototypeOf(input), Object);
  }

  const _formatValue = (data, value) => {
    let _new_value = value;

    //TODO: use regex processing
    if (_new_value?.replaceAll) _new_value = value.replaceAll("{{", "[[[").replaceAll("}}", "]]]");

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

    //TODO: use regex processing
    if (_new_value?.replaceAll) _new_value = _new_value.replaceAll("[[[", "{").replaceAll("]]]", "}");

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