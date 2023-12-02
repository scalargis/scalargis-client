import React from 'react';
import i18next from "i18next";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import OlFormatWKT from "ol/format/WKT";
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
import './index.css';

const drawElementsOptions = [
  { value: "symbol", title: "drawingAddSymbol", defaultTitle: "Adicionar símbolo", icon: "pi pi-star-o" },
  { value: "text", title: "drawingAddText", defaultTitle: "Adicionar texto", icon: "pi pi-info-circle" },
  { value: "point", title: "drawingAddPoint", defaultTitle: "Adicionar ponto", icon: "pi pi-circle-on" },
  { value: "line", title: "drawingAddLine", defaultTitle: "Adicionar linha", icon: "pi pi-minus" },
  { value: "polygon", title: "drawingAddPoligon", defaultTitle: "Adicionar polígono", icon: "pi pi-th-large" }
];

const selectTools = [
  { value: "select", title: "select", defaultTitle: "Selecionar", icon: "pi pi-pencil" }
]

const historyTools = [
  { value: "undo", title: "undo", defaultTitle: "Desfazer", icon: "pi pi-replay" },
  { value: "redo", title: "redo", defaultTitle: "Refazer" , icon: "pi pi-refresh" },
  { value: "clear", title: "clearAll", defaultTitle:"Limpar tudo", icon: "pi pi-trash" }
];

const colorTools = [
  { value: "fill", title: "fillColor", defaultTitle: "Côr de preenchimento", icon: "pi pi-palette" },
  { value: "stroke", title: "outlineColor", defaultTitle: "Côr de rebordo", icon: "pi pi-palette" }
];

const defaultExportFormats = [
  { value: "geojson", title: "GeoJSON", icon: "pi pi-file", tooltip: "Exportar para ficheiro GeoJSON" },
  { value: "gml", title: "GML", icon: "pi pi-file", tooltip: "Exportar para ficheiro GML" },
  { value: "shape", title: "ShapeFile", icon: "pi pi-file", tooltip: "Exportar para ficheiro ShapeFile" },
  { value: "kml", title: "KML", icon: "pi pi-file", tooltip: "Exportar para ficheiro KML" }
];

const typeLabels = {
  "Symbol": "symbol",
  "Text": "text",
  "Point": "point",
  "LineString": "linestring",
  "Polygon": "polygon"
};

class DrawTools extends React.Component {
  
