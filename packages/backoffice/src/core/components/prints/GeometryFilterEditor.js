import React, { useState, useEffect } from "react";
import { TabView,TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { useForm, Controller } from 'react-hook-form';

import OlWKT from "ol/format/WKT";
import * as OlGeom from "ol/geom";
import * as OlProj from 'ol/proj';
import { Fill as OlFill, Stroke as OlStroke, Style as OlStyle } from 'ol/style';
import OlFeature from 'ol/Feature';
import {applyTransform} from 'ol/extent';
import {register as proj4register } from 'ol/proj/proj4';
import Proj4 from 'proj4';
import {
  LineString,
  LinearRing,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
  GeometryCollection
} from 'ol/geom';
import OL3Parser from 'jsts/org/locationtech/jts/io/OL3Parser';
import {BufferOp} from 'jsts/org/locationtech/jts/operation/buffer';

import MapWrapper from '../common/MapWrapper';

// Add projections
const addProjections = (projections) => {
  projections.map(i => {
    if (!OlProj.get('EPSG:'+i.srid)) {  
      try {
        Proj4.defs('EPSG:'+i.srid, i.defs);
        //This function should be called whenever changes are made to the proj4 registry,
        //e.g. after calling proj4.defs(). Existing transforms will not be modified by this function.
        proj4register(Proj4);
        const newProj = OlProj.get('EPSG:'+i.srid);
        const fromLonLat = OlProj.getTransform('EPSG:4326', newProj);
        if (i.extent) {
          const worldExtent = i.extent.split(' ').map(Number);
          newProj.setWorldExtent(worldExtent);
          const extent = applyTransform(worldExtent, fromLonLat, undefined, 8);
          newProj.setExtent(extent);
        }
      } catch (e) {
        console.log(e);
      }
    }
    return i;
  });
}

const getGeometryFromWKT = function (wkt, options) {
  const format = new OlWKT();
  const geom = options ? format.readGeometry(wkt, options) : format.readGeometry(wkt);

  return geom;
};

const getWKTFromGeometry = function (geom) {
  const format = new OlWKT();
  let wkt = format.writeGeometry(geom);
  return wkt;
};

const GeometryFilterEditor = props => {
  const [data, setData] = useState(props.data ? {...props.data} : {});
  const [coordinateSystems, setCoordinateSystems] = useState();
  const [showForm, setShowForm] = useState(false);

  // set intial state
  const [ features, setFeatures ] = useState([])  

  const { register, watch, setValue, handleSubmit, clearErrors, control, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

  const getFormErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].type === 'maxLength') {
         return <small className="p-error">O número de caracteres é superior à dimensão máxima permitida</small>
      } else if (errors[name].type === 'pattern') {
        return <small className="p-error">Formato não permitido</small>
      } else {
        return <small className="p-error">{errors[name].message}</small>
      }
    }      
  };  

  const onSave = (formData) => {
    if (formData.geometryWKT && formData.geometrySRID) {
      try {
        const geom = getGeometryFromWKT(formData.geometryWKT, null);
        if (geom) {
          const final_geom_wkt = getWKTFromGeometry(geom.clone().transform('EPSG:' + formData.geometrySRID, 'EPSG:3763'));
          props.onSave({geometryWKT: final_geom_wkt, geometrySRID: 3763, tolerance: formData.tolerance});
          setShowForm(false);
        } else {
          console.log('error');
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  const onRemove = () => {
    //Clear Form
    setValue('geometrySRID', null, { shouldValidate: false });
    setValue('geometryWKT', null, { shouldValidate: false });
    setValue('tolerance', null, { shouldValidate: false });
    //Save new state 
    props.onSave({geometryWKT: null, geometrySRID: null, tolerance: null});
  }

  const onHide = () => {
    setValue('geometrySRID', props?.data.geometrySRID, { shouldValidate: false });
    setValue('geometryWKT', props?.data.geometryWKT, { shouldValidate: false });
    setValue('tolerance', props?.data.tolerance, { shouldValidate: false });
    clearErrors();
    setShowForm(false); 
  }

  const refreshFeatures = (geom_data) =>  {
    if (!geom_data.geometryWKT || !geom_data.geometrySRID) {
      setFeatures([]);
    } else {
      const format = new OlWKT();
      const new_features = [];

      const feature = format.readFeature(geom_data.geometryWKT, {
        dataProjection: 'EPSG:' + geom_data.geometrySRID,
        featureProjection: 'EPSG:3857',
      });

      new_features.push(feature);

      if (geom_data.tolerance && geom_data.tolerance > 0) {
        try {
          const parser = new OL3Parser();
          parser.inject(
            Point, 
            LineString, 
            LinearRing, 
            Polygon, 
            MultiPoint, 
            MultiLineString, 
            MultiPolygon, 
            GeometryCollection
          );

          // convert the OpenLayers geometry to a JSTS geometry
          const jstsGeom = parser.read(feature.getGeometry());
          const jstsBuffer = BufferOp.bufferOp(jstsGeom, geom_data.tolerance);
          
          const geomBuffer = parser.write(jstsBuffer);
          const buffered = new OlFeature({
            geometry: geomBuffer
          });
        
          const bufferStyle = new OlStyle({
            stroke : new OlStroke({
              color : 'rgba(100,27,0,1.0)',
              width : 1    
            }),
            fill :  new OlFill({
              color: 'rgba(0,0,0,0)'
          })
          });

          buffered.setStyle(bufferStyle);
          new_features.push(buffered);
        } catch (error) {
          console.log(error);
        }
      }

      setFeatures(new_features);
    }
  }

  useEffect(() => {
    refreshFeatures(props.data);
  }, []);
  
  // Callback version of watch.  It's your responsibility to unsubscribe when done.
  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      //Refresh feature
      refreshFeatures(value);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (props.coordinateSystems) {
      setCoordinateSystems(props.coordinateSystems.map( c => { return { value: parseInt(c.config_json.srid), label: c.config_json.title }; }));
      const projections = props.coordinateSystems.map( c => { 
        return { 
          srid: parseInt(c.config_json.srid),
          defs: c.config_json.defs,
          extent: c.config_json.extent
        }
      });
      addProjections(projections);
      refreshFeatures(props.data);
    }
  }, [props.coordinateSystems]);

  useEffect(() => {
    //console.log(props.data);
    setData({...props.data});
  }, [props.data]);  

  const renderFooter = (name) => {
    return (
        <div>
            <Button 
              label="Fechar"
              icon="pi pi-times"
              onClick={onHide} className="p-button-text" />
            <Button 
              label="Gravar"
              icon={"pi pi-check"}
              onClick={handleSubmit((d) => onSave(d))}
              autoFocus />
        </div>
    );
  }

  return (

    <React.Fragment>
      
      <div className="p-field p-col-12 p-mt-2 p-mb-4">
        <div>
          { data.geometryWKT ?
            <Message severity="info" text="Clique em 'Editar' para configurar o filtro espacial." /> 
            :
            <Message severity="warn" text="Sem filtro espacial definido. Clique em 'Editar' para definir um filtro espacial." />
          }
        </div>
      </div>  

      <div className="p-grid">
        <div className="p-col-6">
          { data.geometryWKT &&      
          <Button type="text" label="Remover" icon="pi pi-trash" className="p-button-danger p-button-outlined"
           onClick={(e)=> {e.preventDefault(); onRemove();}} />
          }
        </div>
        <div className="p-col-6">
          <Button type="text" label="Editar" icon="pi pi-times" className="p-button-outlined"
          onClick={(e)=> {e.preventDefault(); setShowForm(true)}} />     
        </div>
      </div>

      { showForm &&
      <Dialog header={"Edição de Filtro Espacial"} visible={showForm} style={{ width: '50vw' }} 
        footer={renderFooter} 
        onHide={onHide}>
        <form>
          <div className="p-fluid p-formgrid p-grid">
            <div className="p-field p-col-12">
              <TabView>
                <TabPanel header="WKT">          
                  <div className="p-col p-field">
                    <label htmlFor="format">Sistema de Coordenadas</label>
                    <Controller name="geometrySRID" control={control} rules={{required: 'Campo obrigatório.' }}
                      render={({ field }) => {
                        return <Dropdown id="geometrySRID" {...field} 
                          options={coordinateSystems} showClear
                          onChange={(e) => field.onChange(e.value)}
                          className={classNames({ 'p-invalid': errors.geometrySRID })}
                        />
                      }}                    
                    />
                    {getFormErrorMessage(errors, 'geometrySRID')} 
                  </div>
                  <div className="p-field p-col-12">
                    <label htmlFor="orientation">Geometria (WKT)</label>
                    <InputTextarea id="geometryWKT" name="geometryWKT" rows={5}
                      {...register("geometryWKT", { required: 'Campo obrigatório.' })} 
                      className={classNames({ 'p-invalid': errors.geometryWKT })} />
                    {getFormErrorMessage(errors, 'geometryWKT')}  
                  </div>
                </TabPanel>
                <TabPanel header="Mapa"> 
                  <div>
                    <MapWrapper features={features} />
                  </div>
                </TabPanel>
              </TabView>
            </div>
            <div className="p-field p-col-12">
              <label htmlFor="tolerance">Tolerância (m)</label>
              <Controller name="tolerance" control={control}
                render={({ field }) => {
                  return <InputNumber id="tolerance" {...field}                    
                    onChange={(e) => field.onChange(e.value)} />
                }}                    
              />
            </div>
            </div>
        </form>
      </Dialog>
      }
    </React.Fragment>
  );
}

export default GeometryFilterEditor;