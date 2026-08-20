import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation} from "react-i18next";
import { useFormContext } from 'react-hook-form';
import { Alert, Button, Checkbox, Group, Loader, NumberInput, Select, Tabs } from '@mantine/core';
import { confirm, notify, IconXCircle, IconInfoCircle, IconExternalLink, IconChevronLeft, IconPrint } from '@scalargis/ui';
import OlInteractionDraw from 'ol/interaction/Draw';
import OlInteractionModify from 'ol/interaction/Modify';
import OlInteractionSelect from 'ol/interaction/Select';
import OlInteractionDragPan from "ol/interaction/DragPan";
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { Fill, Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import { extend, createEmpty } from 'ol/extent';
import { singleClick, platformModifierKeyOnly } from 'ol/events/condition';

import { DrawingToolbar } from '../../components';
import PrintFormFields from './PrintFormFields';
import { MAPCONTROL_NAME, DEFAULT_DRAWING_TOOLS } from './utils';

import './style.css';

// Scale-tab key (the config's defaultScaleSelector vocabulary) → scale mode.
const TAB_MODE = { predefined: 'restricted', freescale: 'free', map: 'map' };

export default function PrintPanelItem(props) {

  const { core, control, printItem, printLayer, fields, handleFieldChange, standalone, config, actions } = props;
  const { viewer, mainMap, dispatch, Models, auth } = config;
  const { findOLInteraction, isUrlAppHostname } = Models.Utils;
  const { getScaleForResolution, getWMSVisibleLayers, getArcGISVisibleLayers } = Models.MapModel;
  const { exclusive_mapcontrol } = viewer;

  const { selected_menu } = viewer.config_json;

  const { i18n, t } = useTranslation();

  const { trigger } = useFormContext();

  const paperBoxLayer = useRef();
  const [paperBox, setPaperBox] = useState(false);

  const [drawTool, setDrawTool] = useState(null);
  const [draw, setDraw] = useState(null);
  const copyGeometry = useRef(null);
  const select = useRef(null);
  const modify = useRef();

  const [formats, setFormats] = useState(null);
  const [restrictScales, setRestrictScales] = useState(null);

  const initialScaleTab = (() => {
    const keys = [];
    if (printItem.restrict_scales) keys.push('predefined');
    if (printItem.free_scale) keys.push('freescale');
    if (printItem.map_scale) keys.push('map');
    if (!keys.length) return null;
    const def = control?.config_json?.defaultScaleSelector;
    return keys.includes(def) ? def : keys[0];
  })();
  const [scaleTab, setScaleTab] = useState(initialScaleTab);
  const [selectedScaleMode, setSelectedScaleMode] = useState(initialScaleTab ? TAB_MODE[initialScaleTab] : null);
  const [restrictedScale, setRestrictedScale] = useState(null);
  const [freeScale, setFreeScale] = useState(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const [geometryError, setGeometryError] = useState(false);

  const [printFile, setPrintFile] = useState(null);

  const drawingOptionsTools = useMemo(() => {
    const _tools = control?.config_json?.drawingOptions?.tools || DEFAULT_DRAWING_TOOLS;
    return _tools.map(t => t.toLowerCase());
  }, [control?.config_json?.drawingOptions?.tools]);

  function selectDrawTool(e, tool) {
    e.preventDefault();
    e.currentTarget.blur();

    if (drawTool !== tool) setDrawTool(tool);
    else setDrawTool(null);
  }

  function addInteraction(type) {
    if (draw) mainMap.removeInteraction(draw);
    if (copyGeometry.current) copyGeometry.current.setActive(false);
    if (select.current) select.current.setActive(false);
    if (modify.current) modify.current.setActive(false);

    if (['Point', 'LineString', 'Polygon'].includes(type)) {
      const source = printLayer.current.getSource();
      const di = new OlInteractionDraw({
        source: source,
        type: type,
      });
      mainMap.addInteraction(di);
      di.on('drawend', (e) => {
        if (!printItem.multi_geom) {
          if (select.current) select.current.getFeatures().clear();
          printLayer.current.getSource().getFeatures().forEach((f) => {
            if (f !== e.feature) printLayer.current.getSource().removeFeature(f);
          });
        }

        if (paperBox) {
          drawPaperBox()
        }
      });
      setDraw(di);
    } else if (type === 'Copy') {
      copyGeometry.current.setActive(true);
    } else if (type === 'Select') {
      select.current.setActive(true);
    } else if (type === 'Modify') {
      findOLInteraction(mainMap, OlInteractionDragPan).setActive(false);
      modify.current.setActive(true);
    }
  }

  const confirmCopyFeatureGeometry = (feature) => {
    confirm({
      message: `${t("copyGeometryConfirmation", "Deseja copiar a geometria selecionada?")}`,
      header: t("confirmation", "Confirmação"),
      acceptLabel: t("yes", "Sim"),
      rejectLabel: t("no", "Não"),
      accept: () => {
        // Chek if the print item allows multiple geometries, clear the previous geometries if not
        if (!printItem.multi_geom) {
          printLayer.current.getSource().getFeatures().forEach((f) => {
            printLayer.current.getSource().removeFeature(f);
          });
        }

        // Copy the geometry to the print layer
        const _feat = new Feature({
          geometry: feature.getGeometry().clone()
        });
        printLayer.current.getSource().addFeature(_feat);
      },
      reject: () => {
        // do nothing
      },
      onHide: () => {
        // Clear the selection
        copyGeometry.current.getFeatures().clear();
        mainMap.render();
      }
    });
  }

  const confirmDeleteAll = (features) => {
    confirm({
      message: ` ${t("deleteAllElments", "Deseja eliminar todos os elementos?")}`,
      header: t("confirmation", "Confirmação"),
      severity: 'danger',
      acceptLabel: t("yes", "Sim"),
      rejectLabel: t("no", "Não"),
      accept: () => {
        features.forEach((f) => {
          printLayer.current.getSource().removeFeature(f);
        });
        drawPaperBox();
        mainMap.render();
      },
      reject: () => { /* noop */ }
    });
  }

  function deletedSelectedFeature() {
    const feats = printLayer.current.getSource().getFeatures();

    if (select.current && select.current.getFeatures().getLength() > 0) {
      select.current.getFeatures().forEach((f) => {
        printLayer.current.getSource().removeFeature(f);
      });
      select.current.getFeatures().clear();
    } else if (feats && feats.length > 1) {
      confirmDeleteAll(feats);
    } else if (feats && feats.length === 1) {
      feats.forEach((f) => {
        printLayer.current.getSource().removeFeature(f);
      });
    }

    drawPaperBox();
    mainMap.render();
  }

  function zoomFeaturesExtent() {
    if (printLayer && printLayer.current && printLayer.current.getSource().getFeatures().length > 0) {
      let extent = printLayer.current.getSource().getExtent();
      if (!extent) return;
      const center = [extent[0] + (extent[2] - extent[0]) / 2, extent[1] + (extent[3] - extent[1]) / 2];

      if ((extent[2] - extent[0]) < 500 || (extent[3] - extent[1]) < 500) {
        extent = [center[0] - 250, center[1] - 250, center[0] + 250, center[1] + 250];
      }

      dispatch(actions.map_set_extent(center, extent));
    }
  }

  function goPanelPrintPrev() {
    props.setPrintItem(null);
    if (draw) mainMap.removeInteraction(draw);
    props.changeActivePanel('p1');
  }

  async function doPrint() {  //---------------------------------------------------------------------------------- DO PRINT

    // trigger() forces react-hook-form to validate the (still-untouched) fields
    // so their required errors actually paint — the flat `fields` gate below only
    // decides whether to print, it never surfaces the "Campo obrigatório" UI.
    const fieldsValid = await trigger();

    let isFormInvalid = !fieldsValid;

    setPrintFile(null);

    const formData = {};
    if (printItem.form_fields && printItem.form_fields.groups) {
      Object.entries(printItem.form_fields.groups).forEach(([groupKey, group]) => {
        Object.entries(group.fields).forEach(([fieldKey, field]) => {
          const field_key = groupKey + '.' + fieldKey;
          const val = fields[field_key];
          if (val) {
            const fieldName = field.name || fieldKey;
            formData[fieldName] = encodeURIComponent(val);
          } else {
            if (field.required) isFormInvalid = true;
          }
        });
      });
    }
    if (printItem.form_fields && printItem.form_fields.fields) {
      Object.entries(printItem.form_fields.fields).forEach(([fieldKey, field]) => {
        const field_key = fieldKey;
        const val = fields[field_key];
        if (val) {
          const fieldName = field.name || fieldKey;
          formData[fieldName] = encodeURIComponent(val);
        } else {
          if (field.required) isFormInvalid = true;
        }
      });
    }

    if (printItem.location_marking) {
      const ft = printLayer.current.getSource().getFeatures();
      if (ft.length == 0) {
        isFormInvalid = true;
        setGeometryError(true);
      } else {
        setGeometryError(false);
      }
    }

    //Abort if form is not valid
    if (isFormInvalid) return;

    setDrawTool(null);
    setIsPrinting(true);

    // Set fetch options
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: {}
    }

    // Get logged user
    const logged = core.getLoggedUser();
    if (logged) options.headers['X-API-KEY'] = logged.token;

    const url = core.API_URL + '/app/viewer/' + viewer.id + '/print/' + printItem.code + '/generate';

    const scale = getScaleForResolution(mainMap.getView().getResolution(), 'm');

    const record = {
      ...formData,
      viewerId: viewer.id,
      printId: printItem.id,
      srid: printItem.srid || 3857,
      layout: 'A4|Portrait',
      scale: scale,
      extentWKT: ''
    }

    if (viewer.config_json.drawings && viewer.config_json.drawings.length > 0) {
      record['userDrawings'] = JSON.stringify(viewer.config_json.drawings);
    }

    if (formData) {
      record['formFields'] = JSON.stringify(formData);
    }

    if (fields.layout) {
      record['layout'] = fields.layout.format + '|' + fields.layout.orientation;
    }

    if (selectedScaleMode === 'restricted' && restrictedScale) {
      record['userScale'] = restrictedScale;
    } else if (selectedScaleMode === 'free' && freeScale) {
      record['userScale'] = freeScale;
    }

    const outProj = printItem.srid ? 'EPSG:' + printItem.srid : mainMap.getView().getProjection().getCode();

    const extent = Models.MapModel.transformExtent(mainMap.getView().getProjection().getCode(), outProj, mainMap.getView().calculateExtent(mainMap.getSize()));
    if (extent) {
      record.extentWKT = Models.MapModel.getWKTFromGeometry(Models.MapModel.getPolygonFromExtent(extent));
    }

    const geomWKT = [];
    printLayer.current.getSource().getFeatures().forEach((f) => {
      geomWKT.push(Models.MapModel.getWKTFromGeometry(f.getGeometry().clone().transform(mainMap.getView().getProjection().getCode(), outProj)));
    });

    let data = Object.keys(record).map(key => key + '=' + record[key]).join('&');

    if (geomWKT && geomWKT.length > 0) {
      data += '&' + geomWKT.map(wkt => 'geomWKT[]=' + wkt).join('&');
    }

    //Get WMS and ArGIS Layers
    const wmsLayers = getWMSVisibleLayers(mainMap, undefined) || [];
    const arcgisLayers = getArcGISVisibleLayers(mainMap) || [];

    const allLayers = [
      ...wmsLayers.map(l => {
        let vals =  'wms' + ';' + l.url + ';' + l.params.LAYERS + ';' + l.opacity + ';' + l.minScale + ';' + l.maxScale + ';' + (l.params.CQL_FILTER || '') + ';' + (l.params.STYLES || l.params.STYLE || '') + ';' + (l.params.FORMAT || '');
        //Add user authentication token
        if (isUrlAppHostname(l.url) && auth?.data?.auth_token) {
            vals += ";" + auth.data.auth_token;
        }
        return vals;
      }),
      ...arcgisLayers.map(l => 'esri_rest' + ';' + l.url + ';' + l.params.LAYERS + ';' + l.opacity + ';' + l.minScale + ';' + l.maxScale + ';' + (l.params.CQL_FILTER || '') + ';' + (l.params.STYLES || l.params.STYLE || '')),
    ];

    if (allLayers.length) {
      data += '&' + allLayers.map(l => 'layers[]=' + l).join('&');
    }

    const opts = {
      ...options,
      body: data
    }

    return fetch(url, opts)
      .then(res => res.json())
      .then(res => {
        setIsPrinting(false);
        if (res.Success) {
          setPrintFile({ filename: res.Data.filename, url: res.Data.url });
        } else {
          throw (res.Message || 'Ocorreu um erro ao gerar a planta');
        }
      }).catch(error => {
        setIsPrinting(false);
        notify.warn(printItem.title || 'Emissão de plantas',
          t("printError", "Não foi possível gerar a planta"));
      });
  }

  //---------------------------------------------------------------------------------- END DO PRINT

  const scaleTabs = [];
  if (printItem.restrict_scales) scaleTabs.push({ key: 'predefined', label: t("predefined", "Predefinida") });
  if (printItem.free_scale) scaleTabs.push({ key: 'freescale', label: t("free", "Livre") });
  if (printItem.map_scale) scaleTabs.push({ key: 'map', label: t("map", "Mapa") });

  useEffect(() => {
    const frmts = {};
    printItem.layouts.forEach((p) => {
      const { format, orientation } = p;
      const key = format + '-' + orientation;
      if (!frmts[key]) frmts[key] = { format, orientation, label: format + ' - ' + t(orientation, orientation) }
    });
    const ff = [];
    Object.keys(frmts).forEach(function (k) {
      ff.push(frmts[k]);
    });
    setFormats(ff);
    if (ff.length > 0) handleFieldChange({ target: { id: 'layout', value: ff[0] } });

    //Set restricted scales
    const scales = [];
    if (printItem.restrict_scales_list) {
      printItem.restrict_scales_list.split(',').forEach((s) => {
        scales.push({ value: parseInt(s), label: '1:' + s });
      })
    }
    setRestrictScales(scales);
    //Set restricted scale default value
    if (scales.length > 0) setRestrictedScale(scales[0].value);
  }, []);

  function onScaleTabChange(key) {
    setScaleTab(key);
    setSelectedScaleMode(TAB_MODE[key]);
  }

  // Add paper box layer
  useEffect(() => {

    paperBoxLayer.current = new VectorLayer({
      id: "paperbox-layer",
      renderMode: 'vector',
      source: new Vector({}),
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(100, 100, 100, 0.8)',
          width: 7,
          lineDash: [4, 8]
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
      })
    })

    mainMap.addLayer(paperBoxLayer.current)

    return () => {
      if (mainMap && paperBoxLayer.current) {
        mainMap.removeLayer(paperBoxLayer.current);
      }
    }

  }, []);

  useEffect(()=> {
    const fn_change = printLayer.current.getSource().on('change', () => {
      if (printItem.location_marking) {
        const ft = printLayer.current.getSource().getFeatures();
        if (ft.length == 0) {
          setGeometryError(true);
        } else {
          setGeometryError(false);
        }
      }
    });

    return () => {
      if (fn_change && printLayer.current) {
        printLayer.current.getSource().un('change', fn_change.listener);
      }
    }
  }, []);

  useEffect(() => {
    if (!formats?.length) return;
    setFormats(formats.map((f) => { return {...f, label: f.format + ' - ' + t(f.orientation, f.orientation)}}))
  }, [i18n.resolvedLanguage]);


  // draw paper box
  function drawPaperBox() {
    if (!paperBoxLayer.current.getSource()) { return null }

    paperBoxLayer.current.getSource().clear();

    if (!paperBox) { return null }
    if (selected_menu !== control.id) { return null }


    let scale;


    if (selectedScaleMode === 'map') {
      scale = getScaleForResolution(mainMap.getView().getResolution(), 'm')
    } else if (selectedScaleMode === 'free') {
      scale = freeScale
    } else if (selectedScaleMode === 'restricted') {
      scale = restrictedScale
    } else if (printItem.scale) {
      scale = printItem.scale;
    } else {
      // ?
      return null
    }


    let center_x
    let center_y

    if (printLayer.current.getSource().getFeatures().length > 0) { // user geoms
      let f_extent = new createEmpty()
      printLayer.current.getSource().getFeatures().forEach((i) => {
        f_extent = extend(f_extent, i.getGeometry().getExtent())
      })
      center_x = (f_extent[0] + f_extent[2]) / 2
      center_y = (f_extent[1] + f_extent[3]) / 2
    } else {
      // no user geom
      center_x = mainMap.getView().getCenter()[0];
      center_y = mainMap.getView().getCenter()[1];
    }

    // const units = "meter"
    const inch_per_units = 39.37

    // find layout serv conf
    const layout_conf = printItem.layouts.find(e => e.orientation === (fields?.layout?.orientation || printItem.orientation) && e.format === (fields?.layout?.format || printItem.format))
    if (!layout_conf || !layout_conf.config) return null; // TODO need clean up !??

    const layout_conf_json = JSON.parse(layout_conf?.config)[0]

    const img_w = layout_conf_json?.map?.width;
    const img_h = layout_conf_json?.map?.height;

    if (!img_w || !img_h) return null;

    const magic = 22;
    const res = 1 / ((1 / scale) * inch_per_units * magic);
    const half_w = (img_w * res) / 2;
    const half_h = (img_h * res) / 2;
    const xmin = center_x - half_w;
    const ymin = center_y - half_h;
    const xmax = center_x + half_w;
    const ymax = center_y + half_h;

    const corners_pts = [[
      [xmin, ymin],
      [xmin, ymax],
      [xmax, ymax],
      [xmax, ymin],
      [xmin, ymin] // closing if be used as print polygon...
    ]]

    const paperbox = new Polygon(corners_pts);
    const paperbox_Feature = new Feature(paperbox);

    paperBoxLayer.current.getSource().addFeature(paperbox_Feature);


  }

  useEffect(() => {
    drawPaperBox()

  }, [fields, restrictedScale, freeScale, selectedScaleMode, paperBox,
    mainMap.getView().calculateExtent()]);


  useEffect(() => {
    if (viewer?.config_json?.selected_menu != control.id) {
      if (copyGeometry.current) {
        const _drawTool = drawTool || "";
        if (_drawTool.toLocaleLowerCase() == "copy") {
          setDrawTool(null);
        }
      }
    }
  },  [viewer?.config_json?.selected_menu]);

  useEffect(() => {
    if (drawTool) {
      dispatch(actions.viewer_set_exclusive_mapcontrol(MAPCONTROL_NAME));
      addInteraction(drawTool);
    } else {
      if (draw) {
        mainMap.removeInteraction(draw);
        setDraw(null);
      }
      if (copyGeometry.current) copyGeometry.current.setActive(false);
      if (select.current) select.current.setActive(false);
      if (modify.current) modify.current.setActive(false);

      const olit = findOLInteraction(mainMap, OlInteractionDragPan);
      if (olit) olit.setActive(true);
    }
  }, [drawTool]);

  useEffect(() => {
    if (drawTool && exclusive_mapcontrol !== MAPCONTROL_NAME) {
      setDrawTool(null);
    }
  }, [exclusive_mapcontrol]);

  useEffect(() => {
    // CopyGeometry interaction
    const copyGeom = new OlInteractionSelect({
      condition: singleClick,
      hitTolerance: 5,
      wrapX: false,
      filter: (feature, layer) => {
        if (printLayer.current && layer.get('id') == printLayer.current.get('id')) return false;

        if (paperBoxLayer.current && layer.get('id') == paperBoxLayer.current.get('id')) return false;

        const _tool = drawingOptionsTools.find((opt) => {
          const geomType = feature.getGeometry().getType().toLowerCase();
          if (geomType.includes(opt)) {
            return true;
          }
        });

        if (!_tool) {
          // Clear the selection
          setTimeout(() => {
            copyGeometry.current.getFeatures().clear();
            mainMap.render();
          }, 500);

          notify.warn(t("copyGeometry", "Copiar geometria"),
            t("copyGeometryNotSupportedMsg", "O tipo de geometria não é permitido ({{type}}).", { type: feature.getGeometry().getType()}));

          return true;
        }

        confirmCopyFeatureGeometry(feature);
        return true;
      }
    });
    copyGeom.on('select', function (e) {
      mainMap.render();
    });
    mainMap.addInteraction(copyGeom);
    copyGeom.setActive(false);
    copyGeometry.current = copyGeom;

    // Select interaction
    const slct = new OlInteractionSelect({
      condition: singleClick,
      hitTolerance: 5,
      wrapX: false,
      filter: (feature, layer) => {
        if (layer.get('id') !== printLayer.current.get('id')) return false;
        return true;
      }
    });
    slct.on('select', function (e) {
      mainMap.render();
    });
    mainMap.addInteraction(slct);
    slct.setActive(false);
    select.current = slct;

    // Modify interaction
    const mdf = new OlInteractionModify({
      source: printLayer.current.getSource(),
      deleteCondition: (event) => {
        return singleClick(event) && platformModifierKeyOnly(event);
      }
    });
    mainMap.addInteraction(mdf);
    mdf.setActive(false);
    modify.current = mdf;

    mainMap.controls.forEach(function (control) {
      if (control.dragPan) {
        control.dragPan.deactivate();
      }
    });

    return () => {
      if (copyGeom) mainMap.removeInteraction(copyGeom);
      if (slct) mainMap.removeInteraction(slct);
      if (mdf) mainMap.removeInteraction(mdf);
    }
  }, [mainMap]);


  return (
    <div className="print-panel-item">
      <h3>{props.printItem.title}</h3>

      {(printItem.allow_drawing !== false) && <div className="p-fluid">
        <h4>{t("locationMarking", "Marcação do Local")}</h4>
        <DrawingToolbar
          availableTools={drawingOptionsTools}
          activeTool={drawTool}
          onSelectTool={selectDrawTool}
          onDeleteSelected={deletedSelectedFeature}
          onZoomAll={zoomFeaturesExtent}
          deleteTitle={t("deleteElement(s)", "Eliminar elemento(s)")}
        />
        {printItem.location_marking &&
          <Alert color={ geometryError === true ? "danger" : "informative" } py="xs" mt="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              {geometryError === true ? <IconXCircle /> : <IconInfoCircle />}
              <span>{t("locationMarkingMsg", "Deverá marcar no mapa a localização pretendida")}</span>
            </Group>
          </Alert>
        }
      </div>}

      {(scaleTabs.length > 0) &&
        <div className="p-fluid">
          <h4>{t("outputScale", "Escala de Saída")}</h4>
          <Tabs value={scaleTab} onChange={onScaleTabChange} keepMounted={false}>
            <Tabs.List>
              {scaleTabs.map(tab => <Tabs.Tab key={tab.key} value={tab.key}>{tab.label}</Tabs.Tab>)}
            </Tabs.List>
            {printItem.restrict_scales &&
              <Tabs.Panel value="predefined" pt="xs">
                <Select
                  aria-label={t("predefined", "Predefinida")}
                  data={(restrictScales || []).map(s => ({ value: String(s.value), label: s.label }))}
                  value={restrictedScale != null ? String(restrictedScale) : null}
                  onChange={v => { if (v != null) setRestrictedScale(parseInt(v, 10)); }}
                  allowDeselect={false}
                />
              </Tabs.Panel>}
            {printItem.free_scale &&
              <Tabs.Panel value="freescale" pt="xs">
                <NumberInput
                  aria-label={t("free", "Livre")}
                  hideControls
                  prefix="1:"
                  value={freeScale ?? ''}
                  onChange={(v) => setFreeScale(v === '' || v == null ? null : Number(v))}
                />
              </Tabs.Panel>}
            {printItem.map_scale &&
              <Tabs.Panel value="map" pt="xs">
                <Alert color="informative" py="xs">
                  <Group justify="center" gap="xs" wrap="nowrap">
                    <IconInfoCircle />
                    <span>{t("printMapScaleOptionMsg", "A planta será emitida em função da escala de visualização do mapa")}</span>
                  </Group>
                </Alert>
              </Tabs.Panel>}
          </Tabs>
        </div>}

      <div className="p-fluid">
        <h4>{t("format", "Formato")}</h4>
        <Select
          id="layout"
          aria-label={t("format", "Formato")}
          data={(formats || []).map(f => ({ value: f.format + '|' + f.orientation, label: f.label }))}
          value={fields.layout ? fields.layout.format + '|' + fields.layout.orientation : null}
          onChange={(v) => {
            const f = (formats || []).find(x => x.format + '|' + x.orientation === v);
            if (f) handleFieldChange({ target: { id: 'layout', value: f } });
          }}
          allowDeselect={false}
          placeholder={t("selectFormat", "Selecione um formato")} />
      </div>

      <PrintFormFields
        formFields={printItem.form_fields}
        fields={fields}
        handleFieldChange={handleFieldChange}
      />

      {isPrinting ?
        <Alert color="informative" py="xs" mt="lg">
          <Group justify="center" gap="xs" wrap="nowrap">
            <Loader size="xs" />
            <span>{t("generatingPrint", "A gerar a planta...")}</span>
          </Group>
        </Alert> : null
      }
      {!isPrinting && printFile ?
        <Alert color="informative" py="xs" mt="lg">
          <Group justify="center" gap="xs" wrap="nowrap">
            <a href={printFile.url} target="_blank" rel="noreferrer">
              <IconExternalLink className="pl-2 mr-1" />{t("openPrintPdf", "Abrir PDF da planta")}
            </a>
          </Group>
        </Alert> : null
      }

      <Group justify="space-between" mt="md">
        <div>
          {!standalone &&
            <Button
              size="xs"
              leftSection={<IconChevronLeft />}
              onClick={e => { goPanelPrintPrev(); }}
            >
              {t("back", "Voltar")}
            </Button>}
        </div>
        <Button
          size="xs"
          leftSection={<IconPrint />}
          onClick={e => { doPrint(); }}
          disabled={isPrinting}
        >
          {t("print", "Imprimir")}
        </Button>
      </Group>
      {config.showPreview ? <div className="mt-2">
        <Checkbox
          checked={paperBox}
          onChange={e => setPaperBox(e.currentTarget.checked)}
          label={t("showPrintArea", "Visualizar área de impressão")}
        />
      </div> : null}
    </div>
  )

}
