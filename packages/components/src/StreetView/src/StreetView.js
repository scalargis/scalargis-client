import React, { useEffect, useState, useRef } from 'react'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog';

import { transform } from 'ol/proj'
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';
import {containsXY} from 'ol/extent';
import {Circle as OlStyleCircle, Fill as OlStyleFill, Stroke as OlStyleStroke, 
  Icon as OlStyleIcon, Style as OlStyle} from 'ol/style';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import OLGroupLayer from "ol/layer/Group"

import './style.css'

const streetviewStyle = new OlStyle({
  fill: new OlStyleFill({
    color: 'rgba(255, 0, 0, 0.2)',
  }),
  image: new OlStyleIcon({
    src: process.env.REACT_APP_CLIENT_URL + 'assets/images/location-heading.svg',
    imgSize: [27, 55]
  }),
});

export const createStyle = (props, rotation) => {

  const {fill, stroke, image} = props;
  const style = streetviewStyle.clone();

  try {
    if (fill) {
      style.setFill(new OlStyleFill(fill));
    }
    if (stroke) {
      style.setStroke(new OlStyleStroke(stroke));
    }
    if (image) {      
      if (image.icon) {
        const { displacement, scale, color, rotateWithView } = image.icon;
        const iconStyle = new OlStyleIcon({
          imgSize: image.icon.imgSize || style.getImage().getSize(),
          src: image.icon.src ? process.env.REACT_APP_CLIENT_URL + image.icon.src : style.getImage().getSrc(),
          color, 
          displacement,
          scale,
          rotation,
          rotateWithView
        });
        style.setImage(iconStyle);
      } else {
        const { radius, displacement, scale, rotateWithView } = image;
        const circleStyle = new OlStyleCircle({
          fill: image.fill ? new OlStyleFill(image.fill) : null,
          stroke: image.stroke ? new OlStyleStroke(image.stroke): null,
          radius,
          displacement,
          scale,
          rotateWithView
        });
        style.setImage(circleStyle);        
      }
    }
  } catch (error) {
    console.log(error);
  }

  return style;
}

