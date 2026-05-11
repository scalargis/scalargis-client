import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Message } from 'primereact/message';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Card } from 'primereact/card';
import OlInteractionDraw from "ol/interaction/Draw";
import OlInteractionModify from "ol/interaction/Modify";
import OlInteractionSelect from "ol/interaction/Select";
import { singleClick } from "ol/events/condition";
import Collection from 'ol/Collection.js';
import Feature from 'ol/Feature';
import {
  LineString,
  LinearRing,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  GeometryCollection
} from 'ol/geom';
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import {BufferOp} from 'jsts/org/locationtech/jts/operation/buffer';

import { i18n } from '../../components';

import IntersectResults from './IntersectResults';

import { MAPCONTROL_NAME, DEFAULT_DRAWING_TOOLS } from './utils';

import './style.css';


export default function IntersectForm(props) {

  const { core, intersectLayer, config, actions, componentId, intersectConfig, setBlockedPanel } = props;
  const { viewer, mainMap, dispatch, Models } = config;
  const { showOnPortal } = Models.Utils;
  const { getProjectionSrid } = Models.MapModel;
  const { exclusive_mapcontrol } = viewer;

  const t = i18n.translateValue;

  const API_URL = core.API_URL;

  const [drawTool, setDrawTool] = useState(null);
  const [draw , setDraw] = useState(null);
  const copyGeometry = useRef(null);
  const select = useRef(null);  
  const [modify, setModify] = useState(null);

  const [selectedFeatures, setSelectedFeatures] = useState([]);
    
  const [isLoading, setIsLoading] = useState(false);
  const [geometryIntersection, setGeometryIntersection] = useState([]);
  const [showGeometry, setShowGeometry] = useState(true);

  const [buffer, setBuffer] = useState(0);

  const [searchParams, setSearchParams] = useState(null);
  const [results, setResults] = useState([]);
  const [showNoResultsMsg, setShowNoResultsMsg] = useState(false);

  const toastDialog = useRef(null);

  const geometryCol = useRef(new Collection([]));

  const drawingOptionsTools = useMemo(() => {
    const _tools = intersectConfig?.drawTools || DEFAULT_DRAWING_TOOLS;      
    return _tools.map(t => t.toLowerCase());
  }, [intersectConfig?.drawTools]);

  let drawTools = [
    { value: "Point", title: "addPoint", "defaultTitle": "Adicionar ponto", icon: "fas fa-circle" },
    { value: "LineString", title: "addLine", "defaultTitle": "Adicionar linha", icon: "pi pi-minus" },
    { value: "Polygon", title: "addPolygon", "defaultTitle": "Adicionar polígono", icon: "fas fa-draw-polygon" },
    { value: "Copy", title: "copyFeature", "defaultTitle": "Copiar geometria", icon: "pi pi-copy" },
    { value: "Select", title: "selectElement", "defaultTitle": "Selecionar elemento", icon: "fas fa-mouse-pointer" },
    { value: "Modify", title: "editElement", "defaultTitle": "Editar elemento", icon: "pi pi-pencil" }     
  ];

  if (intersectConfig?.drawTools?.length) {
    const _tools = intersectConfig.drawTools.map((t) => t.toLowerCase());
    drawTools = drawTools.filter((tool) => {
      return  _tools.includes(tool.value.toLowerCase());
    });
  }

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
      const source = intersectLayer.current.getSource();
      const di = new OlInteractionDraw({
        source: source,
        type: type,
      });
      mainMap.addInteraction(di);
      di.on('drawend', (e) => {
        if (select.current) select.current.getFeatures().clear();          
        intersectLayer.current.getSource().getFeatures().forEach((f) => {
          if (f.get('_componentId') == componentId && f != e.feature) intersectLayer.current.getSource().removeFeature(f);
        });
        e.feature.set("_componentId", componentId)
        e.feature.set("_type", "input");

        setGeometryIntersection([e.feature.getGeometry().clone()]);

        geometryCol.current.clear();
        geometryCol.current.push(e.feature);
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
      group: `${MAPCONTROL_NAME}-${componentId}`,
      message: ` ${t("copyGeometryConfirmation", "Deseja copiar a geometria selecionada?")}`,
      header: t("confirmation", "Confirmação"),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t("yes", "Sim"),
      rejectLabel: t("no", "Não"),
      defaultFocus: "reject",
      accept: () => {       
        intersectLayer.current.getSource().getFeatures().forEach((f) => {
          if (f.get('_componentId') == componentId && f != feature) intersectLayer.current.getSource().removeFeature(f);
        });

        const _feat = new Feature({
          geometry: feature.getGeometry().clone()
        });

        _feat.set("_componentId", componentId)
        _feat.set("_type", "input");

        intersectLayer.current.getSource().addFeature(_feat);

        setGeometryIntersection([_feat.getGeometry().clone()]);

        geometryCol.current.clear();
        geometryCol.current.push(_feat);
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
          setGeometryIntersection([]);
        },
        reject: () =>  { /* noop */ }      
    });
  }  

  function deletedSelectedFeature() {
    setGeometryIntersection([]);
  }

  function zoomFeaturesExtent() {
    if (!intersectLayer.current) return;

    let extent;
    intersectLayer.current.getSource().getFeatures().forEach((f) => {
      if (f.get('_componentId') == componentId && f.get('_type') == 'input') {
        if (!extent) {
          extent = f.getGeometry().getExtent();
        } else {
          extent = Models.Utils.extendExtent(extent, f.getGeometry().getExtent());
        }
      }

      if (extent) {
        const center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2];

        if ((extent[2] - extent[0]) < 500 || (extent[3] - extent[1]) < 500) {
          extent = [center[0] - 250, center[1] - 250, center[0] + 250, center[1] + 250];
        }
  
        dispatch(actions.map_set_extent(center, extent));
      }
    });
  }

  const doSearch = (props) => {
    let url = '/spatial_toolbox/api';
    let path = 'intersect';
    if (intersectConfig?.apiUrl) {
      url = intersectConfig.apiUrl;
      path = null;
    }

    const provider = core.services.data.provider(url);

    const outProj = 'EPSG:4326';

    if (geometryCol?.current?.getLength && !geometryCol.current.getLength()) {
      toastDialog.current.show({ severity: 'warn', summary: t("error", "Error"), detail: t("geometryRequiredMsg", "É obrigatório definir a geometria") }); 
      return;
    }

    const parser = new OL3Parser();
    parser.inject(
      Point, 
      LineString, 
      LinearRing, 
      Polygon, 
      MultiPoint, 
      MultiLineString, 
      MultiPolygon, 
      GeometryCollection
    );

    const geomsWKT = [];
    let isValid = true;
    geometryCol.current.forEach((f) => {
      let geom = f.getGeometry().clone();

      if (intersectConfig?.maxArea && (geom.getType().toLowerCase().includes('polygon') || buffer )) {
        let area;

        if (intersectConfig.dataSrid) {
          geom = geom.transform(mainMap.getView().getProjection().getCode(), `EPSG:${intersectConfig.dataSrid}`);
        }

        if (geom.getType().toLowerCase().includes('polygon')) {
          area = geom.getArea();
        }

        if (buffer > 0) {
          // convert the OpenLayers geometry to a JSTS geometry
          const jstsGeom = parser.read(geom);
          const jstsBuffer = BufferOp.bufferOp(jstsGeom, buffer);
          geom = parser.write(jstsBuffer);
          area = geom.getArea();
        }

        if (area > intersectConfig.maxArea) {
          isValid = false;
        }
      }

      geomsWKT.push(Models.MapModel.getWKTFromGeometry(f.getGeometry().clone().transform(mainMap.getView().getProjection().getCode(), outProj)));
    });

    if (!isValid) {
      const msg = t("geometryMaxAreaMsg", "A geometria não pode ultrapassar a área máxima permitida: {{maxArea}}", undefined, undefined, undefined, { maxArea: `${intersectConfig.maxArea} m².` });
      toastDialog.current.show({ severity: 'warn', summary: t("error", "Error"), detail: msg });
      return
    }

    const data = {
      'code': intersectConfig?.config_id || null,
      'geom_wkt': geomsWKT.join(';'),
      'geom_srid': getProjectionSrid(outProj),
      'buffer': buffer,
      'buffer_srid': intersectConfig?.dataSrid ? intersectConfig?.dataSrid : getProjectionSrid(mainMap.getView().getProjection()),
      'out_srid': getProjectionSrid(outProj)
    };

    setSearchParams({...data});

    setDrawTool(null);

    setBlockedPanel(true);

    provider.getSimple(path, data).then(result => {
      setShowNoResultsMsg(true);
      setResults(result?.data);
    }).catch(error => {
      toastDialog.current.show({ severity: 'error', summary: 'Error', detail: 'Ocorreu um erro ao executar a análise.' });
      console.log('error', error);
    }).finally(()=>{
      setBlockedPanel(false);
    });

  }

  const clearAll = () => {
    setDrawTool(null);
    setResults([]);
    setShowNoResultsMsg(false);
    setGeometryIntersection([]);
    setShowGeometry(false);
    setBuffer(0);
    setSearchParams(null);
    geometryCol.current.clear();

    intersectLayer.current.getSource().getFeatures().forEach((f) => {
      if (f.get('_componentId') == componentId) {
        intersectLayer.current.getSource().removeFeature(f);
      }
    });
  }

  useEffect(() => {
    if (drawTool) {
      dispatch(actions.viewer_set_exclusive_mapcontrol('Print'));
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
    if (viewer?.config_json?.selected_menu != componentId) {
      if (copyGeometry.current) {
        const _drawTool = drawTool || "";
        if (_drawTool.toLocaleLowerCase() == "copy") {
          setDrawTool(null);
        }
      }
    }
  },  [viewer?.config_json?.selected_menu]);

  useEffect(() => {
    if (drawTool && exclusive_mapcontrol != 'Print') {
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
        if (!feature || !layer) return false;

        if (intersectLayer.current && layer.get('id') == intersectLayer.current.get('id')) return false;
        
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

          toastDialog.current.show({
            severity: 'warn', summary:  t("copyGeometry", "Copiar geometria"),
            detail: t("copyGeometryNotSupportedMsg", "O tipo de geometria não é permitido ({{type}}).", undefined, undefined, undefined, { type: feature.getGeometry().getType()}), life: 3000
          });

          return true;
        }

        confirmCopyFeatureGeometry(feature);
        return true;
      }
    });

    // Select interaction
    copyGeom.on('select', function (e) {
      mainMap.render();
    });
    mainMap.addInteraction(copyGeom);
    copyGeom.setActive(false);
    copyGeometry.current = copyGeom;

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

    // Modify interaction
    const mdf = new OlInteractionModify({
      features: geometryCol.current
    });
    mdf.on('modifyend', function (e) {
      setGeometryIntersection([e.features.getArray()[0].getGeometry().clone()]);
    });

    mainMap.addInteraction(mdf);
    mdf.setActive(false);
    setModify(mdf); 

    return () => {
      if (slct) mainMap.removeInteraction(slct);      
      if (mdf) mainMap.removeInteraction(mdf);
    }   
  }, [mainMap]);

  useEffect(() => {
    if (!mainMap) return;
    if (!intersectLayer.current) return;

    if (!geometryIntersection?.length) {
      intersectLayer.current.getSource().getFeatures().forEach((f) => {
        if (f.get('_componentId') == componentId && f.get('_type') == 'input') {
          intersectLayer.current.getSource().removeFeature(f);
        }
      });
      geometryCol.current.clear();
      mainMap.getView().changed();
    }
  }, [geometryIntersection]);


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
          size="small"
          className="p-button mr-1 tool"
          onClick={(e) => deletedSelectedFeature() }
        />
        <Button 
          icon="fas fa-search-plus"
          title={t("viewAllElements", "Ver todos os elementos")}
          size="small"
          className="p-button tool"
          onClick={(e) => zoomFeaturesExtent() }
        />        
    </React.Fragment>
  );

  const geometryError = !geometryIntersection?.length ? true : false;

  return (
    <div>
      {showOnPortal(<Toast ref={toastDialog} />)}
      <ConfirmDialog group={`${MAPCONTROL_NAME}-${componentId}`} />

      { intersectConfig?.content?.title && <h3 className="my-2">{t(intersectConfig.content.title, intersectConfig.content.title)}</h3> }

      { intersectConfig?.content?.description && <Card className="mt-2">
        <div dangerouslySetInnerHTML={{__html: t(intersectConfig.content.description, intersectConfig.content.description)}}></div>
      </Card> }

      <div className="p-fluid">
        <h4>{t("locationMarking", "Marcação do Local")}</h4>
        <div>
          <Toolbar start={toolbarLeftContents} end={toolbarRightContents} className="px-1 py-2" />
        </div>
        <Message className="mt-2" severity={ geometryError === true ? "warn" : "info" } text={`${t("locationMarkingMsg", "Deverá marcar no mapa a localização pretendida")}.`} />
      </div>

      { intersectConfig?.bufferOption !== false && <div className="p-fluid mt-3">
        <div className="field">
            <label htmlFor="buffer">{`${t("areaOfInfluence", "Área de influência")} (${t("meters", "Metros").toLowerCase()})`}</label>
            <InputNumber id="buffer"  value={buffer} onValueChange={(e) => setBuffer(e.value)} useGrouping={false} />
        </div>
      </div> }

      <div className="text-center mt-1">
        
      </div>

      <div className="grid mt-2">
        <div className="col text-center">
          <Button label={t("clear", "Limpar")} className="p-button-secondary" onClick={(e) => clearAll([])} />
        </div>
        <div className="col text-center">
          <Button label={t("execute", "Executar")} className="p-button-primary" onClick={(e) => doSearch({"buffer": buffer })} />
        </div>
      </div>

      {results?.layers?.length ?
        <IntersectResults
          title={props?.title}
          core={core}
          Models={Models}
          viewer={viewer}
          actions={actions}
          dispatch={dispatch}
          mainMap={mainMap}
          componentId={componentId}
          intersectConfig={intersectConfig}
          intersectLayer={intersectLayer}
          searchParams={searchParams}
          results={results}
          groupResults={intersectConfig?.groupResults || false}
          showGeometry={showGeometry}
          setShowGeometry={setShowGeometry}
        /> :
        showNoResultsMsg && <div className="p-fluid mt-4">
          <Message
            severity="info"
            text={(t( "noResults", "Sem resultados"))}
          />
        </div>
      }

    </div>
  )

}