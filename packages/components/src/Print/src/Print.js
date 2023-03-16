import React, { useState, useEffect, useRef } from 'react'
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import PrintPanelNoPrints from './PrintPanelNoPrints.js';
import PrintPanel1 from './PrintPanel1';
import PrintPanel2 from './PrintPanel2';
import PrintPanel3 from './PrintPanel3';
import PrintPanel4 from './PrintPanel4';
import PrintPanelItem from './PrintPanelItem';
import useFormFields from "./useFormFields";
import './style.css'

export default function Print({core, config, actions, dispatch, record}) {

  const { viewer, mainMap, Models } = config;

  // global
  const [activePanel, changeActivePanel] = useState("p1");
  const [standalone, setStandalone] = useState(false);
  const [printGroup, setPrintGroup] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const [printDetails, setPrintDetails] = useState(null);
  const [finalPrints, setFinalPrints] = useState(null);
  const [fields, handleFieldChange] = useFormFields({});
  const [geometries, setGeometries] = useState([]);

  const printLayer = useRef();

  const printStyle = new Style({
    image: new CircleStyle({
        radius: 4,
        fill: new Fill({
        color: '#fff',
        }),
        stroke: new Stroke({
        color: '#FF0000',
        width: 2,
        }),
    })
  });

  function getTotalPrints() {
    let total = 0;

    if (!viewer.printing) return total;

    if (viewer.printing.groups && viewer.printing.groups.length) {
      total += viewer.printing.groups.length;
    }
    if (viewer.printing.prints && viewer.printing.prints.length) {
      total += viewer.printing.prints.length;
    }

    return total;
  }  

  useEffect(() => {
    const total = getTotalPrints();


    if (total == 0) {
      changeActivePanel("p-noprints");
      setStandalone(false);      
    } else if (total > 1) {
      changeActivePanel("p1");
      setStandalone(false);
    } else if (viewer.printing && viewer.printing.groups && viewer.printing.groups.length > 0) {
      setPrintGroup(viewer.printing.groups[0]);
      changeActivePanel("p2");
      setStandalone(true);
    } else if (viewer.printing && viewer.printing.prints && viewer.printing.prints.length > 0) {
      setPrintItem(viewer.printing.prints[0]);
      changeActivePanel("p2-item");
      setStandalone(true);
    }
  }, []);


  // Add print layer
  useEffect(() => {
    if (!mainMap) return;

    printLayer.current = new VectorLayer({
      id: 'print',
      renderMode: 'vector',
      source: new Vector({}),
      //style: style_pts,
      selectable: false
    })

    const parentLayer = Models.Utils.findOlLayer(mainMap, 'overlays');

    if (parentLayer) {
      parentLayer.getLayers().getArray().push(printLayer.current);
    } else {
      mainMap.addLayer(printLayer.current); 
    }

    /*
    setTimeout(() => {     

      //Add theme
      dispatch(actions.viewer_add_themes(
          "componentslayer",
          [
              {
              id: "print",
              title: "Print",
              description: "Print",
              active: true,
              open: false,
              type: "VECTOR",
              opacity: 1,
              selectable: false
              }
          ]
      ));      

      setTimeout(() => {       
        printLayer.current = Models.Utils.findOlLayer(mainMap, 'print');
        //printLayer && printLayer.current.setStyle(printStyle);

        // Turn layer on
        dispatch(actions.layers_set_checked([ ...viewer.config_json.checked, 'print']));        
      }, 500);

    }, 1500);
    */

  }, [mainMap]);

  return (
    <div style={{ height: '100%' }}>

      {activePanel === "p-noprints" ?
        <PrintPanelNoPrints
          core={core}
          config={config}
          control={record}
          actions={actions}
          dispatch={dispatch}
          activePanel={activePanel}
          changeActivePanel={changeActivePanel}
        />
      : null}

      {activePanel === "p1" ?
        <PrintPanel1
          core={core}
          config={config}
          control={record}
          actions={actions}
          dispatch={dispatch}
          activePanel={activePanel}
          changeActivePanel={changeActivePanel}
          printGroup={printGroup}
          setPrintGroup={setPrintGroup}
          printItem={printItem}
          setPrintItem={setPrintItem}
          printLayer={printLayer}
          fields={fields}
          handleFieldChange={handleFieldChange}
        />
      : null}

      {activePanel === "p2" ?
        <PrintPanel2
          core={core}
          standalone={standalone}
          config={config}
          control={record}
          actions={actions}
          dispatch={dispatch}
          activePanel={activePanel}
          changeActivePanel={changeActivePanel}
          printGroup={printGroup}
          setPrintGroup={setPrintGroup}
          printLayer={printLayer}
          printDetails={printDetails}
          setPrintDetails={setPrintDetails}
          fields={fields}
          setGeometries={setGeometries}
          handleFieldChange={handleFieldChange}          
        />
      : null}

      {activePanel === "p3" ?
        <PrintPanel3
          core={core}
          config={config}
          control={record}
          actions={actions}
          dispatch={dispatch}
          activePanel={activePanel}
          changeActivePanel={changeActivePanel}
          printGroup={printGroup}
          setPrintGroup={setPrintGroup}
          printLayer={printLayer}
          printDetails={printDetails}
          setFinalPrints={setFinalPrints}
          fields={fields}
          handleFieldChange={handleFieldChange}          
        />
      : null}

      {activePanel === "p4" ?
        <PrintPanel4
          core={core}
          config={config}
          control={record}
          actions={actions}
          dispatch={dispatch}
          activePanel={activePanel}
          changeActivePanel={changeActivePanel}
          printGroup={printGroup}
          setPrintGroup={setPrintGroup}
          printLayer={printLayer}
          printDetails={printDetails}
          finalPrints={finalPrints}
          setFinalPrints={setFinalPrints}
          fields={fields}
          geometries={geometries}
        />
      : null}

      {activePanel === "p2-item" ?
        <PrintPanelItem
          core={core}
          standalone={standalone}
          config={config}
          control={record}
          actions={actions}
          dispatch={dispatch}
          activePanel={activePanel}
          changeActivePanel={changeActivePanel}
          printItem={printItem}
          setPrintItem={setPrintItem}
          printLayer={printLayer}
          printDetails={printDetails}
          finalPrints={finalPrints}
          setFinalPrints={setFinalPrints}
          fields={fields}
          handleFieldChange={handleFieldChange}           
          geometries={geometries}
        />
      : null}    

    </div>
  )

}