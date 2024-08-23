import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import {Steps} from 'primereact/steps';
import { v4 as uuidV4 } from 'uuid';

import { i18n } from '@scalargis/components';
import { I18N_NAMESPACE, loadTranslations } from './i18n/index';
import WizardStepType from './wizard/stepType';
import WizardStepData from './wizard/stepData';
import WizardStepConfirm from './wizard/stepConfirm';
import componentMessages from './messages';
import './index.css'


const items = [
  { value: "stepType", label: "Tipo" },
  { value: "stepData", label: "Dados" },
  { value: "stepConfirm", label: "Confirmar" }
];

const source_types = [
  { value: 'wms', label: 'WMS - Web Map service' },
  { value: 'wmts', label: 'WMTS - Web Map Tile Service' },
  { value: 'wfs', label: 'WFS - web Feature Service' },
  { value: 'arcgismap', label: 'ArcGIS REST - Map Service' },
  { value: 'shape', label: 'Shapefile - ficheiro .zip contendo .shp' },
  { value: 'kml', label: 'KML - Keyhole Markup Language' },
  { value: 'gml', label: 'GML - Geographic Markup Language' },
  { value: 'geojson', label: 'GeoJSON' },
  { value: 'dxf', label: 'DXF (v2000)' },
  { value: 'cog', label: 'COG (GeoTiff)' },
  { value: 'group', label: 'Grupo de Temas' },
];

const initialData = {
  crs: "4326",
  dataitems: [],
  get_feature_info_format: "text/plain",
  get_map_format: "image/png",
  items: [],
  type: "",
  url: "",
  wmsIgnoreServiceUrl: true,
  wmsTiled: true,
  wmsVersion: "1.3.0",
  wmtsIgnoreServiceUrl: true,
  wmtsVersion: "1.0.0"
};


/**
 * Component Translations
 */
export const translations = { 
  load: loadTranslations
};


/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {
  const component_cfg = record.config_json || {};

  const title = record.title ? i18n.translateValue(record.title, record.title) : i18n.translateValue("addThemes", "Adicionar Temas");

  return (
    <Button
      title={title}
      className={className}
      icon="pi pi-plus-circle"
      style={{ margin: '0.5em 1em' }}
      onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
    />
  )
}


/**
 * Main component
 */
