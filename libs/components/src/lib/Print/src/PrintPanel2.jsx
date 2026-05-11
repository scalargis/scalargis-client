import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation} from "react-i18next";
import { v4 as uuidV4 } from 'uuid';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import {InputText} from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import OlInteractionDraw from "ol/interaction/Draw";
import OlInteractionModify from "ol/interaction/Modify";
import OlInteractionSelect from "ol/interaction/Select";
import Feature from 'ol/Feature';
import { singleClick } from "ol/events/condition";

import { MAPCONTROL_NAME, DEFAULT_DRAWING_TOOLS } from './utils';

import './style.css';


export default function PrintPanel2(props) {

  const { core, control, printGroup, printLayer, setPrintDetails, fields, setGeometries, handleFieldChange, standalone, config, actions } = props;
  const { viewer, mainMap, dispatch, Models } = config;
  const { showOnPortal } = Models.Utils;
  const { exclusive_mapcontrol } = viewer;

  const { t } = useTranslation();

  const API_URL = core.API_URL;

  const [drawTool, setDrawTool] = useState(null);
  const [draw , setDraw] = useState(null);
  const copyGeometry = useRef(null);
  const select = useRef(null);  
  const [modify, setModify] = useState(null);

  const [selectedFeatures, setSelectedFeatures] = useState([]);
    
  const [isLoading, setIsLoading] = useState(false);
  const [geometryError, setGeometryError] = useState(false);  

  const toast = useRef(null);

    const drawingOptionsTools = useMemo(() => {
      const _tools = control?.config_json?.drawingOptions?.tools || DEFAULT_DRAWING_TOOLS;
      return _tools.map(t => t.toLowerCase());
    }, [control?.config_json?.drawingOptions?.tools]);

  const drawTools = [
    { value: "Point", title: "addPoint", "defaultTitle": "Adicionar ponto", icon: "fas fa-circle" },
    { value: "LineString", title: "addLine", "defaultTitle": "Adicionar linha", icon: "pi pi-minus" },
    { value: "Polygon", title: "addPolygon", "defaultTitle": "Adicionar polígono", icon: "fas fa-draw-polygon" },
    { value: "Copy", title: "copyFeature", "defaultTitle": "Copiar geometria", icon: "pi pi-copy" },
    { value: "Select", title: "selectElement", "defaultTitle": "Selecionar elemento", icon: "fas fa-mouse-pointer" },
    { value: "Modify", title: "editElement", "defaultTitle": "Editar elemento", icon: "pi pi-pencil" }     
  ];

  function selectDrawTool(e, tool) {
    e.preventDefault();
    e.target.blur();

    if (drawTool != tool) setDrawTool(tool);
    else setDrawTool(null);
  }

  function addInteraction(type) {
    if (draw) mainMap.removeInteraction(draw);
    if (copyGeometry.current) copyGeometry.current.setActive(false);
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
    } else if (type === 'Copy') {
      copyGeometry.current.setActive(true);
    } else if (type === 'Select') {
      select.current.setActive(true);      
    } else if (type === 'Modify') {
      modify.setActive(true);      
    }
  }

  const confirmCopyFeatureGeometry = (feature) => {
    confirmDialog({
      group: `${MAPCONTROL_NAME}-${control.id}`,
      message: ` ${t("copyGeometryConfirmation", "Deseja copiar a geometria selecionada?")}`,
      header: t("confirmation", "Confirmação"),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t("yes", "Sim"),
      rejectLabel: t("no", "Não"),
      defaultFocus: "reject",
      accept: () => {
        // Chek if the print item allows multiple geometries, clear the previous geometries if not
        if (!printGroup.multi_geom) {
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
    confirmDialog({
        message: ` ${t("deleteAllElments", "Deseja eliminar todos os elementos?")}`,
        header: t("confirmation", "Confirmação"),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t("yes", "Sim"),
        rejectLabel: t("no", "Não"),
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
      const center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2];

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
            formData[fieldName] = encodeURIComponent(val);
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
          formData[fieldName] = encodeURIComponent(val);
        } else {
          if (field.required) isFormInvalid = true;
        }
      });
    }

    if (printGroup.location_marking) {
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
    setIsLoading(true);

    const geoms = [];
    printLayer.current.getSource().getFeatures().forEach((f) => {
      geoms.push(f.getGeometry().clone());      
    });
    setGeometries(geoms);

    const record = {
      geom_filter: geoms.map(g => {return Models.MapModel.getWKTFromGeometry(g);}),
      geom_srid: Models.MapModel.getProjectionSrid(mainMap.getView().getProjection().getCode())
    }

    // Save request
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'        
      },
      method: 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
    const logged = core.getLoggedUser();
    if (logged) options.headers['X-API-KEY'] = logged.token;

    // Auth url. TODO: check for proxy
    const url = printGroup.resource_url;
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


  useEffect(()=> {
    const fn_change = printLayer.current.getSource().on('change', () => {      
      if (printGroup.location_marking) {
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
      if (modify) modify.setActive(false);
    }    
  }, [drawTool]);

  useEffect(() => {
    if (drawTool && exclusive_mapcontrol != MAPCONTROL_NAME) {
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

          toast.current.show({
            severity: 'warn', summary:  t("copyGeometry", "Copiar geometria"),
            detail: t("copyGeometryNotSupportedMsgs", "O tipo de geometria não é permitido ({{type}}).", { type: feature.getGeometry().getType()}), life: 3000
          });

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
      source: printLayer.current.getSource()
    });
    mainMap.addInteraction(mdf);
    mdf.setActive(false);
    setModify(mdf); 

    return () => {
      if (copyGeom) mainMap.removeInteraction(copyGeom);
      if (slct) mainMap.removeInteraction(slct);      
      if (mdf) mainMap.removeInteraction(mdf);
    }   
  }, [mainMap]);


  const toolbarLeftContents = (
    <React.Fragment>
      {drawTools.filter( opt => {
        if (drawingOptionsTools.length === 0) return true;
        return drawingOptionsTools.includes(opt.value.toLowerCase());
       }).map(opt => <Button
          key={opt.value}
          icon={opt.icon}
          label={opt.label ? opt.label : ''}
          title={t(opt.title, opt.defaultTitle)}
          className={"p-button-sm mr-1 tool" + (opt.value === drawTool ? " active" : "")}
          onClick={(e) => selectDrawTool(e, opt.value)}
        />
      )}
    </React.Fragment>
  );

  const toolbarRightContents = (
    <React.Fragment>
        <Button 
          icon="pi pi-trash"
          title={t("deleteSelectedElment", "Eliminar elemento selecionado")}
          className="p-button-sm mr-1 tool"
          onClick={(e) => deletedSelectedFeature() }
        />
        <Button 
          icon="fas fa-search-plus"
          title={t("viewAllElements", "Ver todos os elementos")}
          className="p-button-sm mr-1 tool"
          onClick={(e) => zoomFeaturesExtent() }
        />        
    </React.Fragment>
  );  

  return (
    <div className="print-panel2">
      {showOnPortal(<Toast ref={toast} position="top-right" />)}
      <ConfirmDialog group={`${MAPCONTROL_NAME}-${control.id}`} />

      <h3>{props.printGroup.title}</h3>

      {(printGroup.allow_drawing !== false) && <div className="p-fluid">
        <h4>{t("locationMarking", "Marcação do Local")}</h4>
        <div>
          <Toolbar start={toolbarLeftContents} end={toolbarRightContents} className="pl-2 pr-2" />
        </div>
        { printGroup.location_marking && 
          <Message severity={ geometryError === true ? "error" : "info" } className="mt-2" text={t("locationMarkingMsg", "Deverá marcar no mapa a localização pretendida")} />
        }
      </div>}

      { (printGroup.form_fields && printGroup.form_fields.groups) &&
        <div className="mt-2">
          { Object.entries(printGroup.form_fields.groups).map(([groupKey, group]) => {
            if (group.active) {
              return <div key={groupKey} className="p-fluid">
                <h4>{group.title}</h4>
                { group.fields && Object.entries(group.fields).map(([fieldKey, field]) => {
                  const field_key = groupKey + '.' + fieldKey;
                  if (field.active) {                    
                    return <div className="field">
                      { field.header && <h4>{field.header}</h4> }
                      { field.showLabel && <label>{field.title}</label> }
                      <InputText key={field_key} id={field_key} className="p-inputtext block" 
                        placeholder={!field.header && !field.showLabel ? field.title : ''}
                        title={!field.header && !field.showLabel ? field.title : ''}
                        value={fields[field_key]} onChange={handleFieldChange} />
                        { (field.required && !fields[field_key]) && <small id={field_key + "-help"} className="p-error">{t("requiredField", "Campo de preenchimento obrigatório")}.</small> }
                    </div>
                  }
                }) }
              </div>
            }
          }) }
        </div>
      }

      { (printGroup.form_fields && printGroup.form_fields.fields) &&
        <div className="mt-2">
          { Object.entries(printGroup.form_fields.fields).map(([fieldKey, field]) => {
            const field_key = fieldKey;
            if (field.active) {
              return <div key={field_key} className="p-fluid">
                  { field.header && <h4>{field.header}</h4> }
                  <div className="field">
                    { field.showLabel && <label>{field.title}</label> }
                    <InputText id={field_key} className="p-inputtext block" 
                      placeholder={!field.header && !field.showLabel ? field.title : ''}
                      title={!field.header && !field.showLabel ? field.title : ''}                      
                      value={fields[field_key]} onChange={handleFieldChange} />
                      { (field.required && !fields[field_key]) && <small id={field_key + "-help"} className="p-error">{t("requiredField", "Campo de preenchimento obrigatório")}.</small> }
                  </div>
                </div>
              }
          }) }
        </div>
      }

      <div className="card">
        <div className="grid">
          <div className="col text-left">
            {!standalone &&
            <Button
                label={t("back", "Voltar")}
                icon="pi pi-chevron-left"
                className="p-button-sm"
                onClick={e => { goPanelPrintPrev(); }}
            />
            }
          </div>
          <div className="col text-right">
            <Button
                label={t("continue", "Continuar")}
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