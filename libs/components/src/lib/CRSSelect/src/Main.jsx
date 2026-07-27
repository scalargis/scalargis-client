import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Select } from '@mantine/core';
import { containsCoordinate } from 'ol/extent';
import { transform } from 'ol/proj';
import MousePosition from 'ol/control/MousePosition';
import { createStringXY } from 'ol/coordinate';

import { i18n } from '../../components';

import './index.css';


function parseExtent(extent) {
  if (!extent) return [0,0,1,1];
  return extent.split(' ').map(v => Number(v));
}

function isCoordInExtent(coords, proj_coords, extent) {
  if (!coords) return false;
  const wgsCoords = transform(coords, proj_coords, 'EPSG:4326');
  return containsCoordinate(parseExtent(extent), wgsCoords);
}

export default function Main({ core, config, actions, record }) {
  const { viewer, mainMap, dispatch } = config;
  const { display_crs, center } = viewer.config_json;
  const { viewer_set_displaycrs } = actions;
  
  const [listCRS, setListCRS] = useState(viewer.config_json.crs_list || []);

  const t = i18n.translateValue;

  const mousePositionControlRef = useRef();
  const cursorRef = useRef();

  const invalid_extent_message = t(record?.config_json?.invalid_extent_message) || '';

  // Select values ride as strings; the redux state keeps the numeric srid.
  const handleChange = (value) => {
    if (!value) return;
    dispatch(viewer_set_displaycrs(Number(value)));
  }

  const userRoles = useMemo(()=>{
    const logged = core.getLoggedUser();
    let user_roles = [];
    if (logged && logged.userroles && logged.userroles.length) {
      user_roles = [...logged.userroles];
    }
    return user_roles;
  }, []);

  useEffect(() => {
    if (record && record.config_json && record.config_json.crs_list && record.config_json.crs_list.length) {
      const crs_filtered = (viewer.config_json.crs_list || []).filter( c => {
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

    if (mousePositionControlRef.current) {
      mainMap.removeControl(mousePositionControlRef.current);
    }
    
    const mousePosition = new MousePosition({
      target:  cursorRef.current,
      coordinateFormat: function(coordinate) {
        const proj_code = mainMap.getView().getProjection().getCode();
        const selected = listCRS.find(v => v.srid === display_crs);
        const extent = selected?.extent;
        const precision = String(selected.precision).length-1;

        if (!extent || !record?.config_json?.valid_extent) return createStringXY(precision)(coordinate);
        
        const inExtent = isCoordInExtent(coordinate, `EPSG:${display_crs}`, extent);
        if (inExtent) {
          return createStringXY(precision)(coordinate);
        } else {
          return invalid_extent_message;
        }
      },
      className: 'viewer-mouse-position',
      projection: 'EPSG:' + display_crs
    });
    mainMap.addControl(mousePosition);

    mousePositionControlRef.current = mousePosition;

    // Cleanup on dismount
    return () => {
      mainMap.removeControl(mousePosition);
    }
  }, [display_crs]);

  // On change center, change display_crs if necessary
  useEffect(() => {
    let changeCRS = false;
    const proj_code = mainMap.getView().getProjection().getCode();
    if (display_crs && center && record?.config_json?.auto_crs_change !== false) {
      listCRS.map(i => {
        const inExtent = isCoordInExtent(center, proj_code, i.extent)
        if ((i.srid === display_crs) && !inExtent) changeCRS = true;
        return i;
      });
      if (changeCRS) dispatch(viewer_set_displaycrs(4326));
    }
  }, [center]);

  // Prepare render options
  if (listCRS.length === 0) return null;
  const proj_code = mainMap ? mainMap.getView().getProjection().getCode() : 'EPSG:3857';
  let display = center;
  const selected = listCRS.find(v => v.srid === display_crs);
  try {
    if (selected.code !== proj_code) display = transform(center, proj_code, 'EPSG:' + selected.srid);
    const fixedLength = String(selected.precision).length-1;
    display = display.map(v => (Math.round(parseFloat(v) * selected.precision) / selected.precision).toFixed(fixedLength));
  } catch (e) {
    console.log(e);
  }

  return (
    <div className="crsselect">
      <div id="cursor_coords" ref={cursorRef} className="cursor-coords"></div>
      <Select
        size="xs"
        w={250}
        value={String(display_crs)}
        data={listCRS.map(i => {
          return {
            value: String(i.srid),
            label: i.label || i.title,
            disabled: !isCoordInExtent(center, proj_code, i.extent)
          }
        })}
        onChange={handleChange}
        allowDeselect={false}
        // This widget lives in the bottom footer, so the dropdown always
        // opens upward; the theme's bottom-start default would paint one
        // frame downward before floating-ui flips it (visible flicker).
        comboboxProps={{ position: 'top-start' }}
        aria-label={t('coordinateSystem') || 'Sistema de Coordenadas'}
        placeholder="Escolha"
      />
    </div>
  );
}
