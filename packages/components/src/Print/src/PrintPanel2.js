import React, { useState, useEffect, useRef } from 'react'
import Cookies from 'universal-cookie'
import { Button } from 'primereact/button'
import { Toolbar } from 'primereact/toolbar';
import {InputText} from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import OlInteractionDraw from "ol/interaction/Draw";
import OlInteractionModify from "ol/interaction/Modify";
import OlInteractionSelect from "ol/interaction/Select";
import { shiftKeyOnly, singleClick } from "ol/events/condition";
import { v4 as uuidV4 } from 'uuid'
import './style.css'

export default function PrintPanel2(props) {

  const { core, control, printGroup, printLayer, setPrintDetails, fields, setGeometries, handleFieldChange, standalone, config, actions } = props;
  const { viewer, mainMap, dispatch, Models } = config;
  const { showOnPortal } = Models.Utils;
  const { exclusive_mapcontrol } = viewer;

  const API_URL = core.API_URL;

  const [drawTool, setDrawTool] = useState(null);
  const [draw , setDraw] = useState(null);
  const select = useRef(null);  
  const [modify, setModify] = useState(null);

  const [selectedFeatures, setSelectedFeatures] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const toastDialog = useRef(null);

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
        if (!printGroup.multi_geom) {
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
    props.setPrintGroup(null);
    if (draw) mainMap.removeInteraction(draw);
    props.changeActivePanel('p1');
  }

  function goPanelPrintNext() {

    let isFormInvalid = false;

    const formData = {};
    if (printGroup.form_fields && printGroup.form_fields.groups) {
      Object.entries(printGroup.form_fields.groups).forEach(([groupKey, group]) => {
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
    if (printGroup.form_fields && printGroup.form_fields.fields) {
      Object.entries(printGroup.form_fields.fields).forEach(([fieldKey, field]) => {
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

    if (printGroup.location_marking && !isFormInvalid) {
      const ft = printLayer.current.getSource().getFeatures();
      if (ft.length == 0) isFormInvalid = true;
    }

    //Abort if form is not valid
    if (isFormInvalid) return;

    setDrawTool(null);    
    setIsLoading(true);

    const geoms = [];
    printLayer.current.getSource().getFeatures().forEach((f) => {
      geoms.push(f.getGeometry().clone());      
    });
    setGeometries(geoms);

    let record = {
      geom_filter: geoms.map(g => {return Models.MapModel.getWKTFromGeometry(g);}),
      geom_srid: Models.MapModel.getProjectionSrid(mainMap.getView().getProjection().getCode())
    }

    // Save request
    let options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'        
      },
      method: 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    // Auth url. TODO: check for proxy
    let url = printGroup.resource_url;
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        setIsLoading(false);               

        function setExtraPropsRecursive(obj, printsIds)
        {
            obj.prints.forEach(p => {
              p['uuid'] = String(uuidV4());
              p['selected'] = true;

              printsIds.push(p['uuid']);
            })
            obj.children.forEach(c => {
              setExtraPropsRecursive(c, printsIds);
            })
        }

        const data = {...res};
        data['userFormData'] = {...formData};

        const printsIds = [];

        setExtraPropsRecursive(data, printsIds);
        data['selected'] = printsIds;        

        setPrintDetails(data);
        props.changeActivePanel("p3");
      }).catch(error => {
        setIsLoading(false); 
        /*
        toastEl.show({
          severity: 'error',
          summary: 'Ocorreu um erro inesperado',
          detail: "Não foi possível obter a informação das plantas.",
          sticky: false
        });
        */
      });   
  }

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
          tooltip="Eliminar elemento selecionado"
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
    <div className="print-panel2">
      {showOnPortal(<Toast ref={toastDialog} />)}

      <h3>{props.printGroup.title}</h3>

      {(printGroup.allow_drawing !== false) && <div className="p-fluid">
        <h4>Marcação do Local</h4>
        <div>
          <Toolbar left={toolbarLeftContents} right={toolbarRightContents} />
        </div>
        { printGroup.location_marking && 
          <Message severity="info" text="Deverá marcar no mapa a localização pretendida" />
        }
      </div>}

      { (printGroup.form_fields && printGroup.form_fields.groups) &&
        <React.Fragment>
          { Object.entries(printGroup.form_fields.groups).map(([groupKey, group]) => {
            if (group.active) {
              return <div key={groupKey} className="p-fluid">
                <h4>{group.title}</h4>
                { group.fields && Object.entries(group.fields).map(([fieldKey, field]) => {
                  const field_key = groupKey + '.' + fieldKey;
                  if (field.active) {                    
                    return <div className="p-field">
                      { field.header && <h4>{field.header}</h4> }
                      { field.label && <label>{field.label}</label> }
                      <InputText key={field_key} id={field_key} className="p-inputtext-sm p-d-block" 
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

      { (printGroup.form_fields && printGroup.form_fields.fields) &&
        <React.Fragment>
          { Object.entries(printGroup.form_fields.fields).map(([fieldKey, field]) => {
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

      <div className="card">
        <div className="p-grid">
          <div className="p-col p-text-left">
            {!standalone &&
            <Button
                label="Voltar"
                icon="pi pi-chevron-left"
                className="p-button-sm"
                onClick={e => { goPanelPrintPrev(); }}
            />
            }
          </div>
          <div className="p-col p-text-right">
            <Button
                label="Continuar"
                icon={isLoading ? "pi pi-spin pi-spinner": ""}
                className="p-button-sm"
                onClick={e => { goPanelPrintNext(); }}
                disabled={isLoading} 
            />
          </div>
        </div>  
      </div>      
    </div>
  )

}