export default function StreetView({ viewer, mainMap, dispatch, actions, record, utils }) {

  const { exclusive_mapcontrol } = viewer;

  const streetview_control = record;
  const { viewer_update_mapcontrol, viewer_set_selectedmenu, map_set_extent, viewer_set_exclusive_mapcontrol } = actions;
  const { getWindowSize, showOnPortal } = utils;  

  const [modalStreetViewOpen, setModalStreetViewOpen] = useState(false);

  const [position, setPosition] = useState();
  const [pov, setPov] = useState();

  const dialog = useRef();
  const streetviewLayer = useRef();
  const panorama = useRef();

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const component_cfg = record.config_json || {};
  const title = record.title || 'Google StreetView';
  const header = component_cfg.header || title;    

  // Add StreetView layer
  useEffect(() => {
    if (!mainMap) return;

    streetviewLayer.current = new VectorLayer({
      id: 'streetview',
      renderMode: 'vector',
      source: new Vector({}),
      selectable: false
    });
    streetviewLayer.current.setStyle(streetviewStyle);

    //const parentLayer = utils.findOlLayer(mainMap, 'overlays');
    mainMap.addLayer(streetviewLayer.current);
  
  }, [mainMap]);


  useEffect(() => {
    if (!exclusive_mapcontrol) return;

    if (exclusive_mapcontrol === 'StreetView' ) mainMap.on('singleclick', streetviewSingleClick);
    else mainMap.un('singleclick', streetviewSingleClick);

    return () => {
      mainMap.un('singleclick', streetviewSingleClick);
    }
  }, [exclusive_mapcontrol]);  


  // Toggle StreetView control
  function toggleStreetViewControl() {
    dispatch(viewer_set_exclusive_mapcontrol('StreetView'));
  }

  function streetviewSingleClick (e) {
    const lonlat = transform(e.coordinate, mainMap.getView().getProjection().getCode(), 'EPSG:4326');

    if (streetviewLayer?.current) {
      const source = streetviewLayer.current.getSource();

      if (source) {
          source.clear();

        const feature = new Feature({
            geometry: new Point(e.coordinate)
        });
        source.addFeature(feature);          
      }
    }

    if (panorama?.current) {
      const pos = panorama.current.getPosition();
      console.log([pos.lng(), pos.lat()]);

      const newPos = new window.google.maps.LatLng(lonlat[1],lonlat[0]);
      console.log([newPos.lng(), newPos.lat()]);
      panorama.current.setPosition(newPos);
    } else {      
      setPosition(lonlat);      
      setModalStreetViewOpen(true);
    }    
  }
  
  //Exit if google maps script is not loaded
  if (!(window.google && window.google.maps)) return null;

  return (
    <React.Fragment>
      <div id="streetview" className="streetview">
          <Button
            title={title}
            icon="fas fa-street-view"
            className={exclusive_mapcontrol === 'StreetView' ? "p-button-rounded p-button-raised active" : "p-button-rounded p-button-raised" }
            onClick={e => { e.currentTarget.blur(); toggleStreetViewControl() } }
          />
      </div>       

      {showOnPortal(<Dialog
        ref={dialog} 
        header={header}
        visible={!!modalStreetViewOpen}
        style={{width: isMobile ? '90%' : '50vw', height: '80%' }}
        modal={false} 
        onShow={() => {          
          const panoramaOptions = {
            position: new window.google.maps.LatLng(position[1], position[0]),
            pov: {
              heading: 34,
              pitch: 10
            }
          };
          const elem = dialog.current.contentEl;
          const pan = new window.google.maps.StreetViewPanorama(elem, panoramaOptions);
          pan.addListener('position_changed', function() {
            const pos = panorama.current.getPosition();
            const pov = panorama.current.getPov();

            var coords = transform([pos.lng(), pos.lat()], 'EPSG:4326', mainMap.getView().getProjection().getCode());

            if (streetviewLayer?.current) {
              const source = streetviewLayer.current.getSource();
        
              if (source) {
                source.clear();                
                
                const rotation = (Math.PI / 180) * pov.heading;            
                const style = createStyle(record?.config_json?.style, rotation);
        
                const feature = new Feature({
                    geometry: new Point(coords)
                });
                feature.setStyle(style);
                source.addFeature(feature);
                
                /*Tacking modes
                //  extent - only move map if position is outside map extent
                //  always - alway move map to position
                */
                if (record?.config_json?.tracking) {
                  if (record.config_json.tracking === 'extent') {
                    const extent = mainMap.getView().calculateExtent(mainMap.getSize());
                    if (!containsXY(extent, coords[0], coords[1])) {
                      mainMap.getView().animate({
                        center: coords
                      });
                    } 
                  } else if (record.config_json.tracking === 'always') {
                    mainMap.getView().animate({
                      center: coords
                    });
                  }
                }
              }
            }
          });
          pan.addListener('pov_changed', function() {
            const pos = panorama.current.getPosition();
            const pov = panorama.current.getPov();          

            var coords = transform([pos.lng(), pos.lat()], 'EPSG:4326', mainMap.getView().getProjection().getCode());
            if (streetviewLayer?.current) {
              const source = streetviewLayer.current.getSource();
        
              if (source) {
                source.clear();

                const rotation = (Math.PI / 180) * pov.heading;            
                const style = createStyle(record?.config_json?.style, rotation);
        
                const feature = new Feature({
                    geometry: new Point(coords)
                });
                feature.setStyle(style);
                source.addFeature(feature);          
              }
            }
          });          
          panorama.current = pan;
         }}
         onResizeEnd={() => {
          window.google.maps.event.trigger(panorama.current, 'resize');
        }}
        onHide={e => {
          if (streetviewLayer?.current) {
            const source = streetviewLayer.current.getSource();      
            if (source) source.clear();
          }
          if (panorama?.current) panorama.current = null;
          setModalStreetViewOpen(false);
          if (exclusive_mapcontrol === 'StreetView') {
            dispatch(viewer_set_exclusive_mapcontrol(null));
          }
        }}>
      </Dialog>)}
    </React.Fragment>
  )
}