  constructor(props) {
    super(props);

    const drawings = Object.assign([], props.viewer.config_json.drawings);

    const component_cfg = props.record.config_json;

    if  (component_cfg && component_cfg.exclude_export_formats && component_cfg.exclude_export_formats.length) {
      this.exportFormats = defaultExportFormats.filter(t => !component_cfg.exclude_export_formats.includes(t.value));
    } else if (props.viewer && props.viewer.config_json && props.viewer.config_json.exclude_export_formats) {
      this.exportFormats = defaultExportFormats.filter(t => !props.viewer.config_json.exclude_export_formats.includes(t.value));    
    } else {
      this.exportFormats = [...defaultExportFormats];
    }

    this.state = {
      enabled: true,
      hist: [drawings],
      history_now: 0,
      click: false,
      draw_geom: false,
      draw_symbol: false,
      draw_text: false,
      fill: { r: '255', g: '255', b: '255', a: '1' },
      stroke: { r: '0', g: '0', b: '0', a: '1' },
      size: '2',
      symbol_type: 'x',
      text_style: 'normal',
      text_size: '20px',
      text_font: 'Arial, Helvetica, sans-serif',
      text_value: i18next.t('drawingSampleText', 'Exemplo de texto'),
      displayFillPicker: false,
      displayStrokePicker: false,
      editing: null,
      selectedTool: null
    }
    
    this.sizeOptions = [
      { key: '1', label: '1', value: '1' },
      { key: '2', label: '2', value: '2' },
      { key: '3', label: '3', value: '3' },
      { key: '4', label: '4', value: '4' },
      { key: '5', label: '5', value: '5' },
      { key: '10', label: '10', value: '10' },
      { key: '15', label: '15', value: '15' },
      { key: '20', label: '20', value: '20' },
    ];

    this.symbolOptions = [
      { key: '1', label: 'circle', labelDefault: "círculo", value: 'circle' },
      { key: '2', label: 'square', labelDefault: "quadrado", value: 'square' },
      { key: '3', label: 'triangle', labelDefault: "triângulo", value: 'triangle' },
      { key: '4', label: 'square', labelDefault: "estrela", value: 'star' },
      { key: '5', label: 'cross', labelDefault: "cruz", value: 'cross' },
      { key: '10', label: 'x', labelDefault: "x", value: 'x' }
    ];

    this.textStyleOptions = [
      { key: '1', label: 'normal', value: 'normal' },
      { key: '2', label: 'italico', value: 'italic' },
      { key: '3', label: 'negrito', value: 'bold' },
    ];

    this.textSizeOptions = [
      { key: '1', label: '8px', value: '8px' },
      { key: '2', label: '11px', value: '11px' },
      { key: '3', label: '15px', value: '15px' },
      { key: '4', label: '20px', value: '20px' },
      { key: '5', label: '25px', value: '25px' },
    ];

    this.textFontOptions = [
      { key: '1', label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
      { key: '2', label: 'Georgia', value: 'Georgia, serif' },
    ];

    const olmap = this.props.mainMap;
    this.drawingsLayer = props.utils.findOlLayer(olmap, 'userlayer');
    this.vectorSource = this.drawingsLayer.getSource();
    this.features = this.vectorSource.getFeaturesCollection();
    
    this.modify = null;

    this.select = new OlInteractionSelect({
      condition: singleClick,
      hitTolerance: 5,
      wrapX: false,
      filter: (feature, layer) => {

        // TODO: improve validate drawings layer
        /*
        olmap.getLayers().forEach(l => {
          console.log('layer', l.get('id'));
        });
        */
        if (layer.get('id') !== 'userlayer') return false;
        return true;
      }
    });
    const oldSelect = new OlCollection();
    this.select.on('select', (e) => {
      let selected = e.selected;
      let deselected = e.deselected;
      if (selected) {
        selected.forEach((feature) => {
          if (feature.get('state')) {
            oldSelect.push(feature);
            const style = this.createStyle(feature, {r: 255, g: 0, b: 0, a: 1});
            feature.setStyle(style);
          }
        });
      }
      if (deselected) {
        deselected.forEach((feature) => {
          if (feature.get('state')) {
            const props = feature.getProperties();
            const style = this.createStyle(feature, props.state.stroke);
            feature.setStyle(style);
          }
        });
      }
      if (!selected && !deselected) {
        oldSelect.forEach((feature) => {
          if (feature.get('state')) {
            const props = feature.getProperties();
            const style = this.createStyle(feature, props.state.stroke);
            feature.setStyle(style);
          }
        });
      }
      //this.drawingsLayer.getSource().refresh();
      if (!selected || selected.length === 0) {
        if (this.modify) {
          this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
          olmap.removeInteraction(this.modify);
          this.modify = null;
        }
        return this.setState({
          ...this.state,
          draw_geom: false,
          draw_symbol: false,
          draw_text: false,
          editing: null
        });
      } else {
        this.editFeature(selected[0]);
      }
    });
    
    this.draw = null;
    this.format = new OlFormatWKT();
  }

  changeSize = ({ value }) => {
    this.setState({...this.state, size: value }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));
    });
  }
  
  changeFill = (color) => {
    this.setState({...this.state, fill: color.rgb }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));
    });
  }
  
  changeStroke = (color) => {
    this.setState({...this.state, stroke: color.rgb }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));  
    });
  }

  changeSymbol = ({ value }) => {
    this.setState({...this.state, symbol_type: value }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));  
    });
  }

  changeTextStyle = ({ value }) => {
    this.setState({...this.state, text_style: value }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));  
    });
  }

  changeTextSize = ({ value }) => {
    this.setState({...this.state, text_size: value }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));  
    });
  }

  changeTextFont = ({ value }) => {
    this.setState({...this.state, text_font: value }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));  
    });
  }

  changeTextValue = (e) => {
    this.setState({...this.state, text_value: e.target.value }, () => {
      const selected = this.select.getFeatures();
      if (selected.getLength()) this.updateStyle(selected.item(0));  
    });
  }

  toggleFillPicker = () => {
    this.setState({ ...this.state, displayFillPicker: !this.state.displayFillPicker, displayStrokePicker: false })
  };

  closeFillPicker = () => {
    this.setState({ ...this.state, displayFillPicker: false })
  };

  toggleStrokePicker = () => {
    this.setState({ ...this.state, displayStrokePicker: !this.state.displayStrokePicker, displayFillPicker: false })
  };

  closeStrokePicker = () => {
    this.setState({ ...this.state, displayStrokePicker: false })
  };

  createStyle(feature, stroke) {
    const props = feature.getProperties();
    const utils = this.props.utils;
    const { symbol_type, size, fill, text_style, text_size, text_font, text_value } = props.state;
    let style = utils.createDrawingStyle(feature.getGeometry().getType(), size, fill, stroke);
    if (props.type === 'Symbol') {
        style = utils.createDrawingSymbol(symbol_type, size, fill, stroke);
    }
    if (props.type === 'Text') {
        style = utils.createDrawingText(feature, size, fill, stroke, text_style, text_size, text_font, text_value);
    }
    return style;
  }

  updateStyle(feature) {
    const { viewer, actions, dispatch, utils } = this.props;
    const map = this.props.mainMap;
    const crs = map.getView().getProjection().getCode();    
    const style = utils.createStyle(feature, this.state, {r: 255, g: 0, b: 0, a: 1});
    feature.setStyle(style);
    const geojson = utils.serializeDrawing(feature, this.state, crs);
    const drawings = viewer.config_json.drawings.map(d => {
      if (d.id === geojson.id) return geojson;
      return d;
    });
    dispatch(actions.viewer_set_drawings(drawings));
  }

  onMOdifyEnd(e) {
    e.features.forEach(feat => {
      this.updateStyle(feat);
    });
  }

  editFeature(feature) {
    const state = feature.get('state');
    const olmap = this.props.mainMap;
    this.setState({
      ...this.state,
      editing: feature.getProperties(),
      ...state
    }, () => {
      const features = new OlCollection();
      features.push(feature);
      this.modify = new OlInteractionModify({
        features,
        deleteCondition: function(event) {
          return shiftKeyOnly(event) && singleClick(event);
        }
      });
      this.modify.on('modifyend', this.onMOdifyEnd.bind(this));
      olmap.addInteraction(this.modify);
      this.modify.setActive(true);
    });
  }

  componentDidMount() {
    const olmap = this.props.mainMap;
    this.drawingsLayer = this.props.utils.findOlLayer(olmap, 'userlayer');
    this.vectorSource = this.drawingsLayer.getSource();
    this.features = this.vectorSource.getFeaturesCollection();
    this.props.mainMap.addInteraction(this.select);
    this.select.setActive(false);
  }

  componentDidUpdate(prevProps) {
    //TODO: may need more work
      if (this.state.selectedTool && this.props.viewer.config_json.selected_menu != 'drawtools') {
      this.select.setActive(false);
      this.setState({
        ...this.state,
        selectedTool: ''
      });
    }
  }   

  addInteraction(type, cb) {
    const { hist, history_now } = this.state;
    const { viewer, actions, dispatch, utils } = this.props;
    const map = this.props.mainMap;
    const crs = map.getView().getProjection().getCode();
    this.draw = new OlInteractionDraw({
        features: new OlCollection(),
        type: type
    });
    this.findInteraction(OlInteractionDragPan).setActive(false);
    this.findInteraction(OlInteractionDoubleClickZoom).setActive(false);
    this.findInteraction(OlInteractionPinchZoom).setActive(false);

    dispatch(actions.viewer_set_exclusive_mapcontrol('DrawTools'));
    
    map.addInteraction(this.draw);
    this.draw.on('drawend', (e) => {
        
      // Add drawing
      const geojson = utils.serializeDrawing(e.feature, this.state, crs);
      const drawings_update = [...viewer.config_json.drawings, geojson];
      dispatch(actions.viewer_set_drawings(drawings_update));

      setTimeout(() => {
        let history_item = [];
        drawings_update.forEach(function(item) {
          history_item.push(Object.assign({}, item));
        });
        hist.push(history_item);
        this.setState({
          ...this.state,
          hist,
          history_now: history_now+1,
          selectedTool: null,
          draw_geom: false,
          draw_symbol: false,
          draw_text: false
        });

        // Terminate
        map.removeInteraction(this.draw);
        this.findInteraction(OlInteractionDragPan).setActive(true);
        this.findInteraction(OlInteractionDoubleClickZoom).setActive(true);
        this.findInteraction(OlInteractionPinchZoom).setActive(true);
        //this.select.setActive(true);

        dispatch(actions.viewer_set_exclusive_mapcontrol(null));
      }, 350);
    });
  }

  findInteraction(classname) {
    let result = false;
    const { mainMap } = this.props;
    mainMap.getInteractions().forEach(function(item) {
      if (item instanceof classname) result = item;
    });
    return result;
  }

  // toggle geometry interaction
  toggleInteraction(type) {
    const { mainMap } = this.props;
    if (this.draw) mainMap.removeInteraction(this.draw);
    this.addInteraction(type);
    this.findInteraction(OlInteractionDragPan).setActive(false);
  }

  startDraw(e, type) {
    e.preventDefault();
    e.target.blur();

    // Disable interaction
    if (type === this.state.selectedTool) {
      // Terminate
      const { mainMap, actions, dispatch } = this.props;

      if (type === 'select') {
        this.select.setActive(false);
      } else {
        mainMap.removeInteraction(this.draw);
        this.findInteraction(OlInteractionDragPan).setActive(true);
        this.findInteraction(OlInteractionDoubleClickZoom).setActive(true);
        this.findInteraction(OlInteractionPinchZoom).setActive(true);
      }      
      
      return this.setState({
        ...this.state,
        selectedTool: null,
        draw_geom: false,
        draw_symbol: false,
        draw_text: false
      }, () => {
        dispatch(actions.viewer_set_exclusive_mapcontrol(null));
      });      
    }

    if (type === 'select') {     
      // Enable interaction
      this.setState({ ...this.state, 
        selectedTool: type,
        draw_geom: false,
        draw_symbol: false,
        draw_text: false }, () => {
          this.select.setActive(true);

          const { mainMap, actions, dispatch } = this.props;
          if (this.draw) mainMap.removeInteraction(this.draw);

          dispatch(actions.viewer_set_exclusive_mapcontrol('DrawTools'));
        //this.addInteraction(type);
        //this.findInteraction(OlInteractionDragPan).setActive(false);
        }
      );
    } else {
      // Enable interaction
      this.setState({ ...this.state, selectedTool: type }, () => {
        this.select.setActive(false);
        switch(type) {
          case 'symbol': this.clickDrawSymbol(); break;
          case 'text': this.clickDrawText(); break;
          case 'point': this.clickDrawPoint(); break;
          case 'line': this.clickDrawLine(); break;
          case 'polygon': this.clickDrawPolygon(); break;
          default: this.clickDrawPoint();
        }
      });
    }
  }

  // Enable draw point
  clickDrawPoint() {
    this.toggleInteraction('Point');
    this.setState({
      ...this.state,
      draw_geom: true,
      draw_symbol: false,
      draw_text: false,
      editing: null
    });
  }

  // Enable draw line
  clickDrawLine() {
    this.toggleInteraction('LineString');
    this.setState({
      ...this.state,
      draw_geom: true,
      draw_symbol: false,
      draw_text: false,
      editing: null
    });
 }

  // Enable draw polygon
  clickDrawPolygon() {
    this.toggleInteraction('Polygon');
    this.setState({
      ...this.state,
      draw_geom: true,
      draw_symbol: false,
      draw_text: false,
      editing: null
    });
  }

  // Enable draw text
  clickDrawText() {
    const { mainMap } = this.props;
    this.setState({
      ...this.state,
      draw_geom: false,
      draw_symbol: false,
      draw_text: true,
      editing: null
    }, () => {
      mainMap.removeInteraction(this.draw);
      this.addInteraction('Point');
    });
  }

  // Enable draw symbol
  clickDrawSymbol() {
    const { mainMap } = this.props;
    this.setState({
      ...this.state,
      draw_geom: false,
      draw_symbol: true,
      draw_text: false,
      editing: null
    }, () => {
      mainMap.removeInteraction(this.draw);
      this.addInteraction('Point');
    });
  }

  // Draw undo
  clickUndo(e) {
    e.preventDefault();
    const { actions, dispatch, mainMap } = this.props;
    if (this.modify) {
      this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
      mainMap.removeInteraction(this.modify);
      this.modify = null;
    }
    this.select.getFeatures().clear();
    this.setState({
      ...this.state,
      editing: null
    }, () => {
      const drawings = [];
      let { hist, history_now } = this.state;
      if (history_now > 0) {
        history_now--;
        hist[history_now].forEach(item => {
          drawings.push(item);
        });
        this.setState({
            ...this.state,
            hist,
            history_now: history_now
        }, () => {
          dispatch(actions.viewer_set_drawings(drawings));
        });
      }
    });
  }

  // Draw redo
  clickRedo(e) {
    e.preventDefault();
    const { actions, dispatch, mainMap } = this.props;
    if (this.modify) {
      this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
      mainMap.removeInteraction(this.modify);
      this.modify = null;
    }
    this.select.getFeatures().clear();
    this.setState({
      ...this.state,
      editing: null
    }, () => {
      const drawings = [];
      let { hist, history_now } = this.state;
      if (history_now + 1 < hist.length) {
        history_now++;
        hist[history_now].forEach(item => {
          drawings.push(item);
        });
        this.setState({
          ...this.state,
          hist,
          history_now: history_now
        }, () => {
          dispatch(actions.viewer_set_drawings(drawings));
        });
      }
    });
  }

  // Draw delete current
  clickDelete(e) {
    e.preventDefault();
    const { actions, dispatch, mainMap } = this.props;
    if (this.modify) {
      this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
      mainMap.removeInteraction(this.modify);
      this.modify = null;
    }
    this.select.getFeatures().clear();
    dispatch(actions.viewer_set_drawings([]));
    this.setState({
      ...this.state,
      hist: [[]],
      history_now: 0,
      editing: null
    });
  }

  // Get editing feature
  getEditingFeature(id) {
    let found = null;
    this.features.forEach(feat => {
      if (feat.get('id') === id) found = feat;
    });
    return found;
  }

  // Remove feature
  removeFeature() {
    const { viewer, actions, dispatch, mainMap } = this.props;
    let drawings = viewer.config_json.drawings;
    const { editing } = this.state;
    const feature = this.getEditingFeature(editing.id);
    if (feature) {
      if (this.modify) {
        this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
        mainMap.removeInteraction(this.modify);
        this.modify = null;
      }
      this.select.getFeatures().clear();
      drawings = drawings.filter(d => d.id !== feature.getId());
      dispatch(actions.viewer_set_drawings(drawings));
    }
    this.setState({
      ...this.state,
      draw_geom: false,
      draw_symbol: false,
      draw_text: false,
      editing: null
    });
  }

  // Finish editing
  finishEditing() {
    this.select.getFeatures().clear();
    this.select.dispatchEvent('select');
  }

  // Disable draw tools
  disableTools() {
    const map = this.props.mainMap;
    if (this.state.selectedTool) {
      if (this.draw) map.removeInteraction(this.draw);
      this.findInteraction(OlInteractionDragPan).setActive(true);
      this.findInteraction(OlInteractionDoubleClickZoom).setActive(true);
      this.findInteraction(OlInteractionPinchZoom).setActive(true);
      this.setState({ ...this.state, selectedTool: null });
    }
    if (this.state.editing) this.finishEditing();
    if (this.modify) {
      this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
      map.removeInteraction(this.modify);
      this.modify = null;
    }
    //this.select.setActive(false);
    this.setState({
      ...this.state,
      enabled: false,
      draw_geom: false,
      draw_symbol: false,
      draw_text: false,
      editing: null
    });
  }

  // Enable draw tools
  enableTools() {
    if (!this.state.enabled) {
      this.setState({ ...this.state, enabled: true });
      //RS
      //this.select.setActive(true);
    }
  }

  componentWillUnmount() {
    const { mainMap } = this.props;
    mainMap.removeInteraction(this.select);
    if (this.modify) {
      this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
      mainMap.removeInteraction(this.modify);
      this.modify = null;
    }
    mainMap.removeInteraction(this.draw);
    this.findInteraction(OlInteractionDragPan).setActive(true);
    this.findInteraction(OlInteractionDoubleClickZoom).setActive(true);
    this.findInteraction(OlInteractionPinchZoom).setActive(true);
  }

  download(format) {
    const { viewer, record } = this.props;
    const component_cfg = record ? record.config_json : null;

    const serializer = new OlFormatGeoJSON();

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

    // Export defaults to EPSG:4326
    const serializeOptions = {
      dataProjection: 'EPSG:' + crs,
      featureProjection: this.props.mainMap.getView().getProjection().getCode(),
      decimals: 6
    }
    const json = serializer.writeFeaturesObject(this.features.getArray(), serializeOptions);
    
    // Hack: OL does not serialize with CRS attribute
    //json.crs = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::4326" } }
    const crsinfo = {
      "type": "name",
      "properties": {
          "name": "urn:ogc:def:crs:EPSG::" + crs
      }
    };
    json.crs = crsinfo;    
    const data = JSON.stringify(json)

    // Build file
    const file = new Blob([data], {type: 'application/json'});
    FileSaver.saveAs(file, 'geojson');

    // TODO: upload and convert
    /*
    // Upload data
    const endpoint = process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_PUBLIC_URL;
    const upload = new FormData();
    upload.append('upload', file);
    upload.append('ext', 'geojson');
    fetch(endpoint + '/resource', { method: 'POST', body: upload })
    .then(res => res.json())
    .then(res => {
      if (!res.success) {
        console.log(res.error);
        return;
      }

      // Convert to format
      const url = endpoint + '/convert/' + res.filename + '/' + format
      fetch(url, { responseType: 'blob' })
        .then(res => res.blob())
        .then(res => {

          // Download result
          FileSaver.saveAs(res, format)
        }).catch((error) => {
          console.error(error);
        });
    });
    */
  }

  getButtonStyle(opt) {
    const { fill, stroke } = this.state;
    const fillStr = `rgba(${ fill.r }, ${ fill.g }, ${ fill.b }, ${ fill.a })`;
    const strokeStr = `rgba(${ stroke.r }, ${ stroke.g }, ${ stroke.b }, ${ stroke.a })`;
    switch(opt.value) {
      case 'fill':
        return {
          backgroundColor: fillStr,
          color: 'black'
        }
      case 'stroke':
        return {
          backgroundColor: strokeStr,
          color: 'white'
        }
      default:;
    }
  }

  // TODO: get better BBOX for points
  zoom(item) {
    const { mainMap } = this.props;
    let features = parseOlFeatures(JSON.stringify(item), mainMap.getView().getProjection().getCode());
    if (features.length) {
      mainMap.getView().fit(features[0].getGeometry());
    }
  }

  deleteItem(item) {
    const { viewer, mainMap, dispatch, actions } = this.props;
    if (this.modify) {
      this.modify.un('modifyend', this.onMOdifyEnd.bind(this));
      mainMap.removeInteraction(this.modify);
      this.modify = null;
    }
    this.select.getFeatures().clear();
    this.setState({
      ...this.state,
      draw_geom: false,
      draw_symbol: false,
      draw_text: false,
      editing: null
    }, () => {
      let drawings = viewer.config_json.drawings.filter(d => d.id !== item.id);
      dispatch(actions.viewer_set_drawings(drawings));
    });
  }

  render() {
    const {
      enabled,
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
      selectedTool
    } = this.state;
    const { viewer } = this.props;

    const styles = () => {
      return {
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        }
      }
    }

    // Enable/disable tools
    if (enabled && (viewer.config_json.selected_menu !== 'drawtools')) this.disableTools();
    if (!enabled && (viewer.config_json.selected_menu === 'drawtools')) this.enableTools();

    return (
      <div id="drawtools">

        <div className="p-shadow-5 toolbar">
        
          { drawElementsOptions.map(opt =>
            <Button
              key={opt.value}
              icon={opt.icon}
              label={ opt.label ? opt.label : ''}
              tooltip={i18next.t(opt.title, opt.defaultTitle)}
              className={"p-button-secondary tool " + (opt.value === selectedTool ? "active" : "") }
              onClick={(e) => this.startDraw(e, opt.value) }
            />
          )}

          {' '}

          { selectTools.map(opt =>
            <Button
              key={opt.value}
              icon={opt.icon}
              tooltip={i18next.t(opt.title, opt.defaultTitle)}
              className={"p-button-secondary tool " + (opt.value === selectedTool ? "active" : "") }
              onClick={(e) => this.startDraw(e, opt.value) }
            />
          )}

          <br />

          { colorTools.map(opt =>
            <Button
              key={opt.value}
              icon={opt.icon}
              tooltip={i18next.t(opt.title, opt.defaultTitle)}
              className={"p-button-secondary tool " + (opt.value === selectedTool ? "p-highlight" : "") }
              style={this.getButtonStyle(opt)}
              onClick={(e) => {
                switch(opt.value) {
                  case 'fill': this.toggleFillPicker(e); break;
                  case 'stroke': this.toggleStrokePicker(e); break;
                  default:;
                }
              }}
            />
          )}

          { this.state.displayFillPicker ? <div style={ styles().popover }>
            <div style={ styles().cover } onClick={ this.closeFillPicker.bind(this) }/>
            <CompactPicker color={ fill } onChange={ this.changeFill.bind(this) } />
          </div> : null }

          { this.state.displayStrokePicker ? <div style={ styles().popover }>
            <div style={ styles().cover } onClick={ this.closeStrokePicker.bind(this) }/>
            <CompactPicker color={ stroke } onChange={ this.changeStroke.bind(this) } />
          </div> : null }

          <Dropdown 
            text={size}
            tooltip={i18next.t("drawingLineSymbolSize", "Tamanho da linha/símbolo")}
            value={size}
            options={this.sizeOptions}
            onChange={opt => this.changeSize(opt)}
            style={{ marginBottom: '1px' }}
          />

          <br /><br />

          { historyTools.map(opt =>
            <Button
              key={opt.value}
              icon={opt.icon}
              tooltip={i18next.t(opt.title, opt.defaultTitle)}
              className={opt.value !== "clear" ? "p-button-info tool" : "p-button-danger tool" }
              onClick={(e) => {
                switch(opt.value) {
                  case 'undo': this.clickUndo(e); break;
                  case 'redo': this.clickRedo(e); break;
                  case 'clear': this.clickDelete(e); break;
                  default:;
                }
              }}
            />
          )}          

        </div>

        { editing ? (
          <React.Fragment>
            <h5>{` ${i18next.t("drawingEditing", "A editar")} ${i18next.t(typeLabels[editing.type], editing.type).toLocaleLowerCase()}`}</h5>
            <div>
              <Button
                onClick={e => this.finishEditing()}
                icon="pi pi-save"
                label="Aplicar"
                tooltip="Aplicar alterações"
              />
              <Button
                onClick={e => this.removeFeature()}
                icon="pi pi-trash"
                className="p-button-danger"
                tooltip="Apagar desenho"
              />
            </div>
          </React.Fragment>
        ) : null }

        { draw_symbol ? (
          <div>
            <h5>{i18next.t("drawingSymbolOptions", "Opções de Simbologia")}</h5>
            <Dropdown
              text={symbol_type}
              tooltip={i18next.t("drawingSelectSymbol", "Escolha o Símbolo")}
              value={symbol_type}
              options={this.symbolOptions.map(o => { return {...o, "label": i18next.t(o.label, o.labelDefault)} })}
              onChange={this.changeSymbol.bind(this)}
              style={{ minWidth: '120px' }}
            />
          </div>
        ) : null }

        { draw_text ? (
          <div>
            <h5>{i18next.t("textOptions", "Opções de Texto")}</h5>
            <Dropdown text={text_style}
              tooltip={i18next.t("textStyle", "Estilo do Texto")}
              value={text_style}
              options={this.textStyleOptions}
              onChange={this.changeTextStyle.bind(this)}
            />

            <Dropdown text={text_size}
              tooltip={i18next.t("textSize", "Tamanho do Texto")}
              value={text_size}
              options={this.textSizeOptions}
              onChange={this.changeTextSize.bind(this)}
            />

            <Dropdown text={text_font}
              tooltip={i18next.t("fontType", "Tipo de Letra")}
              value={text_font}
              options={this.textFontOptions}
              onChange={this.changeTextFont.bind(this)}
            />
            <br />
            <InputText 
              className="drawtools-text-input"
              value={text_value}
              onChange={this.changeTextValue.bind(this)}
              tooltip={i18next.t("textLabel", "Texto para a etiqueta")}
              placeholder={i18next.t("drawingInsertTextMsg", "Introduza o texto...")}
              onClick={e => e.target.select()}
            />
        </div>
        ) : null }

        <hr />

        <div>
          { viewer.config_json.drawings.length > 0 &&
            this.exportFormats.map(opt =>
              <Button
                key={opt.value}
                icon={opt.icon}
                label={opt.title}
                tooltip={opt.tooltip}
                className="p-button-outlined p-button-sm p-button-info format-tool"
                onClick={(e) => this.download(opt.value)}
              /> 
            )
          }
        </div>

        <hr />

        <h5>{i18next.t("drawings", "Desenhos")}</h5>
        { viewer.config_json.drawings.length === 0 ? (
          <p>{i18next.t("noDrawings", "Não existem desenhos")}</p>
        ) : (
          <DataTable 
            value={viewer.config_json.drawings}
            dataKey="id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate={i18next.t("drawingElementsPageInfo", "Mostrando {first} a {last} de {totalRecords} items")}
            >
            <Column 
              field="properties.id" 
              header="ID"
              body={(row, table) => table.value.indexOf(row) + 1}
            />
            <Column 
              field="properties.type" 
              header={i18next.t("type", "Tipo")}
              body={row => i18next.t(typeLabels[row.properties.type], row.properties.type)}
            />
            <Column 
              body={row => (
                <React.Fragment>
                  <Button 
                    icon="pi pi-search" 
                    className="p-mr-2" 
                    onClick={() => this.zoom(row)}
                    tooltip={i18next.t("locate", "Localizar")}
                  />
                  <Button 
                    icon="pi pi-trash" 
                    className="p-button-danger" 
                    onClick={() => this.deleteItem(row)}
                    tooltip={i18next.t("delete", "Eliminar")}
                  />
                </React.Fragment>
              )}
            />
          </DataTable>
        )}

      </div>
    );
  }

}

function parseOlFeatures(data, projection) {

  // Parse OL feature
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