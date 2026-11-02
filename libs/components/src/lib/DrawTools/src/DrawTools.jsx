import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import i18next from "i18next";
import { ActionIcon, Badge, Button, ColorSwatch, Divider, Group, Menu, NumberInput, Paper, Popover, SegmentedControl, Select, SimpleGrid, Stack, Switch, Text, TextInput } from '@mantine/core';
import { DataGrid, notify, IconReplay, IconRefresh, IconTrash, IconDownload, IconSave, IconSearch, IconCopy, IconEllipsisV, IconArrowUp, IconArrowDown } from '@scalargis/ui';
import { MapToolButton } from '../../components';
import { createBoxSelect, createGrid, createSizedShape, createSnap, createTransform, duplicateFeatures, HelpBox } from './editing';
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
import OlStyle from "ol/style/Style";
import OlStyleStroke from "ol/style/Stroke";
import OlStyleCircle from "ol/style/Circle";
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

const lineStyleOptions = [
  { value: 'solid', label: 'drawingLineSolid', labelDefault: 'Contínua', dash: undefined, cap: 'butt' },
  { value: 'dashed', label: 'drawingLineDashed', labelDefault: 'Tracejada', dash: '6 4', cap: 'butt' },
  { value: 'dotted', label: 'drawingLineDotted', labelDefault: 'Pontilhada', dash: '0 5', cap: 'round' }
];

/** A short line drawn in the pattern of a line style option. */
const LineStylePreview = ({ option }) => {
  const name = i18next.t(option.label, option.labelDefault);
  return (
    <span title={name} aria-label={name} style={{ display: 'flex', alignItems: 'center' }}>
      <svg width="26" height="10" aria-hidden="true">
        <line x1="2" y1="5" x2="24" y2="5" stroke="currentColor" strokeWidth="2.5" strokeDasharray={option.dash} strokeLinecap={option.cap} />
      </svg>
    </span>
  );
};

const SELECTED_STROKE = { r: 255, g: 0, b: 0, a: 1 };

const HIGHLIGHT_COLOR = 'rgba(255, 153, 0, 0.9)';

const HIGHLIGHT_FLASH_MS = 2000;

/** The fixed number of a drawing, or null when it has none. */
const drawingNum = (drawing) => {
  const num = drawing && drawing.properties ? drawing.properties.num : undefined;
  return Number.isInteger(num) && num > 0 ? num : null;
};

/** The highest drawing number, 0 when no drawing has one. */
const maxNum = (drawings) => drawings.reduce((max, d) => Math.max(max, drawingNum(d) || 0), 0);

/** The drawings with a number, in array order after the highest one, for each drawing that has none. */
const numberMissing = (drawings) => {
  let next = maxNum(drawings);
  let changed = false;
  const result = drawings.map(d => {
    if (drawingNum(d)) return d;
    changed = true;
    next += 1;
    return { ...d, properties: { ...d.properties, num: next } };
  });
  return changed ? result : drawings;
};

