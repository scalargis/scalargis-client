import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';

/*
const types = [
  { value: 'wms', label: 'WMS - Web Map service' },
  { value: 'wmts', label: 'WMTS - Web Map Tile Service' },
  { value: 'wfs', label: 'WFS - web Feature Service' },
  { value: 'shape', label: 'Shapefile - ficheiro .zip contendo .shp' },
  { value: 'kml', label: 'KML - Keyhole Markup Language' },
  { value: 'gml', label: 'GML - Geographic Markup Language' },
  { value: 'geojson', label: 'GeoJSON' },
  { value: 'dxf', label: 'DXF (v2000)' },
  { value: 'group', label: 'Grupo de Temas' },
];
*/

export default function WizardStepType(props) {
  const { types } = props;

  const type = props?.wizardData?.type;

  return (
    <div>
      
      <div className="p-mt-2">
        { types.map(t => (
          <div className="p-field-radiobutton" key={t.value}>
            <RadioButton
              id={'wizard_type' + t.value}
              value={t.value}
              name="type"
              onChange={(e) => props.onChange(e.value)}
              checked={type === t.value}
            />
            <label htmlFor={'wizard_type' + t.value}>{ t.label }</label>
          </div>
        ))}
      </div>
      
      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button           
          disabled={!type}
          onClick={e => {
            /*
            //let stepdata = props.initialData;
            let stepdata = props.wizardData || {};
            let previousType = stepdata.type;
            
            if (previousType != type){
              stepdata = props.initialData;
              stepdata.type = type;
             
              stepdata.items = [];
              stepdata.dataitems = [];
              stepdata.url = '';
            }
            props.onSave(stepdata);
            */
            props.onSave();
          }}
          label="Seguinte" />
      </div>
    </div>
  )
}
