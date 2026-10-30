import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import i18next from "i18next";
import { ActionIcon, Badge, Button, ColorSwatch, Divider, Group, NumberInput, Paper, Popover, Select, SimpleGrid, Stack, Switch, Text, TextInput } from '@mantine/core';
import { DataGrid, notify, IconReplay, IconRefresh, IconTrash, IconDownload, IconSave, IconSearch, IconCopy } from '@scalargis/ui';
import { MapToolButton } from '../../components';
import { createGrid, createSizedShape, createSnap, createTransform, duplicateFeatures, HelpBox } from './editing';
import { getAppRootPath } from '../../utils/common';
import OlFormatGeoJSON from "ol/format/GeoJSON";
import OlInteractionDragPan from "ol/interaction/DragPan";
import OlInteractionDoubleClickZoom from "ol/interaction/DoubleClickZoom";
import OlInteractionPinchZoom from "ol/interaction/PinchZoom";
import OlInteractionDraw from "ol/interaction/Draw";
import OlInteractionModify from "ol/interaction/Modify";
import OlInteractionSelect from "ol/interaction/Select";
import { shiftKeyOnly, singleClick } from "ol/events/condition";
import OlCollection from "ol/Collection";
import { SketchPicker as CompactPicker } from 'react-color';
import FileSaver from 'file-saver';
import useDrawHistory from './useDrawHistory';
import './index.css';
import addSymbolIcon from './add-symbol.svg';
import addTextIcon from './add-text.svg';
import addPointIcon from './add-point.svg';
import addLineIcon from './add-line.svg';
import addPolygonIcon from './add-polygon.svg';
import selectFeatureIcon from './select-feature.svg';
import transformIcon from './transform.svg';
import squareIcon from './square.svg';
import rectangleIcon from './rectangle.svg';
import gridIcon from './grid.svg';

const drawElementsOptions = [
  { value: "symbol", title: "drawingAddSymbol", defaultTitle: "Adicionar símbolo", icon: () => <img src={addSymbolIcon} alt="" className="draw-tool-icon" /> },
  { value: "text", title: "drawingAddText", defaultTitle: "Adicionar texto", icon: () => <img src={addTextIcon} alt="" className="draw-tool-icon" /> },
  { value: "point", title: "drawingAddPoint", defaultTitle: "Adicionar ponto", icon: () => <img src={addPointIcon} alt="" className="draw-tool-icon" /> },
  { value: "line", title: "drawingAddLine", defaultTitle: "Adicionar linha", icon: () => <img src={addLineIcon} alt="" className="draw-tool-icon" /> },
  { value: "polygon", title: "drawingAddPoligon", defaultTitle: "Adicionar polígono", icon: () => <img src={addPolygonIcon} alt="" className="draw-tool-icon" /> }
];

const selectTools = [
  { value: "select", title: "select", defaultTitle: "Selecionar", icon: () => <img src={selectFeatureIcon} alt="" className="draw-tool-icon" /> },
  { value: "transform", title: "drawingTransform", defaultTitle: "Mover, rodar e escalar", icon: () => <img src={transformIcon} alt="" className="draw-tool-icon" /> }
]

const shapeTools = [
  { value: "square", title: "drawingSquare", defaultTitle: "Quadrado com lado definido", icon: () => <img src={squareIcon} alt="" className="draw-tool-icon" /> },
  { value: "rectangle", title: "drawingRectangle", defaultTitle: "Retângulo com medidas definidas", icon: () => <img src={rectangleIcon} alt="" className="draw-tool-icon" /> },
  { value: "grid", title: "drawingGrid", defaultTitle: "Grelha de células", icon: () => <img src={gridIcon} alt="" className="draw-tool-icon" /> }
];

const PLACEMENT_TOOLS = shapeTools.map(t => t.value);

const GRID_CELL_LIMIT = 1000;

const historyTools = [
  { value: "undo", title: "undo", defaultTitle: "Desfazer", icon: <IconReplay /> },
  { value: "redo", title: "redo", defaultTitle: "Refazer", icon: <IconRefresh /> },
  { value: "clear", title: "clearAll", defaultTitle: "Limpar tudo", icon: <IconTrash /> }
];

const colorTools = [
  { value: "fill", title: "fillColor", defaultTitle: "Côr de preenchimento" },
  { value: "stroke", title: "outlineColor", defaultTitle: "Côr de rebordo" }
];

const defaultExportFormats = [
  { value: "geojson", title: "GeoJSON", icon: <IconDownload />, tooltip: "Exportar para ficheiro GeoJSON" },
  { value: "gml", title: "GML", icon: <IconDownload />, tooltip: "Exportar para ficheiro GML" },
  { value: "shape", title: "ShapeFile", icon: <IconDownload />, tooltip: "Exportar para ficheiro ShapeFile" },
  { value: "kml", title: "KML", icon: <IconDownload />, tooltip: "Exportar para ficheiro KML" }
];

const typeLabels = {
  "Symbol": "symbol",
  "Text": "text",
  "Point": "point",
  "LineString": "linestring",
  "Polygon": "polygon"
};

const sizeOptions = ['1', '2', '3', '4', '5', '10', '15', '20'].map(v => ({ key: v, label: v, value: v }));

