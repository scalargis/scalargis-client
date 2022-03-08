import React, { useState, useEffect, useRef } from 'react'
import Cookies from 'universal-cookie'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown';
import { Toolbar } from 'primereact/toolbar';
import {InputText} from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { TabView,TabPanel } from 'primereact/tabview';
import { InputNumber } from 'primereact/inputnumber';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import OlInteractionDraw from 'ol/interaction/Draw';
import OlInteractionModify from 'ol/interaction/Modify';
import OlInteractionSelect from 'ol/interaction/Select';
import { shiftKeyOnly, singleClick } from 'ol/events/condition';
import { v4 as uuidV4 } from 'uuid'
import './style.css'

export default function PrintPanelItem(props) {

  const { control, printItem, printLayer, fields, handleFieldChange, standalone, config, actions } = props;
  const { viewer, mainMap, dispatch, Models } = config;
  const { showOnPortal } = Models.Utils;
  const { getScaleForResolution, getWMSVisibleLayers } = Models.MapModel;
  const { exclusive_mapcontrol } = viewer;

  const toast = useRef(null);
  const toastDialog = useRef(null);

  const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'scalargis';
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [drawTool, setDrawTool] = useState(null);
  const [draw , setDraw] = useState(null);
  const select = useRef(null);
  const [modify, setModify] = useState(null);

  const [formats, setFormats] = useState(null);
  const [restrictScales, setRestrictScales] = useState(null);

  const [scaleTabIndex, setScaleTabIndex] = useState(0);
  const [scaleModes, setScaleModes] =useState([]);
  const [selectedScaleMode, setSelectedScaleMode] = useState(null);
  const [restrictedScale, setRestrictedScale] = useState(null);
  const [freeScale, setFreeScale] = useState(null);

  const [isPrinting, setIsPrinting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [printFile, setPrintFile] = useState(null);

  const drawTools = [
    { value: "Point", title: "Adicionar ponto", icon: "fas fa-circle" },
    { value: "LineString", title: "Adicionar linha", icon: "pi pi-minus" },
    { value: "Polygon", title: "Adicionar polígono", icon: "fas fa-draw-polygon" },
    { value: "Select", title: "Selecionar elemento", icon: "fas fa-mouse-pointer" },
    { value: "Modify", title: "Editar elemento", icon: "pi pi-pencil" }     
  ];

  function selectDrawTool(e, tool) {
    e.preventDefault();
    e.target.blur();

    if (drawTool != tool) setDrawTool(tool);
    else setDrawTool(null);
  }

  function addInteraction(type) {
    if (draw) mainMap.removeInteraction(draw);
    if (select.current) select.current.setActive(false);
    if (modify) modify.setActive(false);    

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
            if (f != e.feature) printLayer.current.getSource().removeFeature(f);
          });
        }
      });
      setDraw(di);
    } else if (type === 'Select') {
      select.current.setActive(true);
    } else if (type === 'Modify') {
      modify.setActive(true);      
    }
  }
 
  const confirmDeleteAll = (features) => {
    confirmDialog({
        message: ' Deseja eliminar todos os elementos?',
        header: 'Confirmação',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        accept: () => {
          features.forEach((f) => {
            printLayer.current.getSource().removeFeature(f);
          });
          mainMap.render();
        },
        reject: () =>  { }      
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
    } else if (feats && feats.length == 1) {
      feats.forEach((f) => {
        printLayer.current.getSource().removeFeature(f);
      });      
    }

    mainMap.render();
  }

  function zoomFeaturesExtent() {
    if (printLayer && printLayer.current && printLayer.current.getSource().getFeatures().length > 0) {
      let extent = printLayer.current.getSource().getExtent();
      if (!extent) return;
      let center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2];

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

  function doPrint() {
    let isFormInvalid = false;

    setPrintFile(null);

    const formData = {};
    if (printItem.form_fields && printItem.form_fields.groups) {
      Object.entries(printItem.form_fields.groups).forEach(([groupKey, group]) => {
        Object.entries(group.fields).forEach(([fieldKey, field]) => {
          const field_key = groupKey + '.' + fieldKey;
          const val = fields[field_key];            
          if (val) {
            const fieldName = field.name || fieldKey;
            formData[fieldName] = val;
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
          formData[fieldName] = val;
        } else {
          if (field.required) isFormInvalid = true;
        }
      });
    }

    if (printItem.location_marking && !isFormInvalid) {
      const ft = printLayer.current.getSource().getFeatures();
      if (ft.length == 0) isFormInvalid = true;
    }

    //Abort if form is not valid
    if (isFormInvalid) return;

    setDrawTool(null);    
    setIsPrinting(true); 

    // Set fetch options
    let options = {
      headers: {
        'Accept': 'application/json',       
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: {}
    }

    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(cookieAuthName);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    const url = API_URL + '/api/v2/app/viewer/' + viewer.id + '/print/' + printItem.code + '/generate';

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

    //Get WMS Layers
    const wmsLayers = getWMSVisibleLayers(mainMap);
    if (wmsLayers && wmsLayers.length) {
      data += '&' + wmsLayers.map(l => 'layers[]=' + 'wms' + ';' + l.url + ';' + l.params.LAYERS + ';' + l.opacity + ';' + l.minScale+ ';' + l.maxScale + ';' + (l.params.CQL_FILTER || '') + ';' + (l.params.STYLES || l.params.STYLE || '')).join('&');
    }  

    let opts = {
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
        throw(res.Message || 'Ocorreu um erro ao gerar a planta');
      }
    }).catch(error => {
        setIsPrinting(false);
        toast.current.show({ severity: 'warn', summary: printItem.title || 'Emissão de plantas', 
          detail: 'Não foi possível gerar a planta', life: 3000 });        
    });
  }

  function getScalesTabs() {
    const tabs = [];
    if (printItem.restrict_scales) {
      tabs.push(<TabPanel key={'predefined'} header="Predefinida">
        <Dropdown
            className="p-inputgroup"
            options={restrictScales}
            optionLabel="label"
            optionValue="value"
            value={restrictedScale}
            onChange={e => setRestrictedScale(e.value)}
        />
      </TabPanel>)
    }
    if (printItem.free_scale) {
      tabs.push(<TabPanel key={'freescale'} header="Livre">
        <InputNumber value={freeScale} onValueChange={(e) => setFreeScale(e.value)} prefix="1:" />
      </TabPanel>)
    }
    if (printItem.map_scale) {
      tabs.push(<TabPanel key={'map'} header="Mapa">
        <Message
          severity="info"
          text={"A planta será emitida em função da escala de visualização do mapa"} 
        />        
      </TabPanel>)
    }
    return tabs;
  }

  function onScaleTabChange(e) {
    setScaleTabIndex(e.index);
    setSelectedScaleMode(scaleModes[e.index]);
  }

  useEffect(() => {
    const frmts = {};
    printItem.layouts.forEach((p) => {
      const { format, orientation } = p;
      const key = format + '-' + orientation;
      if (!frmts[key]) frmts[key] = { format, orientation, label: format + ' - ' + orientation }
    });
    const ff = [];
    Object.keys(frmts).forEach(function(k) {
      ff.push(frmts[k]);
    });
    setFormats(ff);
    if (ff.length > 0) handleFieldChange({ target: { id: 'layout', value: ff[0]}});

    //Set scale modes
    const scale_types = [];
    if (printItem.restrict_scales) scale_types.push('restricted');
    if (printItem.free_scale) scale_types.push('free');
    if (printItem.map_scale) scale_types.push('map');
    setScaleModes(scale_types);
    if (scale_types.length > 0) {
      setSelectedScaleMode(scale_types[0]);
    }

    //Set restricted scales
    const scales = [];
    if (printItem.restrict_scales_list) {
      printItem.restrict_scales_list.split(',').forEach((s) => {
          scales.push({ value: parseInt(s), label: '1:' + s});
      })
    }    
    setRestrictScales(scales);
    //Set restricted scale default value
    if (scales.length > 0) setRestrictedScale(scales[0].value);

  }, []);

  useEffect(() => {
    setShowErrors(false);
  }, [fields]);

  useEffect(() => {
    if (drawTool) {
      dispatch(actions.viewer_set_exclusive_mapcontrol('Print'));
      addInteraction(drawTool);
    } else {
      if (draw) {
        mainMap.removeInteraction(draw);
        setDraw(null);
      }
      if (select.current) select.current.setActive(false);
      if (modify) modify.setActive(false);
    }    
  }, [drawTool]);

  useEffect(() => {
    if (drawTool && exclusive_mapcontrol != 'Print') {
      setDrawTool(null);
    }
  }, [exclusive_mapcontrol]);

  useEffect(() => {
    const slct = new OlInteractionSelect({
      condition: singleClick,
      hitTolerance: 5,
      wrapX: false,
      filter: (feature, layer) => {
        if (layer.get('id') !== 'print') return false;
        return true;
      }
    });
    slct.on('select', function (e) {
        mainMap.render();
    });
    mainMap.addInteraction(slct);
    slct.setActive(false);
    select.current = slct;

    const mdf = new OlInteractionModify({
      source: printLayer.current.getSource()
    });
    mainMap.addInteraction(mdf);
    mdf.setActive(false);
    setModify(mdf); 

    return () => {
      if (slct) mainMap.removeInteraction(slct);      
      if (mdf) mainMap.removeInteraction(mdf);
    }   
  }, [mainMap]);
  

  const toolbarLeftContents = (
    <React.Fragment>
      { drawTools.map(opt =>
        <Button
          key={opt.value}
          icon={opt.icon}
          label={ opt.label ? opt.label : ''}
          tooltip={opt.title}
          className={"p-button-sm p-mr-2 tool" + (opt.value === drawTool ? " active" : "") }
          onClick={(e) => selectDrawTool(e, opt.value) }
        />
      )}     
    </React.Fragment>
  );

  const toolbarRightContents = (
    <React.Fragment>
        <Button 
          icon="pi pi-trash"
          tooltip="Eliminar elemento(s)"
          className="p-button-sm p-mr-2 tool"
          onClick={(e) => deletedSelectedFeature() }
        />
        <Button 
          icon="fas fa-search-plus"
          tooltip="Ver todos os elementos"
          className="p-button-sm p-mr-2 tool"
          onClick={(e) => zoomFeaturesExtent() }
        />        
    </React.Fragment>
  );

  return (
    <div className="print-panel-item">
      {showOnPortal(<Toast ref={toast} position="top-right" />)}
      {showOnPortal(<Toast ref={toastDialog} />)}

      <h3>{props.printItem.title}</h3>

      <div className="p-fluid">    
        <h4>Marcação do Local</h4>
        <div>
          <Toolbar left={toolbarLeftContents} right={toolbarRightContents} />
        </div>
        { printItem.location_marking && 
          <Message severity="info" text="Deverá marcar no mapa a localização pretendida" />
        }
      </div>
      
      { (printItem.restrict_scales || printItem.free_scale || printItem.map_scale) &&
      <div className="p-fluid">
        <h4>Escala de Saída</h4>
        <TabView activeIndex={scaleTabIndex} onTabChange={(e) => onScaleTabChange(e)}>
            { getScalesTabs().map(tab => tab )}
        </TabView>        
      </div> }       

      <div className="p-fluid">
        <h4>Formato</h4>
        <Dropdown id="layout" optionLabel="label" value={fields.layout} options={formats} onChange={handleFieldChange} placeholder="Selecione um Formato"/>
      </div>      

      { (printItem.form_fields && printItem.form_fields.groups) &&
        <React.Fragment>
          { Object.entries(printItem.form_fields.groups).map(([groupKey, group]) => {
            if (group.active) {
              return <div key={groupKey} className="p-fluid">
                <h4>{group.title}</h4>
                { group.fields && Object.entries(group.fields).map(([fieldKey, field]) => {
                  const field_key = groupKey + '.' + fieldKey;
                  if (field.active) {                    
                    return <div key={field_key} className="p-field">
                      { field.header && <h4>{field.header}</h4> }
                      { field.label && <label>{field.label}</label> }
                      <InputText id={field_key} className="p-inputtext-sm p-d-block" 
                        placeholder={field.title} tooltip={field.title}
                        value={fields[field_key]} onChange={handleFieldChange} />
                        { (field.required && !fields[field_key]) && <small id={field_key + "-help"} className="p-error">Campo de preenchimento obrigatório.</small> }
                    </div>
                  }
                }) }
              </div>
            }
          }) }
        </React.Fragment>
      }

      { (printItem.form_fields && printItem.form_fields.fields) &&
        <React.Fragment>
          { Object.entries(printItem.form_fields.fields).map(([fieldKey, field]) => {
            const field_key = fieldKey;
            if (field.active) {
              return <React.Fragment>
                <div key={field_key} className="p-fluid">
                  { field.header && <h4>{field.header}</h4> }
                  <div className="p-field">
                    { field.label && <label>{field.label}</label> }
                    <InputText id={field_key} className="p-inputtext-sm p-d-block" 
                      placeholder={field.title} tooltip={field.title}
                      value={fields[field_key]} onChange={handleFieldChange} />
                      { (field.required && !fields[field_key]) && <small id={field_key + "-help"} className="p-error">Campo de preenchimento obrigatório.</small> }
                  </div>
                </div>
                </React.Fragment>
              }
          }) }
        </React.Fragment>
      }

      { isPrinting ?
        <div className="card p-text-center p-mt-4" style={{ backgroundColor: "#add8e6", borderRadius: "4px" }}>
          <div><i className="pi pi-spin pi-spinner"></i> A gerar a planta ...</div>
        </div> : null
      }
      { !isPrinting && printFile ?
        <div className="card p-text-center p-mt-4" style={{ backgroundColor: "#add8e6", borderRadius: "4px" }}>
          <a href={printFile.url} target="_blank">
            <i className="pi pi-external-link p-pl-2"></i> Abrir PDF da planta
          </a>          
      </div> : null      
      }

      <div className="card">
        <div className="p-grid">
          <div className="p-col p-text-left">
            { !standalone &&
            <Button
                label="Voltar"
                icon="pi pi-chevron-left"
                className="p-button-sm"
                onClick={e => { goPanelPrintPrev(); }}
            /> }
          </div>
          <div className="p-col p-text-right">
            <Button
                label="Imprimir"
                icon="pi pi-print"
                className="p-button-sm"
                onClick={e => { doPrint(); }}
                disabled={isPrinting} 
            />
          </div>
        </div>  
      </div>      
    </div>
  )

}