export default function Main(props) {
  const { core } = props;
  const component_cfg = props.record.config_json;

  const translation = useTranslation([I18N_NAMESPACE, "custom"]);
  
  const title = props?.record?.title ? i18n.translateValue(props.record.title, props.record.title) : i18n.translateValue("addThemes", "Adicionar Temas");
  const header = component_cfg?.header ? i18n.translateValue(component_cfg.header, component_cfg.header) : title;

  const [activeIndex, setActiveIndex] = useState(
    props.config.data.type ? (props.config.data.items.length ? 2 : 1) : 0
  );
  const [wizardData, setWizardData] = useState(props.config.data);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState(source_types);

  useEffect(() => {
    if (!core?.pubsub?.subscribe) return;

    const unsubscribe = core.pubsub.subscribe(componentMessages.THEMEWIZARD_ADD_SERVICE, data => {
      externalLoad(data);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (component_cfg && component_cfg.exclude_types && component_cfg.exclude_types.length) {
      const filtered_types = types.filter(t => !component_cfg.exclude_types.includes(t.value));
      setTypes(filtered_types);
    }
  }, []);

  const stepItems = useMemo(()=> {
    return items.map( n => {
      return { label: translation.t(n.value, n.label)}
    });
  }, [translation?.i18n?.resolvedLanguage]);

  function externalLoad(data) {
    setActiveIndex(1);
    setSelected({});
    setWizardData({
      ...wizardData,
      key: String(uuidV4()),
      type: data.type ? data.type.toLowerCase() : '',
      url: data.url || '',
      dataType: data.type ? data.type.toLowerCase() : ''
    });
    props.config.dispatch(props.actions.viewer_set_selectedmenu(props.record.id));
    if (data.callback) data.callback();
  }

  function reset() {
    setSelected({});
    setWizardData({...initialData, dataitems: [], items:[]});
  }

  function onComplete(wizardData) {
    const { viewer_add_themes, viewer_set_selectedmenu, layers_set_checked, layers_set_opened } = props.actions;
    const { viewer, mainMap, dispatch } = props.config;

    // Add themes to viewer
    if (dispatch && viewer_add_themes) {

      const simpleLayers = [];
      const allIds = [];
      const parentIds = [];

      // Add Themes no Top
      let addThemesTop = viewer?.config_json?.addThemesTop != null ? viewer?.config_json?.addThemesTop : true;
      if (component_cfg?.addThemesTop != null) addThemesTop = component_cfg?.addThemesTop;

      const getSimpleLayers = function (items) {
        items.forEach(item => {
          if (item.children && item.children.length) {
            getSimpleLayers(item.children);
          } else {
            simpleLayers.push(item);
          }
        });
      }

      const addLayerItems = function (items, parent) {
        items.forEach(item => {
          allIds.push(item.id);
          
          let children = [];
          if (item.children && item.children.length) {
            children =  [...item.children];
            item.type = 'GROUP'
            item.children = [];

            parentIds.push(item.id);
          }

          if (!parent) {
            dispatch(viewer_add_themes('main', [item], addThemesTop, true));
          } else {
            dispatch(viewer_add_themes(parent.id, [item], addThemesTop, true));
          }

          if (children && children.length) {
            addLayerItems(children, item);
          }
        })       
      }

      getSimpleLayers(wizardData.items);
      if (simpleLayers && simpleLayers.length === 1) {
        addLayerItems(simpleLayers, null);
      } else { 
        addLayerItems(wizardData.items, null);
      }

      if (parentIds.length && props.record.config_json && props.record.config_json.layer_group_opened) {
        let opened = [...viewer.config_json.opened];
        opened = opened.concat(parentIds);
        dispatch(layers_set_opened(opened));
      }

      if (allIds.length && props.record.config_json && props.record.config_json.layer_visible) {
        let checked = [...viewer.config_json.checked];
        checked = checked.concat(allIds);
        dispatch(layers_set_checked(checked));
      }

      // Reset
      reset();
      setActiveIndex(0);
      dispatch(viewer_set_selectedmenu('toc'));
    }

    // TODO: Reset wizard?
  }

  // Validate change step
  function changeStep(previous, next) {
    if (next > previous) setActiveIndex(previous);
    else if (next > 0 && !wizardData.type) setActiveIndex(previous);
    else if (next > 1 && !wizardData.items.length > 0) setActiveIndex(previous);
    else setActiveIndex(next);
  }

  function renderContent() {
    let step = null;
    switch(activeIndex) {
      case 2:
        step =
          <WizardStepConfirm
            core={props.core}
            auth={props.config.auth}
            record={props.record}
            wizardData={wizardData}
            onSave={e => onComplete(wizardData)}
            onCancel={null}
          />
        break
      case 1:
        step =
          <WizardStepData
            core={props.core}
            auth={props.config.auth}
            record={props.record} 
            Models={props.config.Models}
            wizardData={wizardData}
            mainMap={props.config.mainMap}
            viewer={props.config.viewer}
            loading={loading}
            setLoading={setLoading}
            selected={selected}
            setSelected={setSelected}
            onChange={stepdata => {
              setWizardData(stepdata);
            }}
            onSave={stepdata => {
              setWizardData(stepdata);
              setActiveIndex(activeIndex+1);
            }}
            onCancel={null}
            fastFetch={fastFetch}
          />
        break
      case 0:
      default:
        step =
          <WizardStepType
            core={props.core}
            auth={props.config.auth}
            record={props.record}
            types={types}
            initialData={{...initialData, dataitems: [], items:[]}}
            wizardData={wizardData}
            onChange={type => {
              setSelected({});
              setWizardData({...initialData, dataitems: [], items:[], type})
            }}
            onSave={() => setActiveIndex(activeIndex+1)}
            onCancel={null}
          />
    }

    // Render content
    return (
      <div id="themewizard">
        <Steps 
          model={stepItems} 
          activeIndex={activeIndex} 
          onSelect={(e) => changeStep(activeIndex, e.index)} 
          readOnly={false}
        />
        { step }
      </div>
    )
  }

  const { as } = props;
  if (as === 'panel') return (
    <Panel header={header}>
      { renderContent() }
    </Panel>
  )

  // Render content
  return renderContent();
  
}

// Fetch with timeout handler
function fastFetch(url, options, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const toptions = { ...options, signal: controller.signal };

    // Hanle fetch timeout
    const fetchTimeout = setTimeout(() => {
      controller.abort();
      console.log('Fetch timeout at ' + timeout + ' ms')
      resolve({});
    }, timeout);

    fetch(url, toptions)
      .then(res => {
        clearTimeout(fetchTimeout);
        resolve(res);
      })
      // Catch upload error
      .catch(error => {
        clearTimeout(fetchTimeout);
        reject(error);
      });
  })
}