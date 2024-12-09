import React, { useEffect, useState, useRef } from 'react'
import { useTranslation} from "react-i18next"
import { transform } from 'ol/proj'
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import OLGeolocation from 'ol/Geolocation';
import 'ol/ol.css';
import {Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import OLGroupLayer from "ol/layer/Group"
import * as utils from '../utils';
import { getProjectionSrid } from '../model/MapModel';

const locationStyle = new Style({
    image: new CircleStyle({
        radius: 6,
        fill: new Fill({
        color: '#3399CC',
        }),
        stroke: new Stroke({
        color: '#fff',
        width: 2,
        }),
    })
});

export default function GeoLocation({ config, actions }) {

    const { viewer, mainMap, dispatch } = config;
    const { geolocation }  = viewer;
    const geo_location_control = viewer.config_json.map_controls.find(c => c.id === 'GeoLocation');
    const geo_location_component = viewer.config_json.components.find(c => c.config_json && 
                c.config_json.map_control === 'GeoLocation');

    const { t } = useTranslation();

    const [loaded, setLoaded] = useState(false);
    const [olgeolocation, setOlgeolocation] = useState(null);

    const locationLayer = useRef();


    function getGeoLocation (cb) {
        let coordinates = olgeolocation ? olgeolocation.getPosition() : null;
        if (coordinates) {
            const pos = {
                coordinates: coordinates,
                accuracy: olgeolocation.getAccuracy(), //[m]
                altitude: olgeolocation.getAltitude(), //[m]
                altitudeAccuracy: olgeolocation.getAltitudeAccuracy(), //[m]
                heading: olgeolocation.getHeading(), //[rad]
                speed: olgeolocation.getSpeed() //[m/s]
            }
            saveGeoLocation(pos);
            if (cb) cb(pos);
        } else {
            window.navigator.geolocation.getCurrentPosition((position) => {
                if (position.coords) {                    
                    const pos = { 
                        coordinates: [position.coords.longitude, position.coords.latitude],
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed
                    }
                    saveGeoLocation(pos);
                    if (cb) cb(pos);
                } else {
                    saveGeoLocation({ error: { code: 0, message: t("myLocationNoInformation", "Não foi possível obter localização.")} });
                }
            }, (error) => {
                const pos = { 
                    error: {
                        code: error.code || 0,
                        message: error.message
                    }
                }
                saveGeoLocation(pos);
            });                   
        }        
    }

    function saveGeoLocation(position) {
        // Save GeoLocation
        dispatch(actions.viewer_set_geolocation(position));
    }

    function zoomGeoLocation(position) {
        // Zoom to extent        
        if (position && position.coordinates) {
            const coordinates = transform(position.coordinates, 'EPSG:4326', mainMap.getView().getProjection());
            const extent = [coordinates[0] - 500, coordinates[1] - 500, 
                            coordinates[0] + 500, coordinates[1] + 500];
            const srid = getProjectionSrid(mainMap.getView().getProjection()); 
            dispatch(actions.map_set_extent(coordinates, extent, srid));
        }
    }

    useEffect(() => {
        if (!geo_location_control) return;
        if (!olgeolocation) return;

        olgeolocation.setTracking(geo_location_control.tracking);
    },[geo_location_control.tracking]);

    useEffect(() => {
        if (!geo_location_control) return;
        
        if (!geo_location_control.active) {
            olgeolocation && olgeolocation.setTracking(false);
            dispatch(actions.viewer_set_geolocation(null));
            return;
        }

        olgeolocation && olgeolocation.setTracking(!!geo_location_control.tracking);
        if (loaded) {
            if (!!geo_location_control.zoom) {
                getGeoLocation(pos => zoomGeoLocation(pos));
            } else {
                getGeoLocation();
            }
        }
        dispatch(actions.layers_set_checked([ ...viewer.config_json.checked, 'geolocation']));
    }, [geo_location_control.active]);   


    useEffect(() => {      
        if (!locationLayer.current) return;

        locationLayer.current.getSource().clear();

        if (geo_location_control.active && geolocation && geolocation.coordinates) {
            const positionFeature = new Feature();

            const coordinates = transform([geolocation.coordinates[0], geolocation.coordinates[1]], 'EPSG:4326', mainMap.getView().getProjection());
            positionFeature.setGeometry(new Point(coordinates));
            locationLayer.current.getSource().addFeatures([positionFeature]);
        }               
    }, [geolocation]);        

    // Add geolocation layer
    useEffect(() => {
        if (!mainMap) return;

        locationLayer.current = new VectorLayer({
            id: 'geolocation',
            renderMode: 'vector',
            source: new Vector({}),
            style: locationStyle,
            selectable: false
          });
      
          //const parentLayer = utils.findOlLayer(mainMap, 'overlays');
      
          mainMap.addLayer(locationLayer.current); 
          /*
          if (parentLayer) {
            parentLayer.getLayers().getArray().push(locationLayer.current);
          } else {
            mainMap.addLayer(locationLayer.current); 
          }
          */        

         setLoaded(true);
         
         if (geo_location_control.active) {
             if (!!geo_location_control.zoom_init) {
                 getGeoLocation(pos => zoomGeoLocation(pos));
             } else {
                 getGeoLocation();
             }
         }


        /*
        setTimeout(() => {

            //Add theme
            dispatch(actions.viewer_add_themes(
                "overlays",
                [
                    {
                    id: "geolocation",
                    title: 'GeoLocation',
                    description: "GeoLocation",
                    active: true,
                    open: false,
                    type: "VECTOR",
                    opacity: 1
                    }
                ]
            ));
            // Turn layer on
            dispatch(actions.layers_set_checked([ ...viewer.config_json.checked, 'geolocation']));

            setTimeout(() => {
                setLoaded(true);

                locationLayer = utils.findOlLayer(mainMap, 'geolocation');
                locationLayer && locationLayer.setStyle(locationStyle);
                
                if (geo_location_control.active) {
                    if (!!geo_location_control.zoom_init) {
                        getGeoLocation(pos => zoomGeoLocation(pos));
                    } else {
                        getGeoLocation();
                    }
                }
            }, 500);

        }, 1000);
        */

        //Create and config Openlayers Geolocation (OLGeolocation)
        const olgeolocation = new OLGeolocation({
                // enableHighAccuracy must be set to true to have the heading value.
                //trackingOptions: {
                //    enableHighAccuracy: true,
                //},
                //projection: mainMap.getView().getProjection()
            });

            olgeolocation.on('change', function () {
                const pos = {
                    coordinates: olgeolocation.getPosition(),
                    accuracy: olgeolocation.getAccuracy(), //[m]
                    altitude: olgeolocation.getAltitude(), //[m]
                    altitudeAccuracy: olgeolocation.getAltitudeAccuracy(), //[m]
                    heading: olgeolocation.getHeading(), //[rad]
                    speed: olgeolocation.getSpeed() //[m/s]
                }
                saveGeoLocation(pos, false);
            });

            olgeolocation.on('error', function (error) {
                const pos = {
                    error: {
                        code: error.code,
                        message: error.message,
                        type: error.type
                    }    
                }
                saveGeoLocation(pos, false);
            });

            setOlgeolocation(olgeolocation);

    }, [mainMap]);  

    return null
}