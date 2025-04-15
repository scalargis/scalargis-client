import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { Message } from 'primereact/message';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { Card } from 'primereact/card';
import OlInteractionDraw from "ol/interaction/Draw";
import OlInteractionModify from "ol/interaction/Modify";
import OlInteractionSelect from "ol/interaction/Select";
import { singleClick } from "ol/events/condition";
import Collection from 'ol/Collection.js';

import { i18n } from '@scalargis/components';

import IntersectResults from './IntersectResults';

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

  let drawTools = [
    { value: "Point", title: "addPoint", "defaultTitle": "Adicionar ponto", icon: "fas fa-circle" },
    { value: "LineString", title: "addLine", "defaultTitle": "Adicionar linha", icon: "pi pi-minus" },
    { value: "Polygon", title: "addPolygon", "defaultTitle": "Adicionar polígono", icon: "fas fa-draw-polygon" },
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
        //if (!printGroup.multi_geom) {
          if (select.current) select.current.getFeatures().clear();          
          intersectLayer.current.getSource().getFeatures().forEach((f) => {
            if (f.get('_componentId') == componentId && f != e.feature) intersectLayer.current.getSource().removeFeature(f);
          });
          e.feature.set("_componentId", componentId)
          e.feature.set("_type", "input");

          setGeometryIntersection([e.feature.getGeometry().clone()]);

          geometryCol.current.clear();
          geometryCol.current.push(e.feature);
        //}
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
        message: ` ${t("deleteAllElments", "Deseja eliminar todos os elementos?")}`,
        header: t("confirmation", "Confirmação"),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: t("yes", "Sim"),
        rejectLabel: t("no", "Não"),
        accept: () => {
          setGeometryIntersection([]);
        },
        reject: () =>  { }      
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
        let center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2];

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

    const geomsWKT = [];
    geometryCol.current.forEach((f) => {
      geomsWKT.push(Models.MapModel.getWKTFromGeometry(f.getGeometry().clone().transform(mainMap.getView().getProjection().getCode(), outProj)));
    });

    const data = {
      'code': intersectConfig?.config_id || null,
      'geom_wkt': geomsWKT.join(';'),
      'geom_srid': getProjectionSrid(outProj),
      'buffer': buffer,
      //'buffer_srid': getProjectionSrid(mainMap.getView().getProjection()),
      'buffer_srid': intersectConfig?.bufferSrid ? intersectConfig?.bufferSrid : getProjectionSrid(mainMap.getView().getProjection()),
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
      { drawTools.map(opt =>
        <Button
          key={opt.value}
          icon={opt.icon}
          label={ opt.label ? opt.label : ''}
          title={t(opt.title, opt.defaultTitle)}
          className={"p-button mr-1 tool" + (opt.value === drawTool ? " active" : "") }
          onClick={(e) => selectDrawTool(e, opt.value) }
        />
      )}     
    </React.Fragment>
  );

  const toolbarRightContents = (
    <React.Fragment>
        <Button 
          icon="pi pi-trash"
          title={t("deleteSelectedElment", "Eliminar elemento selecionado")}
          className="p-button mr-1 tool"
          onClick={(e) => deletedSelectedFeature() }
        />
        <Button 
          icon="fas fa-search-plus"
          title={t("viewAllElements", "Ver todos os elementos")}
          className="p-button tool"
          onClick={(e) => zoomFeaturesExtent() }
        />        
    </React.Fragment>
  );

  const geometryError = !geometryIntersection?.length ? true : false;

  return (
    <div>
      {showOnPortal(<Toast ref={toastDialog} />)}

      { intersectConfig?.content?.title && <h3 className="my-2">{t(intersectConfig.content.title, intersectConfig.content.title)}</h3> }

      { intersectConfig?.content?.description && <Card className="mt-2">
        <div dangerouslySetInnerHTML={{__html: t(intersectConfig.content.description, intersectConfig.content.description)}}></div>
      </Card> }

      <div className="p-fluid">
        <h4>{t("locationMarking", "Marcação do Local")}</h4>
        <div>
          <Toolbar start={toolbarLeftContents} end={toolbarRightContents} className="px-1 py-2" />
        </div>
        <Message className="mt-2" severity={ geometryError === true ? "warn" : "info" } text={t("locationMarkingMsg", "Deverá marcar no mapa a localização pretendida")} />
      </div>

      <div className="p-fluid mt-3">
        <div class="field">
            <label htmlFor="buffer">{`${t("areaOfInfluence", "Área de influência")} (${t("meters", "Metros").toLowerCase()})`}</label>
            <InputNumber id="buffer"  value={buffer} onValueChange={(e) => setBuffer(e.value)} useGrouping={false} />
        </div>
      </div>

      <div className="text-center mt-1">
        
      </div>

      <div className="grid">
        <div className="col text-center">
          <Button label={t("clear", "Limpar")} className="p-button-secondary" onClick={(e) => clearAll([])} />
        </div>
        <div className="col text-center">
          <Button label={t("execute", "Executar")} className="p-button-primary" onClick={(e) => doSearch({"buffer": buffer })} />
        </div>
      </div>

      {results?.layers?.length ?
        <IntersectResults
          mainMap={mainMap}
          componentId={componentId}
          intersectConfig={intersectConfig}
          intersectLayer={intersectLayer}
          searchParams={searchParams}
          results={results}
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