const symbolOptions = [
  { key: '1', label: 'circle', labelDefault: "círculo", value: 'circle' },
  { key: '2', label: 'square', labelDefault: "quadrado", value: 'square' },
  { key: '3', label: 'triangle', labelDefault: "triângulo", value: 'triangle' },
  { key: '4', label: 'estrela', labelDefault: "estrela", value: 'star' },
  { key: '5', label: 'cross', labelDefault: "cruz", value: 'cross' },
  { key: '10', label: 'x', labelDefault: "x", value: 'x' }
];

const textStyleOptions = [
  { key: '1', label: 'normal', value: 'normal' },
  { key: '2', label: 'italico', value: 'italic' },
  { key: '3', label: 'negrito', value: 'bold' },
];

const textSizeOptions = ['8px', '11px', '15px', '20px', '25px'].map((v, i) => ({ key: String(i + 1), label: v, value: v }));

const textFontOptions = [
  { key: '1', label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { key: '2', label: 'Georgia', value: 'Georgia, serif' },
];

const SELECTED_STROKE = { r: 255, g: 0, b: 0, a: 1 };

const STYLE_FIELDS = ['fill', 'stroke', 'size', 'symbol_type', 'text_style', 'text_size', 'text_font', 'text_value'];

const DOUBLE_CLICK_GUARD_MS = 350;

const DRAW_FLAGS = { draw_geom: false, draw_symbol: false, draw_text: false };

/** Drawing tools panel. */
function DrawTools({ record, viewer, actions, dispatch, mainMap, utils }) {
  const [panel, setPanel] = useState(() => ({
    enabled: true,
    fill: { r: '255', g: '255', b: '255', a: '1' },
    stroke: { r: '0', g: '0', b: '0', a: '1' },
    size: '2',
    symbol_type: 'x',
    text_style: 'normal',
    text_size: '20px',
    text_font: 'Arial, Helvetica, sans-serif',
    text_value: i18next.t('drawingSampleText', 'Exemplo de texto'),
    ...DRAW_FLAGS,
    displayFillPicker: false,
    displayStrokePicker: false,
    editing: null,
    transformCount: 0,
    shapeSide: 5,
    shapeWidth: 10,
    shapeHeight: 5,
    shapeRotation: 0,
    gridRows: 3,
    gridCols: 3,
    gridCell: 5,
    snap: false,
    selectedTool: null,
    page: 1,
    pageSize: 10
  }));
  const panelRef = useRef(panel);
  const propsRef = useRef({});
  propsRef.current = { viewer, actions, dispatch, mainMap, utils, record };

  const patch = useCallback((changes) => {
    panelRef.current = { ...panelRef.current, ...changes };
    setPanel(panelRef.current);
  }, []);

  const history = useDrawHistory({
    initial: viewer.config_json.drawings || [],
    dispatch,
    actions
  });

  const drawRef = useRef(null);
  const modifyRef = useRef(null);
  const transformRef = useRef(null);
  const snapRef = useRef(null);
  const highlightedRef = useRef([]);
  const oldSelectRef = useRef([]);
  const zoomTimerRef = useRef(null);
  const placementRef = useRef(null);
  const handlersRef = useRef({});

  const showShapes = !(record.config_json && record.config_json.show_shapes === false);

  const exportFormats = useMemo(() => {
    const componentCfg = record.config_json;
    const viewerCfg = viewer && viewer.config_json;
    if (componentCfg && componentCfg.exclude_export_formats && componentCfg.exclude_export_formats.length) {
      return defaultExportFormats.filter(t => !componentCfg.exclude_export_formats.includes(t.value));
    }
    if (viewerCfg && viewerCfg.exclude_export_formats) {
      return defaultExportFormats.filter(t => !viewerCfg.exclude_export_formats.includes(t.value));
    }
    return [...defaultExportFormats];
  }, [record, viewer && viewer.config_json && viewer.config_json.exclude_export_formats]);

  const select = useMemo(() => {
    const interaction = new OlInteractionSelect({
      condition: singleClick,
      hitTolerance: 5,
      wrapX: false,
      filter: (feature, layer) => !!layer && layer.get('id') === 'userlayer'
    });
    interaction.on('select', (e) => handlersRef.current.onSelect(e));
    return interaction;
  }, []);

  const onModifyEnd = useCallback((e) => handlersRef.current.modifyEnd(e), []);

  const getMap = () => propsRef.current.mainMap;

  const getSource = () => {
    const { mainMap: map, utils: u } = propsRef.current;
    const layer = u.findOlLayer(map, 'userlayer');
    return layer ? layer.getSource() : null;
  };

  const findInteraction = (classname) => {
    let result = false;
    getMap().getInteractions().forEach((item) => {
      if (item instanceof classname) result = item;
    });
    return result;
  };

  const setNavigation = (active) => {
    clearTimeout(zoomTimerRef.current);
    [OlInteractionDragPan, OlInteractionDoubleClickZoom, OlInteractionPinchZoom].forEach(cls => {
      const interaction = findInteraction(cls);
      if (interaction) interaction.setActive(active);
    });
  };

  const restoreNavigation = () => {
    setNavigation(true);
    const zoomInteraction = findInteraction(OlInteractionDoubleClickZoom);
    if (zoomInteraction) {
      zoomInteraction.setActive(false);
      zoomTimerRef.current = setTimeout(() => zoomInteraction.setActive(true), DOUBLE_CLICK_GUARD_MS);
    }
  };

  const currentDrawings = () => propsRef.current.viewer.config_json.drawings;

  const viewCrs = () => getMap().getView().getProjection().getCode();

  const createFeatureStyle = (feature, stroke) => {
    const u = propsRef.current.utils;
    const props = feature.getProperties();
    const { symbol_type, size, fill, text_style, text_size, text_font, text_value } = props.state;
    let style = u.createDrawingStyle(feature.getGeometry().getType(), size, fill, stroke);
    if (props.type === 'Symbol') {
      style = u.createDrawingSymbol(symbol_type, size, fill, stroke);
    }
    if (props.type === 'Text') {
      style = u.createDrawingText(feature, size, fill, stroke, text_style, text_size, text_font, text_value);
    }
    return style;
  };

  const restyle = (feature, stroke) => {
    if (feature.get('state')) feature.setStyle(createFeatureStyle(feature, stroke));
  };

  const syncSnap = () => {
    if (!snapRef.current) {
      snapRef.current = createSnap({ map: getMap(), getDrawingsSource: getSource });
    }
    snapRef.current.setEnabled(panelRef.current.snap);
    snapRef.current.refresh({ draw: drawRef.current });
  };

  const toggleSnap = (event) => {
    patch({ snap: event.currentTarget.checked });
    syncSnap();
  };

  const removeModify = () => {
    if (modifyRef.current) {
      modifyRef.current.un('modifyend', onModifyEnd);
      getMap().removeInteraction(modifyRef.current);
      modifyRef.current = null;
    }
  };

  const clearSelection = () => {
    removeModify();
    select.getFeatures().clear();
    if (transformRef.current) transformRef.current.clear();
  };

  const ensureTransform = () => {
    if (!transformRef.current) {
      transformRef.current = createTransform({
        map: getMap(),
        source: { hasFeature: (feature) => !!getSource() && getSource().hasFeature(feature) },
        onStart: () => history.seal(),
        onSelect: (features) => handlersRef.current.transformSelect(features),
        onChange: (features) => handlersRef.current.transformChange(features)
      });
    }
    return transformRef.current;
  };

  const stopTransform = () => {
    if (transformRef.current) {
      transformRef.current.setActive(false);
      highlightTransform([]);
    }
    if (panelRef.current.transformCount) patch({ transformCount: 0 });
  };

  const serializeFeatures = (features) => {
    const { utils: u } = propsRef.current;
    const crs = viewCrs();
    return features.map(feature => u.serializeDrawing(feature, { ...feature.get('state') }, crs));
  };

  const highlightTransform = (features) => {
    highlightedRef.current.forEach(feature => {
      if (!features.includes(feature)) restyle(feature, feature.get('state') && feature.get('state').stroke);
    });
    features.forEach(feature => restyle(feature, SELECTED_STROKE));
    highlightedRef.current = features.slice();
  };

  handlersRef.current.transformSelect = (features) => {
    highlightTransform(features);
    patch({ transformCount: features.length });
  };

  const deleteTransformSelection = () => {
    if (!transformRef.current) return;
    const ids = transformRef.current.getSelection().map(feature => feature.get('id'));
    if (!ids.length) return;
    clearSelection();
    history.seal();
    history.commit(currentDrawings().filter(d => !ids.includes(d.id)));
  };

  handlersRef.current.transformChange = (features) => {
    const byId = {};
    serializeFeatures(features).forEach(geojson => { byId[geojson.id] = geojson; });
    history.commit(currentDrawings().map(d => byId[d.id] || d));
  };

  const duplicateSelected = () => {
    const { utils: u } = propsRef.current;
    const source = getSource();
    const inTransform = panelRef.current.selectedTool === 'transform' && transformRef.current;
    const features = inTransform ? transformRef.current.getSelection() : select.getFeatures().getArray().slice();
    if (!source || !features.length) return;
    history.seal();
    duplicateFeatures({
      map: getMap(),
      source,
      features,
      onChange: (clones) => {
        const geojsons = serializeFeatures(clones);
        clones.forEach(clone => clone.setStyle(u.createStyle(clone, clone.get('state'))));
        history.commit([...currentDrawings(), ...geojsons]);
        if (inTransform) {
          transformRef.current.selectFeatures(clones);
        } else {
          select.getFeatures().clear();
          select.getFeatures().extend(clones);
          handlersRef.current.onSelect({ selected: clones, deselected: features });
        }
      }
    });
  };

  const selectedDrawings = () => select.getFeatures().getArray().filter(feature => feature.get('state'));

  const updateStyle = (features, changes) => {
    const { utils: u } = propsRef.current;
    const crs = viewCrs();
    const fields = Object.keys(changes).filter(k => STYLE_FIELDS.includes(k));
    const byId = {};
    features.forEach(feature => {
      const state = { ...feature.get('state') };
      fields.forEach(k => { state[k] = changes[k]; });
      feature.setStyle(u.createStyle(feature, state, SELECTED_STROKE));
      const geojson = u.serializeDrawing(feature, state, crs);
      byId[geojson.id] = geojson;
    });
    history.commit(currentDrawings().map(d => byId[d.id] || d), `style:${Object.keys(byId).join(',')}`);
  };

  const styleChange = (changes) => {
    patch(changes);
    const features = selectedDrawings();
    if (features.length) updateStyle(features, changes);
  };

  const editFeature = (feature) => {
    removeModify();
    patch({
      editing: { ids: [feature.get('id')], type: feature.get('type') },
      ...feature.get('state')
    });
    const features = new OlCollection();
    features.push(feature);
    const modify = new OlInteractionModify({
      features,
      deleteCondition: (event) => shiftKeyOnly(event) && singleClick(event)
    });
    modify.on('modifyend', onModifyEnd);
    getMap().addInteraction(modify);
    modify.setActive(true);
    modifyRef.current = modify;
    syncSnap();
  };

  handlersRef.current.modifyEnd = (e) => {
    const { utils: u } = propsRef.current;
    const crs = viewCrs();
    const byId = {};
    e.features.forEach(feature => {
      const state = { ...feature.get('state') };
      feature.setStyle(u.createStyle(feature, state, SELECTED_STROKE));
      const geojson = u.serializeDrawing(feature, state, crs);
      byId[geojson.id] = geojson;
    });
    history.commit(currentDrawings().map(d => byId[d.id] || d));
  };

  handlersRef.current.onSelect = (e) => {
    const { selected, deselected } = e;
    history.seal();
    if (selected) {
      selected.forEach(feature => {
        if (feature.get('state')) {
          if (!oldSelectRef.current.includes(feature)) oldSelectRef.current.push(feature);
          restyle(feature, SELECTED_STROKE);
        }
      });
    }
    if (deselected) {
      deselected.forEach(feature => {
        if (feature.get('state')) restyle(feature, feature.get('state').stroke);
      });
    }
    if (!selected && !deselected) {
      oldSelectRef.current.forEach(feature => {
        if (feature.get('state')) restyle(feature, feature.get('state').stroke);
      });
      oldSelectRef.current = [];
    }
    const features = selectedDrawings();
    if (features.length === 0) {
      removeModify();
      patch({ ...DRAW_FLAGS, editing: null });
    } else if (features.length === 1) {
      editFeature(features[0]);
    } else {
      removeModify();
      patch({
        ...DRAW_FLAGS,
        draw_symbol: features.every(feature => feature.get('type') === 'Symbol'),
        draw_text: features.every(feature => feature.get('type') === 'Text'),
        editing: { ids: features.map(feature => feature.get('id')) }
      });
    }
  };

  const stopPlacement = () => {
    if (placementRef.current) {
      getMap().un('singleclick', placementRef.current);
      placementRef.current = null;
    }
  };

  const commitPlaced = (features) => {
    const { utils: u } = propsRef.current;
    const state = { ...panelRef.current, ...DRAW_FLAGS, draw_geom: true };
    const crs = viewCrs();
    const geojsons = features.map(feature => u.serializeDrawing(feature, state, crs));
    history.seal();
    history.commit([...currentDrawings(), ...geojsons]);
  };

  const placeShape = (event) => {
    const current = panelRef.current;
    const centre = event.coordinate.slice();
    const rotation = Number(current.shapeRotation) || 0;
    const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
    const map = getMap();
    let build;
    let count = 1;
    let valid;
    if (current.selectedTool === 'square') {
      valid = positive(current.shapeSide);
      build = () => createSizedShape({ map, centre, width: Number(current.shapeSide), height: Number(current.shapeSide), rotation });
    } else if (current.selectedTool === 'rectangle') {
      valid = positive(current.shapeWidth) && positive(current.shapeHeight);
      build = () => createSizedShape({ map, centre, width: Number(current.shapeWidth), height: Number(current.shapeHeight), rotation });
    } else {
      const rows = Math.floor(Number(current.gridRows));
      const cols = Math.floor(Number(current.gridCols));
      valid = rows >= 1 && cols >= 1 && positive(current.gridCell);
      count = rows * cols;
      build = () => createGrid({ map, centre, rows, cols, cellSize: Number(current.gridCell), rotation });
    }
    if (!valid) {
      notify.error(i18next.t("error", "Erro"), i18next.t("drawingShapeInvalid", "Indique valores maiores que zero."));
      return;
    }
    if (count > GRID_CELL_LIMIT) {
      notify.error(
        i18next.t("error", "Erro"),
        i18next.t("drawingGridLimit", "A grelha tem {count} células. O limite é {limit} células.")
          .replace('{count}', count).replace('{limit}', GRID_CELL_LIMIT)
      );
      return;
    }
    commitPlaced(build());
  };

  const startPlacement = () => {
    stopPlacement();
    placementRef.current = (event) => placeShape(event);
    getMap().on('singleclick', placementRef.current);
  };

  const stopDraw = () => {
    stopPlacement();
    if (drawRef.current) {
      getMap().removeInteraction(drawRef.current);
      drawRef.current = null;
      syncSnap();
    }
  };

  const addInteraction = (type) => {
    const { actions: act, dispatch: dsp, utils: u } = propsRef.current;
    stopDraw();
    const draw = new OlInteractionDraw({ features: new OlCollection(), type });
    drawRef.current = draw;
    setNavigation(false);
    dsp(act.viewer_set_exclusive_mapcontrol('DrawTools'));
    getMap().addInteraction(draw);
    syncSnap();
    draw.on('drawend', (e) => {
      const geojson = u.serializeDrawing(e.feature, panelRef.current, viewCrs());
      history.commit([...currentDrawings(), geojson]);
      patch({ selectedTool: null, ...DRAW_FLAGS });
      stopDraw();
      restoreNavigation();
      dsp(act.viewer_set_exclusive_mapcontrol(null));
    });
  };

  const startDraw = (e, type) => {
    e.preventDefault();
    e.target.blur();

    if (type === panelRef.current.selectedTool) {
      if (type === 'transform') {
        stopTransform();
      } else if (type === 'select') {
        select.setActive(false);
      } else {
        stopDraw();
        setNavigation(true);
      }
      patch({ selectedTool: null, ...DRAW_FLAGS });
      dispatch(actions.viewer_set_exclusive_mapcontrol(null));
      return;
    }

    history.seal();

    if (type === 'transform') {
      const kept = selectedDrawings();
      if (panelRef.current.editing) finishEditing();
      stopDraw();
      setNavigation(true);
      select.setActive(false);
      patch({ selectedTool: type, ...DRAW_FLAGS, editing: null });
      ensureTransform().setActive(true);
      if (kept.length) transformRef.current.selectFeatures(kept);
      syncSnap();
      dispatch(actions.viewer_set_exclusive_mapcontrol('DrawTools'));
      return;
    }

    const keptFromTransform = type === 'select' && transformRef.current ? transformRef.current.getSelection() : [];
    stopTransform();

    if (PLACEMENT_TOOLS.includes(type)) {
      stopDraw();
      setNavigation(true);
      select.setActive(false);
      patch({ selectedTool: type, ...DRAW_FLAGS, editing: null });
      startPlacement();
      dispatch(actions.viewer_set_exclusive_mapcontrol('DrawTools'));
      return;
    }

    if (type === 'select') {
      patch({ selectedTool: type, ...DRAW_FLAGS });
      select.setActive(true);
      if (keptFromTransform.length) {
        select.getFeatures().extend(keptFromTransform);
        handlersRef.current.onSelect({ selected: keptFromTransform, deselected: [] });
      }
      stopDraw();
      dispatch(actions.viewer_set_exclusive_mapcontrol('DrawTools'));
      return;
    }

    patch({ selectedTool: type });
    select.setActive(false);
    switch (type) {
      case 'symbol':
        patch({ ...DRAW_FLAGS, draw_symbol: true, editing: null });
        addInteraction('Point');
        break;
      case 'text':
        patch({ ...DRAW_FLAGS, draw_text: true, editing: null });
        addInteraction('Point');
        break;
      case 'line':
        patch({ ...DRAW_FLAGS, draw_geom: true, editing: null });
        addInteraction('LineString');
        break;
      case 'polygon':
        patch({ ...DRAW_FLAGS, draw_geom: true, editing: null });
        addInteraction('Polygon');
        break;
      default:
        patch({ ...DRAW_FLAGS, draw_geom: true, editing: null });
        addInteraction('Point');
    }
  };

  const clickUndo = (e) => {
    e.preventDefault();
    clearSelection();
    patch({ editing: null });
    history.undo();
  };

  const clickRedo = (e) => {
    e.preventDefault();
    clearSelection();
    patch({ editing: null });
    history.redo();
  };

  const clickClear = (e) => {
    e.preventDefault();
    clearSelection();
    history.clear();
    patch({ editing: null });
  };

  const removeFeature = () => {
    const { editing } = panelRef.current;
    if (editing) {
      clearSelection();
      history.commit(currentDrawings().filter(d => !editing.ids.includes(d.id)));
    }
    patch({ ...DRAW_FLAGS, editing: null });
  };

  const deleteItem = (item) => {
    clearSelection();
    patch({ ...DRAW_FLAGS, editing: null });
    history.commit(currentDrawings().filter(d => d.id !== item.id));
  };

  const finishEditing = () => {
    select.getFeatures().clear();
    select.dispatchEvent('select');
  };

  const disableTools = () => {
    const current = panelRef.current;
    if (current.selectedTool) {
      stopDraw();
      setNavigation(true);
    }
    if (current.editing) finishEditing();
    stopTransform();
    removeModify();
    patch({ enabled: false, selectedTool: null, ...DRAW_FLAGS, editing: null });
  };

  const selectedMenu = viewer.config_json.selected_menu;
  const exclusive = viewer.exclusive_mapcontrol;

  useEffect(() => {
    const active = selectedMenu === 'drawtools' && exclusive === 'DrawTools';
    if (panelRef.current.enabled && !active) {
      disableTools();
    } else if (!panelRef.current.enabled && active) {
      patch({ enabled: true });
    }
    if (panelRef.current.selectedTool && selectedMenu !== 'drawtools') {
      select.setActive(false);
      stopTransform();
      patch({ selectedTool: null });
    }
  }, [selectedMenu, exclusive, panel.enabled, panel.selectedTool]);

  useEffect(() => {
    const map = mainMap;
    map.addInteraction(select);
    select.setActive(false);
    return () => {
      map.removeInteraction(select);
      if (transformRef.current) {
        transformRef.current.dispose();
        transformRef.current = null;
      }
      removeModify();
      stopDraw();
      if (snapRef.current) {
        snapRef.current.dispose();
        snapRef.current = null;
      }
      setNavigation(true);
    };
  }, [mainMap]);

  const download = (format) => {
    const { viewer: v, record: rec, mainMap: map } = propsRef.current;
    const componentCfg = rec ? rec.config_json : null;
    const source = getSource();
    const features = source ? source.getFeatures() : [];

    let crs = 4326;
    if (componentCfg && componentCfg.export_crs) {
      crs = componentCfg.export_crs;
    } else if (v.config_json && v.config_json.export_crs) {
      crs = v.config_json.export_crs;
    } else if (v.config_json && v.config_json.display_crs) {
      crs = v.config_json.display_crs;
    }

    const serializer = new OlFormatGeoJSON();
    const json = serializer.writeFeaturesObject(features, {
      dataProjection: 'EPSG:' + crs,
      featureProjection: map.getView().getProjection().getCode(),
      decimals: 6
    });
    json.crs = {
      "type": "name",
      "properties": { "name": "urn:ogc:def:crs:EPSG::" + crs }
    };

    if (format === 'geojson') {
      const file = new Blob([JSON.stringify(json)], { type: 'application/json' });
      FileSaver.saveAs(file, 'export.geojson');
      return;
    }

    const url = `${getAppRootPath()}/spatial_toolbox/api/export`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ geojson: json, format, crs })
    }).then(res => {
      if (!res.ok) throw new Error('export failed');
      return res.blob();
    }).then(blob => {
      const ext = format === 'shape' ? 'zip' : format;
      FileSaver.saveAs(blob, `export.${ext}`);
    }).catch((error) => {
      console.error(error);
      notify.error(
        i18next.t("error", "Erro"),
        i18next.t("exportError", "Não foi possível exportar os elementos.")
      );
    });
  };

  const zoom = (item) => {
    const features = parseOlFeatures(JSON.stringify(item), viewCrs());
    if (features.length) {
      getMap().getView().fit(features[0].getGeometry());
    }
  };

  const {
    draw_text,
    draw_symbol,
    size,
    fill,
    stroke,
    symbol_type,
    text_style,
    text_size,
    text_font,
    text_value,
    editing,
    transformCount,
    selectedTool,
    pageSize
  } = panel;

  const drawings = viewer.config_json.drawings;
  const totalPages = Math.max(1, Math.ceil(drawings.length / pageSize));
  const page = Math.min(panel.page, totalPages);
  const pageRecords = drawings.slice((page - 1) * pageSize, page * pageSize);

  const numberField = (name, label, props) => (
    <NumberInput
      key={name}
      size="xs"
      label={label}
      aria-label={label}
      value={panel[name]}
      onChange={(value) => patch({ [name]: value })}
      hideControls
      {...props}
    />
  );

  const toolButton = (opt) => (
    <MapToolButton
      key={opt.value}
      size="lg"
      variant={opt.value === selectedTool ? 'filled' : 'default'}
      active={opt.value === selectedTool}
      title={i18next.t(opt.title, opt.defaultTitle)}
      onClick={(e) => startDraw(e, opt.value)}
    >
      {opt.icon()}
    </MapToolButton>
  );

  const section = (label, children) => (
    <Stack gap={4} className="draw-section">
      <Text className="draw-section-label">{label}</Text>
      <Group gap={4} wrap="nowrap">{children}</Group>
    </Stack>
  );

  const colorButton = (opt) => {
    const isFill = opt.value === 'fill';
    const opened = isFill ? panel.displayFillPicker : panel.displayStrokePicker;
    const pickerColor = isFill ? fill : stroke;
    const swatch = `rgba(${pickerColor.r}, ${pickerColor.g}, ${pickerColor.b}, ${pickerColor.a})`;
    const onToggle = () => patch(isFill
      ? { displayFillPicker: !panel.displayFillPicker, displayStrokePicker: false }
      : { displayStrokePicker: !panel.displayStrokePicker, displayFillPicker: false });
    const onClose = () => patch(isFill ? { displayFillPicker: false } : { displayStrokePicker: false });
    const onColorChange = (color) => styleChange(isFill ? { fill: color.rgb } : { stroke: color.rgb });
    return (
      <Popover
        key={opt.value}
        opened={opened}
        onChange={(isOpened) => { if (!isOpened) onClose(); }}
        position="bottom-start"
        withinPortal
        shadow="md"
        trapFocus={false}
      >
        <Popover.Target>
          <ActionIcon
            size="lg"
            variant="default"
            title={i18next.t(opt.title, opt.defaultTitle)}
            aria-label={i18next.t(opt.title, opt.defaultTitle)}
            onClick={() => onToggle()}
          >
            {isFill
              ? <ColorSwatch size={18} radius={4} color={swatch} />
              : <span className="draw-stroke-swatch" style={{ borderColor: swatch }} />}
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown p={0}>
          <CompactPicker color={pickerColor} onChange={onColorChange} />
        </Popover.Dropdown>
      </Popover>
    );
  };

  const historyButton = (opt) => (
    <MapToolButton
      key={opt.value}
      size="lg"
      variant={opt.value !== "clear" ? "default" : "light"}
      color={opt.value !== "clear" ? undefined : "danger"}
      icon={opt.icon}
      title={i18next.t(opt.title, opt.defaultTitle)}
      onClick={(e) => {
        switch (opt.value) {
          case 'undo': clickUndo(e); break;
          case 'redo': clickRedo(e); break;
          case 'clear': clickClear(e); break;
          default: ;
        }
      }}
    />
  );

  return (
    <div id="drawtools">

      <Paper withBorder radius="md" p="sm" className="toolbar">
        <Stack gap="sm">

          {section(i18next.t("drawingSectionDraw", "Desenhar"), drawElementsOptions.map(toolButton))}

          <Group gap={12} wrap="wrap" align="flex-start">
            {showShapes ? section(i18next.t("drawingSectionShapes", "Formas"), shapeTools.map(toolButton)) : null}
            {section(i18next.t("drawingSectionEdit", "Editar"), selectTools.map(toolButton))}
          </Group>

          <Group gap={12} wrap="wrap" align="flex-start">
            {section(i18next.t("drawingSectionStyle", "Estilo"), (
              <>
                {colorTools.map(colorButton)}
                <Select
                  size="sm"
                  w={56}
                  title={i18next.t("drawingLineSymbolSize", "Tamanho da linha/símbolo")}
                  aria-label={i18next.t("drawingLineSymbolSize", "Tamanho da linha/símbolo")}
                  value={size}
                  data={sizeOptions}
                  onChange={value => styleChange({ size: value })}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: true }}
                />
              </>
            ))}
            {section(i18next.t("drawingSectionHistory", "Histórico"), historyTools.map(historyButton))}
          </Group>

          <Divider />

          <Switch
            size="xs"
            checked={panel.snap}
            onChange={toggleSnap}
            label={i18next.t("drawingSnap", "Atrair para desenhos e camadas")}
          />

        </Stack>
      </Paper>

      <HelpBox tool={selectedTool || 'none'} />

      {PLACEMENT_TOOLS.includes(selectedTool) ? (
        <Paper withBorder radius="md" p="sm" mt="sm" className="draw-shape-inputs">
          <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
            {selectedTool === 'square' ? numberField('shapeSide', i18next.t("drawingSide", "Lado (m)"), { min: 0.01, decimalScale: 2 }) : null}
            {selectedTool === 'rectangle' ? numberField('shapeWidth', i18next.t("drawingWidth", "Largura (m)"), { min: 0.01, decimalScale: 2 }) : null}
            {selectedTool === 'rectangle' ? numberField('shapeHeight', i18next.t("drawingHeight", "Altura (m)"), { min: 0.01, decimalScale: 2 }) : null}
            {selectedTool === 'grid' ? numberField('gridRows', i18next.t("drawingRows", "Linhas"), { min: 1, decimalScale: 0 }) : null}
            {selectedTool === 'grid' ? numberField('gridCols', i18next.t("drawingCols", "Colunas"), { min: 1, decimalScale: 0 }) : null}
            {selectedTool === 'grid' ? numberField('gridCell', i18next.t("drawingCellSize", "Célula (m)"), { min: 0.01, decimalScale: 2 }) : null}
            {numberField('shapeRotation', i18next.t("drawingRotation", "Rotação (°)"), { decimalScale: 2 })}
          </SimpleGrid>
        </Paper>
      ) : null}

      {selectedTool === 'transform' && transformCount > 0 ? (
        <Group gap="xs" mt="sm">
          <Button
            type="button"
            size="sm"
            leftSection={<IconCopy />}
            title={i18next.t("drawingDuplicate", "Duplicar")}
            onClick={() => duplicateSelected()}
          >
            {i18next.t("drawingDuplicate", "Duplicar")}
          </Button>
          <MapToolButton
            size="input-sm"
            variant="light"
            color="danger"
            icon={<IconTrash />}
            title={i18next.t("drawingDeleteSelection", "Apagar seleção")}
            onClick={() => deleteTransformSelection()}
          />
        </Group>
      ) : null}

      {editing ? (
        <Paper withBorder radius="md" p="sm" mt="sm">
          <Text size="sm" fw={600} mb="xs">
            {editing.ids.length > 1
              ? i18next.t("drawingSelectedCount", "{count} desenhos selecionados").replace('{count}', editing.ids.length)
              : `${i18next.t("drawingEditing", "A editar")} ${i18next.t(typeLabels[editing.type], editing.type).toLocaleLowerCase()}`}
          </Text>
          <Group gap="xs">
            <Button
              type="button"
              size="sm"
              leftSection={<IconSave />}
              title="Aplicar alterações"
              onClick={() => finishEditing()}
            >
              Aplicar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="default"
              leftSection={<IconCopy />}
              title={i18next.t("drawingDuplicate", "Duplicar")}
              onClick={() => duplicateSelected()}
            >
              {i18next.t("drawingDuplicate", "Duplicar")}
            </Button>
            <MapToolButton
              size="input-sm"
              variant="light"
              color="danger"
              icon={<IconTrash />}
              title={editing.ids.length > 1 ? i18next.t("drawingDeleteSelection", "Apagar seleção") : "Apagar desenho"}
              onClick={() => removeFeature()}
            />
          </Group>
        </Paper>
      ) : null}

      {draw_symbol ? (
        <Paper withBorder radius="md" p="sm" mt="sm">
          <Text size="sm" fw={600} mb="xs">{i18next.t("drawingSymbolOptions", "Opções de Simbologia")}</Text>
          <Select
            size="xs"
            title={i18next.t("drawingSelectSymbol", "Escolha o Símbolo")}
            aria-label={i18next.t("drawingSelectSymbol", "Escolha o Símbolo")}
            value={symbol_type}
            data={symbolOptions.map(o => { return { ...o, "label": i18next.t(o.label, o.labelDefault) } })}
            onChange={value => styleChange({ symbol_type: value })}
            allowDeselect={false}
          />
        </Paper>
      ) : null}

      {draw_text ? (
        <Paper withBorder radius="md" p="sm" mt="sm">
          <Text size="sm" fw={600} mb="xs">{i18next.t("textOptions", "Opções de Texto")}</Text>
          <Stack gap="xs">
            <TextInput
              size="sm"
              label={i18next.t("textLabel", "Texto para a etiqueta")}
              value={text_value}
              onChange={e => styleChange({ text_value: e.target.value })}
              title={i18next.t("textLabel", "Texto para a etiqueta")}
              aria-label={i18next.t("textLabel", "Texto para a etiqueta")}
              placeholder={i18next.t("drawingInsertTextMsg", "Introduza o texto...")}
              onClick={e => e.target.select()}
            />
            <SimpleGrid cols={2} spacing="xs">
              <Select
                size="sm"
                label={i18next.t("textStyle", "Estilo do Texto")}
                title={i18next.t("textStyle", "Estilo do Texto")}
                aria-label={i18next.t("textStyle", "Estilo do Texto")}
                value={text_style}
                data={textStyleOptions}
                onChange={value => styleChange({ text_style: value })}
                allowDeselect={false}
              />
              <Select
                size="sm"
                label={i18next.t("textSize", "Tamanho do Texto")}
                title={i18next.t("textSize", "Tamanho do Texto")}
                aria-label={i18next.t("textSize", "Tamanho do Texto")}
                value={text_size}
                data={textSizeOptions}
                onChange={value => styleChange({ text_size: value })}
                allowDeselect={false}
              />
            </SimpleGrid>
            <Select
              size="sm"
              label={i18next.t("fontType", "Tipo de Letra")}
              title={i18next.t("fontType", "Tipo de Letra")}
              aria-label={i18next.t("fontType", "Tipo de Letra")}
              value={text_font}
              data={textFontOptions}
              onChange={value => styleChange({ text_font: value })}
              allowDeselect={false}
            />
          </Stack>
        </Paper>
      ) : null}

      {drawings.length > 0 ? (
        <Stack gap={4} mt="md" className="draw-section">
          <Text className="draw-section-label">{i18next.t("drawingSectionExport", "Exportar")}</Text>
          <Group gap={6}>
            {exportFormats.map(opt =>
              <Button
                key={opt.value}
                type="button"
                size="compact-sm"
                variant="light"
                leftSection={opt.icon}
                title={opt.tooltip}
                onClick={() => download(opt.value)}
              >
                {opt.title}
              </Button>
            )}
          </Group>
        </Stack>
      ) : null}

      <Divider my="md" />

      <Group gap="xs" mb="xs">
        <Text size="sm" fw={600}>{i18next.t("drawings", "Desenhos")}</Text>
        {drawings.length > 0 ? <Badge size="sm" variant="light" radius="sm">{drawings.length}</Badge> : null}
      </Group>

      {drawings.length === 0 ? (
        <Text size="sm" c="dimmed">{i18next.t("noDrawings", "Não existem desenhos")}</Text>
      ) : (
        <DataGrid
          idAccessor="id"
          records={pageRecords}
          columns={[
            {
              accessor: 'properties.id',
              title: 'ID',
              render: (row, index) => (page - 1) * pageSize + index + 1,
            },
            {
              accessor: 'properties.type',
              title: i18next.t("type", "Tipo"),
              render: row => i18next.t(typeLabels[row.properties.type], row.properties.type),
            },
            {
              accessor: 'actions',
              title: '',
              textAlign: 'right',
              render: row => (
                <Group gap={4} justify="flex-end" wrap="nowrap">
                  <MapToolButton
                    variant="subtle"
                    radius="xl"
                    size="md"
                    icon={<IconSearch />}
                    title={i18next.t("locate", "Localizar")}
                    onClick={() => zoom(row)}
                  />
                  <MapToolButton
                    variant="subtle"
                    color="danger"
                    radius="xl"
                    size="md"
                    icon={<IconTrash />}
                    title={i18next.t("delete", "Eliminar")}
                    onClick={() => deleteItem(row)}
                  />
                </Group>
              ),
            },
          ]}
          totalRecords={drawings.length}
          page={page}
          onPageChange={(p) => patch({ page: p })}
          recordsPerPage={pageSize}
          recordsPerPageOptions={[5, 10, 25]}
          onRecordsPerPageChange={(s) => patch({ pageSize: s, page: 1 })}
          recordsPerPageLabel="Registos"
          paginationText={({ from, to, totalRecords: total }) =>
            i18next.t("drawingElementsPageInfo", "Mostrando {first} a {last} de {totalRecords} items")
              .replace('{first}', from).replace('{last}', to).replace('{totalRecords}', total)}
        />
      )}

    </div>
  );
}

function parseOlFeatures(data, projection) {
  const parser = new OlFormatGeoJSON();
  const parseOptions = {
    dataProjection: projection,
    featureProjection: projection
  };
  let features = parser.readFeatures(data, parseOptions);
  features = features instanceof OlCollection ? features.getArray() : features;
  return features;
}

export default DrawTools;
