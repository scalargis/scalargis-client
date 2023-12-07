import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { InputText } from 'primereact/inputtext';
import { ListBox } from 'primereact/listbox';
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import Feature from 'ol/Feature';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';

import './style.css'
import useOutsideClick from './useOutsideClick';


const featureStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 0, 0, 0.5)',
    width: 4,
  }),
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: 'rgba(255, 0, 0, 0.5)',
    }),
    stroke: new Stroke({
      //color: '#fff',
      color: 'rgba(255, 255, 255, 0.5)',
      width: 2,
    })
  })    
});

export default function Main({ core, config, actions, utils, record }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { MapModel } = Models;
  const { getGeometryFromWKT } = MapModel;
  const { findOlLayer } = utils;
  
  const { t } = useTranslation(["common", "custom"]);

  const [filter, setFilter] = useState("");
  const [activeSources, setActiveSources] = useState([]);
  const [showPlaces, setShowPlaces]= useState(false);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const ref = useRef();

  const featuresLayer = useRef();

  const component_cfg = record.config_json || {};

  useOutsideClick(ref, () => {    
    setShowPlaces(false);
  });  

  function changeFilterFunc(e) {
    setSelectedPlace(null);
    setFilter(e.target.value);
    if (e.target.value.length < 3) {
        setPlaces([]);
        return;
    }

    setIsLoading(true);
    setShowPlaces(true);

    // Fetch filter
    let url = core.API_URL + '/geographical_names/search?_min_similarity=0.5&_maxrows=10&_filter={filter}';
    if (config.url) {
      url = config.url;
    }
    if (config.max_rows) {
      url = url.replace('{max_rows}', config.max_rows);
    }
    if (config.min_similarity) {
      url = url.replace('{min_similarity}', config.min_similarity);
    }     
    url = url.replace('{filter}', e.target.value);
    fetch(url).then(res => {      
        // TODO: Validate response
        return res.json();
    }).then(result => {
        if (activeSources?.length) {
          setPlaces(result.filter((item)=>{ return activeSources.includes(item.origem); }));
        } else {
          setPlaces(result);
        }
        setIsLoading(false);
    }).catch(error => {
        //console.log('error', error);
        setIsLoading(false);
    })
  }  

  function selectPlace(e) {
    let item = e.value || selectedPlace;

    if (item?.geom_wkt) {
      const geom = MapModel.getGeometryFromWKT(item.geom_wkt);
      const srid = component_cfg?.geometrySRID || item?.geom_srid || 4326;

      geom.transform(`EPSG:${srid}`, mainMap.getView().getProjection());

      let buffer = config.buffer || 1000;
      if (config?.sources?.length) {
        config.sources.forEach((src) => {
          if(item.origem == src.id && src.buffer != null) {
              buffer = src.buffer;
          }
        });
      }

      const geom_ext = geom.getExtent();
      const extent = [geom_ext[0] - buffer, geom_ext[1] - buffer, geom_ext[2] + buffer, geom_ext[3] + buffer];

      dispatch(actions.map_set_extent([extent[2] - extent[0], extent[3] - extent[1]], extent));

      //setFilter(item.name || filter);
      setSelectedPlace(item);
    }
  }

  function clearFilter() {
    setFilter("");
    setPlaces([]);
    setSelectedPlace(null);
  }

  // Legacy code. To be removed
  function buildLegacyDefaultItem(option, iconClass) {
    let elem = null;
  
    if (iconClass) {
      elem = <div className="place-list-item"><i className={`pi ${iconClass || ''} p-mr-2`}></i> <span>{option.designacao} ({option.concelho})</span></div>;
      if (option.designacao === option.concelho) {
        elem = <div>{option.concelho}</div>
      }
    } else {
      elem = <div>{option.designacao} ({option.concelho})</div>;
      if (option.designacao === option.concelho) {
        elem = <div>{option.concelho}</div>
      }
    }

    return elem;
  }

  function buildDefaultItem(option, iconClass) {
    let elem = null;

    const admin_level = option.admin_level4 || option.admin_level3 || option.admin_level2 || option.admin_level1 || '';
  
    if (iconClass) {      
      elem = <div className="place-list-item"><i className={`pi ${iconClass || ''} p-mr-2`}></i> <span>{option.name} {admin_level ? `(${admin_level})` : ''}</span></div>;
      if (option.name === admin_level) {
        elem = <div>{admin_level}</div>
      }
    } else {
      elem = <div>{option.name} {admin_level ? `(${admin_level})` : ''}</div>;
      if (option.name=== option.admin_level) {
        elem = <div>{admin_level}</div>
      }
    }

    return elem;
  }

  function itemTemplate(option) {
    const types = component_cfg?.types;
    let elem = null;

    if (types) {
      elem = buildDefaultItem(option, types?.default?.iconClass);
    } else {
      elem = buildLegacyDefaultItem(option, null);
    }

    if (types?.default) {
      if (types?.default?.html) {
        let html = types?.default?.html;
        const rf = (html && html.match) ? html.match(/[^{}]+(?=})/g) : null;
        if (rf) {
          rf.forEach(fld => {
            html = html.replace(`{${fld}}`, option[fld] || '');      
          });
        }
        elem = <div dangerouslySetInnerHTML={{__html: html}} />;
      }
    }

    if (types?.field && option[types?.field] && types?.templates?.length) {
      const tpl = types.templates.find( item => item.id === option[types.field]);
      if (tpl) {
        if (tpl?.html) {
          let html = tpl.html;
          const rf = (html && html.match) ? html.match(/[^{}]+(?=})/g) : null;
          if (rf) {
            rf.forEach(fld => {
              html = html.replace(`{${fld}}`, option[fld] || '');      
            });
          }
          elem = <div dangerouslySetInnerHTML={{__html: html}} />;
        } else if (tpl.iconClass) {
          elem = buildDefaultItem(option, tpl.iconClass);
        }       
      }
    }    

    return elem;
  }

  useEffect(() => {
    let sources_ids = [];
    if (config.sources && config.sources.length > 0) {      
      config.sources.forEach(src => {
        if (src.active) {
          sources_ids.push(src.id);
        }
      });
    }
    setActiveSources([...sources_ids]);
  }, []);

  useEffect(() => {
    if (!mainMap) return;

    const layerId = 'places-search';

    const savedLayer = utils.findOlLayer(mainMap, layerId);
    if (savedLayer) {
      featuresLayer.current = userLayer; 
      return;      
    }
    
    /*
    const userLayer = utils.findOlLayer(mainMap, 'userlayer');
    if (userLayer) {
      featuresLayer.current = userLayer; 
      return;
    }
    */

    featuresLayer.current = new VectorLayer({
      id: layerId,
      renderMode: 'vector',
      source: new Vector({}),
      style: featureStyle,
      selectable: false
    });

    const parentLayer = utils.findOlLayer(mainMap, 'overlays');

    if (parentLayer) {      
      parentLayer.getLayers().getArray().push(featuresLayer.current);
    } else {
      mainMap.addLayer(featuresLayer.current);
    }
  }, [mainMap]);

  useEffect(() => {
    if (selectedPlace && component_cfg.unselectOnHide === true) {
      setSelectedPlace(null);
    }
  },[showPlaces]);

  useEffect(() => {
    if (!featuresLayer.current) return;

    featuresLayer.current.getSource().clear();

    if (!selectedPlace) return;

    let drawGeometry = true;

    if (component_cfg.drawGeometry=== false) return;

    const types = component_cfg?.types || {};    
    if (types.templates?.length) {
      let template;
      if (selectedPlace.type) {
        template = types.templates.find(t => t.id === selectedPlace.type);
      }
      if (!template && types?.default) {
        template = types?.default;
      }

      if (template?.drawGeometry != null) {
        drawGeometry = template.drawGeometry;
      }
    }

    if (!drawGeometry) return;

    if (!selectedPlace?.geom_wkt && !selectedPlace?.geom_ext) return;

    if (selectedPlace?.geom_wkt) {      
      const geom = getGeometryFromWKT(selectedPlace.geom_wkt);
      const srid = component_cfg?.geometrySRID || selectedPlace?.geom_srid || 4326;

      geom.transform(`EPSG:${srid}`, mainMap.getView().getProjection());

      const feature = new Feature();
      feature.setGeometry(geom);
      feature.setStyle(featureStyle);
      featuresLayer.current.getSource().addFeatures([feature]);
    }  
  }, [selectedPlace]);



  return (
    <div ref={ref} className="layout-topbar-search-container">
      <span className="layout-topbar-search">
          <InputText type="text"
            placeholder={ config.placeholder ? t(config.placeholder, config.placeholder, {"ns": "custom"}) : `${t("search", "Pesquisar")}...`}
            value={filter}
            onFocus={(e) => setShowPlaces(true)}
            onChange={(e) => changeFilterFunc(e)} />
          { isLoading ?
            <span className='layout-topbar-search-icon pi pi-spin pi-spinner' />
            : filter ? <span className='layout-topbar-search-icon pi pi-times mouse-pointer'
              aria-label={t('clear', 'Limpar')}
              title={t('clear', 'Limpar')}
              onClick={e=>clearFilter()} />
            : <span className='layout-topbar-search-icon pi pi-search' />
          }          
      </span>
      {(showPlaces && places && places.length > 0 ?
        <div className="layout-topbar-search-results">
          <ListBox
              optionLabel={t("place", "Lugar")}
              value={selectedPlace}
              options={places}
              itemTemplate={itemTemplate}
              onChange={(e) => selectPlace(e)}
          />
        </div> : null
      )}
    </div>
  );
}

