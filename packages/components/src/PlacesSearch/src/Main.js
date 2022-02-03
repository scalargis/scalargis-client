import React, { useEffect, useState, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { ListBox } from 'primereact/listbox';
import { transform } from 'ol/proj';
import './style.css'
import { config } from 'react-transition-group';
import useOutsideClick from './useOutsideClick';

/* ---------------------------------------
//  - Component configuration example - //
    {
      "id": "placessearch",
      "type": "PlacesSearch", 
      "target": "topbar_right", 
      "order": 1,
      "config_json": {
        "url": "https://snig.dgterritorio.pt/geographical_names/search?_min_similarity=0.5&_maxrows=10&_filter={filter}",
        "sources": [
          { "id": "DGT", "title": "DGT", "active": true, "buffer": 1000},
          { "id": "INE", "title": "INE", "active": true, "buffer": 500}
        ],
        "buffer": 1000
      },
      "children": []
    }
----------------------------------------*/

export default function Main({ config, actions }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { MapModel } = Models;

  const [filter, setFilter] = useState("");
  const [activeSources, setActiveSources] = useState([]);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const ref = useRef();

  const API_URL = process.env.REACT_APP_API_URL;

  useOutsideClick(ref, () => {
    setPlaces([]);
  });  

  function changeFilterFunc(e) {
    setFilter(e.target.value)
    if (e.target.value.length < 3) {
        setPlaces([]);
        return;
    }

    setIsLoading(true);

    // Fetch filter
    let url = 'https://snig.dgterritorio.pt/geographical_names/search?_min_similarity=0.5&_maxrows=10&_filter={filter}';
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
        // Validate response
        // if (res.status === 401) return '';
        // else if (res.status !== 200) return ''dispatch(viewer_not_found(history))'';
        // else
        return res.json();
    }).then(result => {
        //console.log(result);
        setPlaces(result.filter((item)=>{ return activeSources.includes(item.origem); }));
        setIsLoading(false);
    }).catch(error => {
        //console.log('error', error);
        setIsLoading(false);
    })
  }

  function selectPlace(e) {
    let item = e.value;
    if (item && item.geom_wkt) {
      let geom = MapModel.getGeometryFromWKT(item.geom_wkt);
      geom.transform('EPSG:4326', mainMap.getView().getProjection());

      let buffer = config.buffer || 1000;
      config.sources.forEach((src) => {
        if(item.origem == src.id && src.buffer != null) {
            buffer = src.buffer;
        }
      });

      const geom_ext = geom.getExtent();
      const extent = [geom_ext[0] - buffer, geom_ext[1] - buffer, geom_ext[0] + buffer, geom_ext[1] + buffer];

      dispatch(actions.map_set_extent([extent[2] - extent[0], extent[3] - extent[1]], extent));

      setFilter(item.designacao);
    }
  }

  function itemTemplate(option) {
    let elem = <div>{option.designacao} ({option.concelho})</div>;
    if (option.designacao == option.concelho) {
      elem = <div>{option.concelho}</div>
    }
    return elem;
  }

  useEffect(() => {
    //console.log('PLACESSEARCH');
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

  return (
    <div ref={ref} style={{ textAlign: "right" }}>
      <span className="layout-topbar-search">
          <InputText type="text"
            placeholder="Pesquisar..."         
            value={filter}
            onChange={(e) => changeFilterFunc(e)} />
          <span className={ isLoading ? 'layout-topbar-search-icon pi pi-spin pi-spinner' : 'layout-topbar-search-icon pi pi-search' }/>
      </span>
      {(places && places.length > 0 ?
        <div style={{marginTop: "5px", position: "absolute", zIndex: "10"}}>
          <ListBox
              optionLabel="Lugar"
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

