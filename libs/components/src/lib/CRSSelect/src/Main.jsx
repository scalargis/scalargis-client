import React, { useEffect, useRef, useState, useMemo } from 'react';
import Cookies from 'universal-cookie';
import { Dropdown } from 'primereact/dropdown';
import { containsCoordinate } from 'ol/extent';
import { transform } from 'ol/proj';
import MousePosition from 'ol/control/MousePosition';
import {createStringXY} from 'ol/coordinate';
import './index.css'

function parseExtent(extent) {
  if (!extent) return [0,0,1,1];
  return extent.split(' ').map(v => Number(v));
}

function isCoordInExtent(coords, proj_coords, extent) {
  if (!coords) return false;
  const wgsCoords = transform(coords, proj_coords, 'EPSG:4326');
  return containsCoordinate(parseExtent(extent), wgsCoords) === false
}

export default function Main({ core, config, actions, record }) {
  const { viewer, mainMap, dispatch } = config;
  const { display_crs, center } = viewer.config_json;
  const { viewer_set_displaycrs } = actions;
  
  const [listCRS, setListCRS] = useState(viewer.config_json.crs_list || []);

  const cursorRef = useRef()

  const handleChange = (event) => {
    dispatch(viewer_set_displaycrs(event.value));
  }

  const userRoles = useMemo(()=>{
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
  
    let user_roles = [];
    if (logged && logged.userroles && logged.userroles.length) {
      user_roles = [...logged.userroles];
    }
    return user_roles;
  }, []);

  useEffect(() => {
    if (record && record.config_json && record.config_json.crs_list && record.config_json.crs_list.length) {
      let crs_filtered = (viewer.config_json.crs_list || []).filter( c => {
        return record.config_json.crs_list.includes(c.srid);
      });
      setListCRS(crs_filtered);
    }
  }, []);

  useEffect(() => {
    const selected = listCRS.find(v => v.srid === display_crs);
    let precision = String(selected.precision).length-1;

    if (selected.precision_roles?.length && userRoles?.length) {
      const rp = selected.precision_roles.find(elem => (elem?.roles || []).some(item => userRoles.includes(item)));
      if (rp) {
        if (rp.precision) {
          precision = String(rp.precision).length-1;
        }
      }
    }

    const mousePosition = new MousePosition({
      target:  cursorRef.current,
      coordinateFormat: createStringXY(precision),
      className: 'viewer-mouse-position',
      projection: 'EPSG:' + display_crs
    });
    mainMap.addControl(mousePosition);

    // Cleanup on dismount
    return () => {
      mainMap.removeControl(mousePosition);
    }
  }, [display_crs]);

  // On change center, change display_crs if necessary
  useEffect(() => {
    let changeCRS = false;
    const proj_code = mainMap.getView().getProjection().getCode();
    if (display_crs && center) {
      listCRS.map(i => {
        const disabled = isCoordInExtent(center, proj_code, i.extent)
        if ((i.srid === display_crs) && disabled) changeCRS = true;
        return i;
      });
      if (changeCRS) dispatch(viewer_set_displaycrs(4326));
    }
  }, [center]);

  // Prepare render options
  if (listCRS.length === 0) return null;
  let proj_code = mainMap ? mainMap.getView().getProjection().getCode() : 'EPSG:3857';
  let display = center;
  let selected = listCRS.find(v => v.srid === display_crs);
  try {
    if (selected.code !== proj_code) display = transform(center, proj_code, 'EPSG:' + selected.srid);
    let fixedLength = String(selected.precision).length-1;
    display = display.map(v => (Math.round(parseFloat(v) * selected.precision) / selected.precision).toFixed(fixedLength));
  } catch (e) {
    console.log(e);
  }
  return (
    <div className="crsselect">
      <div id="cursor_coords" ref={cursorRef}></div>
      <Dropdown 
        value={display_crs} 
        options={listCRS.map(i => {
          return {
            ...i,
            value: i.srid,
            label: i.label || i.title,
            disabled: isCoordInExtent(center, proj_code, i.extent)
          }
        })} 
        onChange={handleChange} 
        placeholder={listCRS ? listCRS.find(v => v.srid === display_crs).label : 'Escolha'}
      />
    </div>
  );
}