/** The styles of a feature style at a resolution, as an array. */
const baseStyles = (style, feature, resolution) => {
  const value = typeof style === 'function' ? style(feature, resolution) : style;
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

/** A style function that adds the highlight to the given feature style. */
const highlightStyle = (original) => (feature, resolution) => {
  const base = baseStyles(original, feature, resolution);
  const state = feature.get('state') || {};
  const geometry = feature.getGeometry();
  const geometryType = geometry ? geometry.getType() : null;
  if (feature.get('type') === 'Text') {
    return base.map(style => {
      const text = style.getText && style.getText();
      if (!text) return style;
      const boxed = text.clone();
      boxed.setBackgroundStroke(new OlStyleStroke({ color: HIGHLIGHT_COLOR, width: 3 }));
      boxed.setPadding([3, 3, 3, 3]);
      return new OlStyle({ text: boxed });
    });
  }
  if (geometryType === 'Point' || geometryType === 'MultiPoint') {
    return [...base, new OlStyle({
      image: new OlStyleCircle({
        radius: (Number(state.size) || 5) + 8,
        stroke: new OlStyleStroke({ color: HIGHLIGHT_COLOR, width: 4 })
      })
    })];
  }
  return [
    new OlStyle({ stroke: new OlStyleStroke({ color: HIGHLIGHT_COLOR, width: (Number(state.size) || 2) + 10 }) }),
    ...base
  ];
};

const STYLE_FIELDS = ['fill', 'stroke', 'size', 'symbol_type', 'text_style', 'text_size', 'text_font', 'text_value', 'line_style'];

const TOOL_KINDS = {
  point: 'Point',
  line: 'LineString',
  polygon: 'Polygon',
  square: 'Polygon',
  rectangle: 'Polygon',
  grid: 'Polygon',
  symbol: 'Symbol',
  text: 'Text'
};

const KIND_FIELDS = {
  LineString: ['stroke', 'size', 'line_style'],
  Polygon: ['fill', 'stroke', 'size', 'line_style'],
  Point: ['fill', 'stroke', 'size'],
  Symbol: ['symbol_type', 'fill', 'stroke', 'size'],
  Text: ['text_value', 'text_style', 'text_size', 'text_font', 'fill', 'stroke']
};

const DEFAULT_FIELDS = ['fill', 'stroke', 'size'];

const FIELD_ORDER = ['text_value', 'text_style', 'text_size', 'text_font', 'symbol_type', 'fill', 'stroke', 'size', 'line_style'];

/** The style fields that all the given drawing kinds share. */
const sharedFields = (kinds) => FIELD_ORDER.filter(field =>
  kinds.every(kind => (KIND_FIELDS[kind] || DEFAULT_FIELDS).includes(field)));

/** The line style a drawing with no `line_style` key shows on the map. */
const legacyLineStyle = (type) => type === 'Polygon' ? 'dashed' : 'solid';

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
    line_style: 'solid',
    styleKind: null,
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
    snap: true,
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

  const [numbering] = useState(() => {
    const loaded = viewer.config_json.drawings || [];
    const drawings = numberMissing(loaded);
    return { drawings, changed: drawings !== loaded };
  });

  const history = useDrawHistory({
    initial: numbering.drawings,
    dispatch,
    actions
  });

  const drawRef = useRef(null);
  const modifyRef = useRef(null);
  const transformRef = useRef(null);
  const snapRef = useRef(null);
  const boxRef = useRef(null);
  const highlightedRef = useRef([]);
  const oldSelectRef = useRef([]);
  const zoomTimerRef = useRef(null);
  const placementRef = useRef(null);
  const handlersRef = useRef({});
  const mapHighlightRef = useRef({ hover: null, flash: null, timer: null, applied: null });

  const componentConfig = record.config_json || {};
  const showShapes = componentConfig.show_shapes !== false;
  const showSnap = componentConfig.show_snap !== false;
  const showHelp = componentConfig.show_help !== false;
  const showExport = componentConfig.show_export !== false;
  const allowedTools = Array.isArray(record.config_json && record.config_json.tools) ? record.config_json.tools : null;
  const toolAllowed = (opt) => !allowedTools || allowedTools.includes(opt.value);
  const drawToolsShown = drawElementsOptions.filter(toolAllowed);
  const shapeToolsShown = showShapes ? shapeTools.filter(toolAllowed) : [];
  const editToolsShown = selectTools.filter(toolAllowed);

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
    const { symbol_type, size, fill, text_style, text_size, text_font, text_value, line_style } = props.state;
    let style = u.createDrawingStyle(feature.getGeometry().getType(), size, fill, stroke, line_style);
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
    const record = propsRef.current.record;
    const allowed = !(record && record.config_json && record.config_json.show_snap === false);
    snapRef.current.setEnabled(allowed && panelRef.current.snap);
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

  const withNums = (features, geojsons) => {
    const drawings = currentDrawings();
    const known = new Map(drawings.map(d => [d.id, drawingNum(d)]));
    let next = maxNum(drawings);
    return geojsons.map((geojson, i) => {
      let num = known.get(geojson.id);
      if (!num) {
        next += 1;
        num = next;
      }
      if (features[i]) features[i].set('num', num, true);
      return { ...geojson, properties: { ...geojson.properties, num } };
    });
  };

  const serializeFeatures = (features) => {
    const { utils: u } = propsRef.current;
    const crs = viewCrs();
    return withNums(features, features.map(feature => u.serializeDrawing(feature, { ...feature.get('state') }, crs)));
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
      const [geojson] = withNums([feature], [u.serializeDrawing(feature, state, crs)]);
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
    const state = feature.get('state');
    const type = feature.get('type');
    patch({
      editing: { ids: [feature.get('id')], type, kinds: [type] },
      ...state,
      line_style: state.line_style || legacyLineStyle(type)
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
      const [geojson] = withNums([feature], [u.serializeDrawing(feature, state, crs)]);
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
        editing: { ids: features.map(feature => feature.get('id')), kinds: features.map(feature => feature.get('type')) }
      });
    }
  };

  handlersRef.current.box = (features, add) => {
    const inTransform = panelRef.current.selectedTool === 'transform' && transformRef.current;
    const previous = inTransform ? transformRef.current.getSelection() : select.getFeatures().getArray().slice();
    const next = add ? [...previous, ...features.filter(feature => !previous.includes(feature))] : features;
    if (next.length === previous.length && next.every(feature => previous.includes(feature))) return;
    if (inTransform) {
      transformRef.current.selectFeatures(next);
      return;
    }
    const selected = next.filter(feature => !previous.includes(feature));
    const deselected = previous.filter(feature => !next.includes(feature));
    deselected.forEach(feature => select.getFeatures().remove(feature));
    select.getFeatures().extend(selected);
    handlersRef.current.onSelect({ selected, deselected });
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
    const geojsons = withNums(features, features.map(feature => u.serializeDrawing(feature, state, crs)));
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
      const [geojson] = withNums([e.feature], [u.serializeDrawing(e.feature, panelRef.current, viewCrs())]);
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

    if (TOOL_KINDS[type]) patch({ styleKind: TOOL_KINDS[type] });

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
    if (type !== 'select') {
      if (select.getFeatures().getLength()) finishEditing();
      removeModify();
    }

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

  const commitOrder = (next) => {
    history.seal();
    history.commit(next);
  };

  const bringToFront = (item) => {
    const list = currentDrawings();
    if (list[list.length - 1].id === item.id) return;
    commitOrder([...list.filter(d => d.id !== item.id), item]);
  };

  const sendToBack = (item) => {
    const list = currentDrawings();
    if (list[0].id === item.id) return;
    commitOrder([item, ...list.filter(d => d.id !== item.id)]);
  };

  const reorderPage = (pageItems, start) => {
    const fromTop = currentDrawings().slice().reverse();
    fromTop.splice(start, pageItems.length, ...pageItems);
    commitOrder(fromTop.reverse());
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
    if (snapRef.current) snapRef.current.dispose();
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

  useEffect(() => {
    const box = createBoxSelect({
      map: mainMap,
      getSource,
      onBox: (features, add) => handlersRef.current.box(features, add)
    });
    boxRef.current = box;
    return () => {
      box.dispose();
      boxRef.current = null;
    };
  }, [mainMap]);

  useEffect(() => {
    if (boxRef.current) boxRef.current.setActive(panel.selectedTool === 'select' || panel.selectedTool === 'transform');
  }, [panel.selectedTool]);

  useEffect(() => {
    if (!numbering.changed) return;
    dispatch(actions.viewer_set_drawings(numbering.drawings));
    const source = getSource();
    if (source) {
      numbering.drawings.forEach(d => {
        const feature = source.getFeatureById(d.id);
        if (feature) feature.set('num', d.properties.num, true);
      });
    }
  }, []);

  useEffect(() => () => {
    const h = mapHighlightRef.current;
    clearTimeout(h.timer);
    h.hover = null;
    h.flash = null;
    applyMapHighlight();
  }, []);

  const download = (format) => {
    const { viewer: v, record: rec, mainMap: map } = propsRef.current;
    const componentCfg = rec ? rec.config_json : null;
    const source = getSource();
    const order = new Map(currentDrawings().map((d, i) => [d.id, i]));
    const rank = (feature) => order.has(feature.getId()) ? order.get(feature.getId()) : -1;
    const features = source ? source.getFeatures().sort((a, b) => rank(a) - rank(b)) : [];

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

  const applyMapHighlight = () => {
    const h = mapHighlightRef.current;
    const id = h.hover || h.flash;
    const source = getSource();
    const feature = id && source ? source.getFeatureById(id) : null;
    if (h.applied && h.applied.feature === feature && feature.getStyle() === h.applied.style) return;
    if (h.applied && h.applied.feature.getStyle() === h.applied.style) {
      h.applied.feature.setStyle(h.applied.original);
    }
    h.applied = null;
    if (!feature || !feature.get('state')) return;
    const original = feature.getStyle();
    const style = highlightStyle(original);
    feature.setStyle(style);
    h.applied = { feature, original, style };
  };

  const hoverRow = (id) => {
    mapHighlightRef.current.hover = id;
    applyMapHighlight();
  };

  const flashRow = (id) => {
    const h = mapHighlightRef.current;
    clearTimeout(h.timer);
    h.flash = id;
    applyMapHighlight();
    h.timer = setTimeout(() => {
      h.flash = null;
      h.timer = null;
      applyMapHighlight();
    }, HIGHLIGHT_FLASH_MS);
  };

  const zoom = (item) => {
    const features = parseOlFeatures(JSON.stringify(item), viewCrs());
    if (features.length) {
      getMap().getView().fit(features[0].getGeometry());
    }
    flashRow(item.id);
  };

  const {
    size,
    fill,
    stroke,
    symbol_type,
    text_style,
    text_size,
    text_font,
    text_value,
    line_style,
    styleKind,
    editing,
    transformCount,
    selectedTool,
    pageSize
  } = panel;

  let styleFields;
  if (editing && editing.kinds && editing.kinds.length) {
    styleFields = sharedFields(editing.kinds);
  } else if (TOOL_KINDS[selectedTool]) {
    styleFields = sharedFields([TOOL_KINDS[selectedTool]]);
  } else {
    styleFields = sharedFields([styleKind]);
  }
  const hasField = (field) => styleFields.includes(field);
  const hasTextFields = ['text_value', 'text_style', 'text_size', 'text_font'].some(hasField);

  const drawings = viewer.config_json.drawings;
  const totalPages = Math.max(1, Math.ceil(drawings.length / pageSize));
  const page = Math.min(panel.page, totalPages);
  const pageStart = (page - 1) * pageSize;
  const pageRecords = drawings.slice().reverse().slice(pageStart, pageStart + pageSize);
  const topId = drawings.length ? drawings[drawings.length - 1].id : null;
  const bottomId = drawings.length ? drawings[0].id : null;

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

          {drawToolsShown.length ? section(i18next.t("drawingSectionDraw", "Desenhar"), drawToolsShown.map(toolButton)) : null}

          <Group gap={12} wrap="wrap" align="flex-start">
            {shapeToolsShown.length ? section(i18next.t("drawingSectionShapes", "Formas"), shapeToolsShown.map(toolButton)) : null}
            {editToolsShown.length ? section(i18next.t("drawingSectionEdit", "Editar"), editToolsShown.map(toolButton)) : null}
            {section(i18next.t("drawingSectionHistory", "Histórico"), historyTools.map(historyButton))}
          </Group>

          <Stack gap={6} className="draw-section">
            <Text className="draw-section-label">{i18next.t("drawingSectionStyle", "Estilo")}</Text>
            {hasTextFields ? (
              <Stack gap="xs">
                {hasField('text_value') ? (
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
                ) : null}
                <SimpleGrid cols={2} spacing="xs">
                  {hasField('text_style') ? (
                    <Select
                      size="sm"
                      label={i18next.t("textStyle", "Estilo do Texto")}
                      title={i18next.t("textStyle", "Estilo do Texto")}
                      aria-label={i18next.t("textStyle", "Estilo do Texto")}
                      value={text_style}
                      data={textStyleOptions}
                      onChange={value => styleChange({ text_style: value })}
                      allowDeselect={false}
                      comboboxProps={{ withinPortal: true }}
                    />
                  ) : null}
                  {hasField('text_size') ? (
                    <Select
                      size="sm"
                      label={i18next.t("textSize", "Tamanho do Texto")}
                      title={i18next.t("textSize", "Tamanho do Texto")}
                      aria-label={i18next.t("textSize", "Tamanho do Texto")}
                      value={text_size}
                      data={textSizeOptions}
                      onChange={value => styleChange({ text_size: value })}
                      allowDeselect={false}
                      comboboxProps={{ withinPortal: true }}
                    />
                  ) : null}
                </SimpleGrid>
                {hasField('text_font') ? (
                  <Select
                    size="sm"
                    label={i18next.t("fontType", "Tipo de Letra")}
                    title={i18next.t("fontType", "Tipo de Letra")}
                    aria-label={i18next.t("fontType", "Tipo de Letra")}
                    value={text_font}
                    data={textFontOptions}
                    onChange={value => styleChange({ text_font: value })}
                    allowDeselect={false}
                    comboboxProps={{ withinPortal: true }}
                  />
                ) : null}
              </Stack>
            ) : null}
            <Group gap={4} wrap="wrap" align="center">
              {hasField('symbol_type') ? (
                <Select
                  size="sm"
                  w={120}
                  title={i18next.t("drawingSelectSymbol", "Escolha o Símbolo")}
                  aria-label={i18next.t("drawingSelectSymbol", "Escolha o Símbolo")}
                  value={symbol_type}
                  data={symbolOptions.map(o => ({ ...o, label: i18next.t(o.label, o.labelDefault) }))}
                  onChange={value => styleChange({ symbol_type: value })}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: true }}
                />
              ) : null}
              {colorTools.filter(opt => hasField(opt.value)).map(colorButton)}
              {hasField('size') ? (
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
              ) : null}
              {hasField('line_style') ? (
                <SegmentedControl
                  size="xs"
                  title={i18next.t("drawingLineStyle", "Tipo de linha")}
                  aria-label={i18next.t("drawingLineStyle", "Tipo de linha")}
                  value={line_style || 'solid'}
                  data={lineStyleOptions.map(o => ({ value: o.value, label: <LineStylePreview option={o} /> }))}
                  onChange={value => styleChange({ line_style: value })}
                />
              ) : null}
            </Group>
          </Stack>

          {showSnap ? (
            <>
              <Divider />
              <Switch
                size="xs"
                checked={panel.snap}
                onChange={toggleSnap}
                label={i18next.t("drawingSnap", "Atrair (Snapping) às geometrias")}
              />
            </>
          ) : null}

        </Stack>
      </Paper>

      {showHelp ? <HelpBox tool={selectedTool || 'none'} snap={showSnap} /> : null}

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

      {showExport && drawings.length > 0 ? (
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
              accessor: 'properties.num',
              title: 'ID',
              noWrap: true,
              render: row => drawingNum(row) || '',
            },
            {
              accessor: 'properties.type',
              title: i18next.t("type", "Tipo"),
              noWrap: true,
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
                  <Menu position="bottom-end" withinPortal shadow="md">
                    <Menu.Target>
                      <ActionIcon
                        type="button"
                        variant="subtle"
                        radius="xl"
                        size="md"
                        title={i18next.t("drawingOrder", "Ordem de desenho")}
                        aria-label={i18next.t("drawingOrder", "Ordem de desenho")}
                      >
                        <IconEllipsisV />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconArrowUp />}
                        disabled={row.id === topId}
                        onClick={() => bringToFront(row)}
                      >
                        {i18next.t("drawingBringToFront", "Trazer para a frente")}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconArrowDown />}
                        disabled={row.id === bottomId}
                        onClick={() => sendToBack(row)}
                      >
                        {i18next.t("drawingSendToBack", "Enviar para trás")}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              ),
            },
          ]}
          onRowReorder={(items) => reorderPage(items, pageStart)}
          customRowAttributes={(row) => ({
            onMouseEnter: () => hoverRow(row.id),
            onMouseLeave: () => hoverRow(null)
          })}
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
