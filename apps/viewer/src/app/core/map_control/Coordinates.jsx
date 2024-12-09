import React, { useEffect, useState, useRef, useMemo } from 'react';
import Cookies from 'universal-cookie';
import { transform } from 'ol/proj'
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import OLGroupLayer from "ol/layer/Group"
import { v4 as uuidV4 } from 'uuid'
import * as utils from '../utils';
import { getProjectionSrid } from '../model/MapModel';

const coordinatesStyle = new Style({
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
const selectedCoordinatesStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({
      color: '#FF0000',
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 2,
    }),
  })
});

/**
 * Actions
 */
export const actions = {
  coordinates_action1: () => console.log('Called coordinates_helper')
}

export default function Coordinates({ core, config, actions }) {

  const { viewer, mainMap, dispatch } = config;
  const { coordinates } = viewer;
  const [newCoord, setNewCoord] = useState(null);
  const coordinates_control = viewer.config_json.map_controls.find(c => c.id === 'Coordinates');
  const coordinates_component = viewer.config_json.components.find(c => c.config_json && 
              c.config_json.map_control === 'Coordinates');

  const coordinatesLayer = useRef();

  const userRoles = useMemo(()=>{
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
  
    let user_roles = [];
    if (logged && logged.userroles && logged.userroles.length) {
      user_roles = [...logged.userroles];
    }
    return user_roles;
  }, []);


  function transformCoordinates(x, y) {
    const trans_coords = {};
    viewer.config_json.crs_list.forEach(crs => {
      const coords = transform([x, y],  mainMap.getView().getProjection(), crs.code);

      //Set precision for user role
      let precision = crs.precision;
      if (crs.precision_roles?.length && userRoles?.length) {
        const rp = crs.precision_roles.find(elem => (elem?.roles || []).some(item => userRoles.includes(item)));
        if (rp?.precision) {
          precision = rp?.precision;
        }
      }

      trans_coords[crs.code] = { code: crs.code, title: crs.title, description: crs.description, 
        srid: crs.srid, precision: precision, coordinates: coords }
    });     
    setNewCoord({ id: uuidV4(), coordinates: [x, y], crs: mainMap.getView().getProjection().getCode(), results: trans_coords });
  }

  function transformCoordinatesByApi(x, y) {
    const url = core.API_URL + '/app/utils/transcoord';

    const srid = getProjectionSrid(mainMap.getView().getProjection());

    let options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'        
      },
      method: 'POST',
      body: JSON.stringify({ x: x, y: y, srid: srid})
    }

    fetch(url, options).then(res => {
        return res.json();
    }).then(result => {
        if (result.results) {
          const trans_coords = {};
          viewer.config_json.crs_list.forEach(crs => {
            let coords = [];
            if (result.results[crs.code]) {
              coords = [result.results[crs.code].x, result.results[crs.code].y];

              //Set precision for user role
              let precision = crs.precision;
              if (crs.precision_roles?.length && userRoles?.length) {
                const rp = crs.precision_roles.find(elem => (elem?.roles || []).some(item => userRoles.includes(item)));
                if (rp?.precision) {
                  precision = rp?.precision;
                }
              }
              
              trans_coords[crs.code] = { code: crs.code, title: crs.title, description: crs.description, 
                srid: crs.srid, precision: precision, coordinates: coords }
            }
          });          
          const new_coords = [x, y];
          const item = { id: uuidV4(), coordinates: new_coords, crs: mainMap.getView().getProjection().getCode(), results: trans_coords };
          setNewCoord(item);
        }
    })
    .catch(error => {
        console.log('error', error);
    })
  }              

  function coordinatesSingleClick (e) {
    //transformCoordinates(e.coordinate[0], e.coordinate[1]);
    transformCoordinatesByApi(e.coordinate[0], e.coordinate[1]);
  }

  useEffect(() => {
  }, []);

  useEffect(() => {      
    if (!coordinatesLayer.current) return;

    coordinatesLayer.current.getSource().clear();

    let index = 0;
    coordinates.forEach((item) => {
      const feature = new Feature();

      //transform([geolocation.coordinates[0], geolocation.coordinates[1]], 'EPSG:4326', mainMap.getView().getProjection());
      feature.setGeometry(new Point(item.coordinates));
      if (index == 0) feature.setStyle(selectedCoordinatesStyle); 
      coordinatesLayer.current.getSource().addFeatures([feature]);
      index += 1;
    });
  
  }, [coordinates]);

  useEffect(() => {      
    if (newCoord) dispatch(actions.viewer_set_coordinates([newCoord, ...coordinates]));
  }, [newCoord]);  

  useEffect(() => {
    if (!coordinates_control) return;
    if (coordinates_control.active) mainMap.on('singleclick', coordinatesSingleClick);
    else mainMap.un('singleclick', coordinatesSingleClick);

    if (coordinates_control.active && !viewer.config_json.checked.includes('coordinates')) {
      dispatch(actions.layers_set_checked([ ...viewer.config_json.checked, 'coordinates']));
    }

    return () => {
      mainMap.un('singleclick', coordinatesSingleClick);
    }
  }, [coordinates_control]);  

  // Add coordinates layer
  useEffect(() => {
    if (!mainMap) return;

    coordinatesLayer.current = new VectorLayer({
      id: 'coordinates',
      renderMode: 'vector',
      source: new Vector({}),
      style: coordinatesStyle,
      selectable: false
    });

    //const parentLayer = utils.findOlLayer(mainMap, 'overlays');

    mainMap.addLayer(coordinatesLayer.current); 
    /*
    if (parentLayer) {
      parentLayer.getLayers().getArray().push(coordinatesLayer.current);
    } else {
      mainMap.addLayer(coordinatesLayer.current); 
    }
    */

      
    /*
    setTimeout(() => {

      //Add theme
      dispatch(actions.viewer_add_themes(
          "overlays",
          [
              {
              id: "coordinates",
              title: "Coordinates",
              description: "Coordinates",
              active: true,
              open: false,
              type: "VECTOR",
              opacity: 1
              }
          ]
      ));   
      
      setTimeout(() => {       
        coordinatesLayer.current = utils.findOlLayer(mainMap, 'coordinates');
        coordinatesLayer.current.setStyle(coordinatesStyle);

        // Turn layer on
        dispatch(actions.layers_set_checked([ ...viewer.config_json.checked, 'coordinates']));        
      }, 500);

    }, 500);
    */

  }, [mainMap]);

  return null;

}