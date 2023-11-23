import React, { useEffect, useState } from 'react';
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import ZoomToExtent from 'ol/control/ZoomToExtent';
import DragBox from 'ol/interaction/DragBox';
import {
  DragRotate,
  defaults as defaultInteractions,
} from 'ol/interaction';
import { FullScreen, defaults as defaultControls } from 'ol/control';
import './style.css';

let mapControls;
let mapInteractions;
let zoomToExtentControl;
let dragBoxInteraction;

export default function MapControls({ viewer, mainMap, core, dispatch, actions, record }) {

  const { exclusive_mapcontrol } = viewer;
  const coordinates_control = viewer.config_json.map_controls.find(c => c.id === 'Coordinates');
  const coordinatesActive = coordinates_control ? coordinates_control.active : false;
  const feature_info_control = viewer.config_json.map_controls.find(c => c.id === 'FeatureInfo');
  const featureInfoActive = feature_info_control ? feature_info_control.active : false;
  const geo_location_control = viewer.config_json.map_controls.find(c => c.id === 'GeoLocation');
  const geoLocationActive = geo_location_control ? geo_location_control.active : false;
  const geoLocationTracking = geo_location_control ? geo_location_control.tracking : false;
  const geo_location_component = viewer.config_json.components.find(c => c.config_json &&
    c.config_json.map_control === 'GeoLocation');
  const { viewer_update_mapcontrol, viewer_set_selectedmenu, viewer_set_exclusive_mapcontrol } = actions;

  const { t } = useTranslation();

  const [dragBox, setDragBox] = useState(false);

  const [geoLocationSettings, setGeoLocationSettings] = useState(false);

  useEffect(() => {
    const elem_zoom = document.createElement('span');
    elem_zoom.classList.add("pi", "pi-window-maximize", "p-c");

    const zoom_opts = {
      label: elem_zoom,
      tipLabel: t("showTotalExtent", "Ver extensão total")
    }

    if (viewer && viewer.config_json && viewer.config_json.full_extent) {
      zoom_opts['extent'] = viewer.config_json.full_extent;
      zoomToExtentControl = new ZoomToExtent(zoom_opts);
    } else {
      zoomToExtentControl = new ZoomToExtent(zoom_opts);
    }

    const options = { attribution: false };
    if (viewer.config_json.exclude_map_controls && viewer.config_json.exclude_map_controls.length > 0) {
      viewer.config_json.exclude_map_controls.forEach(o => {
        options[o] = false;
      });
    }

    //mapControls = defaultControls(options).extend([new FullScreen(), zoomToExtentControl]);
    mapControls = defaultControls(options);
    if (viewer.config_json.exclude_map_controls && viewer.config_json.exclude_map_controls.length > 0) {
      if (!viewer.config_json.exclude_map_controls.includes('fullscreen')) {
        mapControls = mapControls.extend([new FullScreen()]);
      }
      if (!viewer.config_json.exclude_map_controls.includes('zoomtoextent')) {
        mapControls = mapControls.extend([zoomToExtentControl]);
      }
    } else {
      mapControls = defaultControls(options).extend([new FullScreen(), zoomToExtentControl]);
    }
    mapControls.forEach(c => {
      c.setTarget(document.getElementById('map-controls'));
      mainMap.addControl(c);
    });

    dragBoxInteraction = new DragBox();
    //mapInteractions = defaultInteractions({altShiftDragRotate:false, pinchRotate: false});
    mapInteractions = defaultInteractions({ altShiftDragRotate: false, pinchRotate: false });
    if (viewer.config_json.exclude_map_controls && viewer.config_json.exclude_map_controls.length > 0) {
      if (!viewer.config_json.exclude_map_controls.includes('rotate')) {
        mapInteractions = mapInteractions.extend([
          new DragRotate({
            condition: (evt) => {
              var browserEvent = evt.originalEvent;
              return browserEvent.ctrlKey;
            }
          })
        ]);
      }
    }
    mapInteractions = mapInteractions.extend([
      dragBoxInteraction
    ]);
    mapInteractions.forEach(i => mainMap.addInteraction(i));

    function zoomToBox(e) {
      const box = dragBoxInteraction.getGeometry();
      mainMap.getView().fit(box);
      setDragBox(false);
    }

    // Add event
    dragBoxInteraction.on('boxend', zoomToBox);
    return () => {
      if (dragBoxInteraction) mainMap.removeInteraction(dragBoxInteraction);
      if (zoomToExtentControl) mainMap.removeControl(zoomToExtentControl);
    }
  }, []);

  // Toggle coordinates control
  function toggleCoordinatesControl() {
    const active = !coordinatesActive;
    dispatch(viewer_update_mapcontrol({ ...coordinates_control, active }));
    if (active) {
      dispatch(viewer_set_selectedmenu('coordinates'));
      dispatch(viewer_set_exclusive_mapcontrol('Coordinates'));
    } else {
      dispatch(viewer_set_exclusive_mapcontrol(null));
    }
  }

  // Toggle feature info control
  function toggleFeatureInfoControl() {
    const active = !featureInfoActive;
    dispatch(viewer_update_mapcontrol({ ...feature_info_control, active }));
    if (active) {
      dispatch(viewer_set_selectedmenu('featureinfo'));
      dispatch(viewer_set_exclusive_mapcontrol('FeatureInfo'));
    } else {
      dispatch(viewer_set_exclusive_mapcontrol(null));
    }
  }

  // Toggle geo location control
  function toggleGeoLocationControl() {
    const active = !geoLocationActive;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, active }));
    if (active && geo_location_component) dispatch(viewer_set_selectedmenu('geolocation'));
  }

  function toggleGeoLocationTracking(val) {
    const tracking = val;
    dispatch(viewer_update_mapcontrol({ ...geo_location_control, tracking }));
  }

  function getComponentMapButton(type) {
    if (type === 'Coordinates') {
      return (!!coordinates_control && !!coordinates_control.show_button) ?
        <Button key={type}
          title={coordinates_control.title || 'Obter coordenadas'}
          icon="fas fa-bullseye"
          className={exclusive_mapcontrol === 'Coordinates' ? "p-button-rounded p-button-raised active" : "p-button-rounded p-button-raised"}
          onClick={e => { e.currentTarget.blur(); toggleCoordinatesControl() }}
        /> : null;
    } else if (type === 'FeatureInfo') {
      return (!!feature_info_control && !!feature_info_control.show_button) ?
        <Button key={type}
          title={feature_info_control.title || 'Identificar elementos'}
          icon="pi pi-info-circle"
          className={exclusive_mapcontrol === 'FeatureInfo' ? "p-button-rounded p-button-raised active" : "p-button-rounded p-button-raised"}
          onClick={e => { e.currentTarget.blur(); toggleFeatureInfoControl() }}
        /> : null;
    } else if (type === 'GeoLocation') {
      return (!!geo_location_control && !!geo_location_control.show_button && !!window.navigator.geolocation) ?
        <div className="map-controls-geolocation" key={type}
          onMouseOver={e => { setGeoLocationSettings(true); }}
          onMouseLeave={e => { setGeoLocationSettings(false); }}>
          <Button 
            title={geo_location_control.title || t("myLocation", "A minha localização")}
            icon="pi pi-globe"
            className={geoLocationActive ? "p-button-rounded p-button-raised active" : "p-button-rounded p-button-raised"}
            onClick={e => { e.currentTarget.blur(); toggleGeoLocationControl() }}
          />
          <div className="btn-geolocation-options" style={!geoLocationActive || !geoLocationSettings ? { display: "none" } : {}}
            onMouseLeave={e => { setGeoLocationSettings(false); }}
          >
            <input type="checkbox" onClick={e => { toggleGeoLocationTracking(e.currentTarget.checked); }} checked={geoLocationTracking} />
            <label> {t("myLocationUpdatePosition", "Atualizar posição")}</label>
          </div>
        </div> : null;
    } else {
      return null;
    }
  }

  // Apply state
  if (dragBoxInteraction) dragBoxInteraction.setActive(dragBox);
  return (
    <div id="map-controls" className="map-controls">

      {viewer.config_json.map_controls.map(c => {
        return getComponentMapButton(c.type);
      })}

      {core.renderComponents({
        region: 'map_tools',
        props: { core, actions, viewer, dispatch, mainMap: mainMap },
        separator: " ",
        parent: record
      })}

    </div>
  )
}