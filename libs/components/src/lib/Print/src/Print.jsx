import React, { useState, useEffect, useRef } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import PrintPanelNoPrints from './PrintPanelNoPrints';
import PrintPanel1 from './PrintPanel1';
import PrintPanel2 from './PrintPanel2';
import PrintPanel3 from './PrintPanel3';
import PrintPanel4 from './PrintPanel4';
import PrintPanelItem from './PrintPanelItem';
import './style.css';


// PrintPanel2/PrintPanel4/PrintPanelItem (unconverted this session) still read a
// flat `fields` object keyed by literal strings like "identification.nif" (the old
// useFormFields contract) and still call `handleFieldChange({ target: { id, value } })`.
// RHF's own store nests any dotted `name` (`identification.nif` -> `{identification:{nif}}`),
// so `watch()` alone would silently break their `fields[field_key]` reads. `layout` is the one
// field whose VALUE is itself an object ({format, orientation}, set by PrintPanel3/PrintPanelItem)
// and is never dotted — so it's excluded from the flatten below and kept as a leaf.
function flattenFieldValues(values) {
  const out = {};
  Object.entries(values || {}).forEach(([key, value]) => {
    if (key !== 'layout' && value && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        out[`${key}.${subKey}`] = subValue;
      });
    } else {
      out[key] = value;
    }
  });
  return out;
}


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

export default function Print({core, config, actions, dispatch, record}) {

  const { viewer, mainMap, Models } = config;

  // global
  const [activePanel, changeActivePanel] = useState("p1");
  const [standalone, setStandalone] = useState(false);
  const [printGroup, setPrintGroup] = useState(null);
  const [printItem, setPrintItem] = useState(null);
  const [printDetails, setPrintDetails] = useState(null);
  const [finalPrints, setFinalPrints] = useState(null);
  const [geometries, setGeometries] = useState([]);

  // Replaces the old useFormFields synthetic-event bag (B-08). PrintFormFields (nested
  // inside PrintPanel2/PrintPanelItem) reads `control` off the <FormProvider> below via
  // useFormContext(); PrintPanel3 gets `formControl`/`setFieldValue` as explicit props
  // (it's a direct child here). PrintPanel1/2/4/PrintPanelItem (unconverted this session)
  // keep receiving `fields`/`handleFieldChange` shimmed to the exact old calling convention.
  const formMethods = useForm({ mode: 'onChange', defaultValues: {} });
  const { control, watch, setValue } = formMethods;
  const fields = flattenFieldValues(watch());
  const handleFieldChange = ({ target }) => setValue(target.id, target.value, { shouldValidate: true, shouldDirty: true });

  const printLayer = useRef();

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
    
    if (!viewer?.loaded) return;

    const _layer = Models.Utils.findOlLayer(mainMap, 'print');

    if (_layer) {
      printLayer.current = _layer;
    } else {
      printLayer.current = new VectorLayer({
        id: 'print',
        renderMode: 'vector',
        source: new Vector({}),
        //style: style_pts,
        selectable: false
      });

      const parentLayer = Models.Utils.findOlLayer(mainMap, 'overlays');

      if (parentLayer) {
        parentLayer.getLayers().getArray().push(printLayer.current);
      } else {
        mainMap.addLayer(printLayer.current); 
      }
    }

  }, [viewer?.loaded, mainMap]);

  if (!printLayer.current) return null;

  return (
    <FormProvider {...formMethods}>
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
          formControl={control}
          setFieldValue={setValue}
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
    </FormProvider>
  )

}