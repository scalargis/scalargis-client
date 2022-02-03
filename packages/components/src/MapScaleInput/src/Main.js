import React, { useEffect, useRef, useState } from 'react';
import { InputMask } from 'primereact/inputmask';
import { InputText } from 'primereact/inputtext';
import './style.css'

export default function Main({ config, actions }) {
  const { viewer, mainMap, dispatch, Models } = config;
  const { MapModel } = Models;
  const { getResolutionForScale, getScaleForResolution } = MapModel;

  const [editing, setEditing] = useState(false);
  const [scale, setScale] = useState('');

  function onChangeScale (e) {
    const input = e.target.value;
    setScale(input);
    setEditing(true);
  }

  function onSetScale(e) {
    const key = e.which || e.keyCode;
    if (key !== 13) return;

    let value = '' + scale;
    let current_scale = '' + scale;
    if (current_scale.indexOf(':')) value = value.substr(current_scale.indexOf(':')+1);
    if (!!/\D/.test(value)) return;
    value = parseInt(value, 10);
    if (isNaN(value)) return;
    const resolution = getResolutionForScale(value, 'm');
    setEditing(false);
    mainMap.getView().setResolution(resolution);
  }

  function onEndEditing() {
    if (editing) setEditing(false);
  }

  useEffect(()=>{
    if (!mainMap) return;
    const resolution = mainMap.getView().getResolution();
    const scale = getScaleForResolution(resolution, 'm');
    setScale('1:' + scale);
  }, [viewer]);

  return (
    <div className="mapscale-input">
      <InputText value={scale}
        onChange={(e) => onChangeScale(e)}
        onKeyUp={(e) => onSetScale(e)}
        onBlur={(e) => onEndEditing(e)}>
      </InputText>
    </div>
    );
}