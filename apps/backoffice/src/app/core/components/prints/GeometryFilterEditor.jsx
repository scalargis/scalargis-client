import React, { useState, useEffect } from "react";
import { Alert, Button, Group, Modal, NumberInput, Select, Tabs, Textarea } from '@mantine/core';
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
import { getWindowSize } from '../../utils';

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
  const wkt = format.writeGeometry(geom);
  return wkt;
};

const GeometryFilterEditor = props => {
  const [data, setData] = useState(props.data ? {...props.data} : {});
  const [coordinateSystems, setCoordinateSystems] = useState();
  const [showForm, setShowForm] = useState(false);

  // set intial state
  const [ features, setFeatures ] = useState([]);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const { register, watch, setValue, handleSubmit, clearErrors, control, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

  const fieldError = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].message) return errors[name].message;

      if (errors[name].type === 'required') {
        return 'Campo obrigatório';
      } else if (errors[name].type === 'maxLength') {
        return 'O número de caracteres é superior à dimensão máxima permitida';
      } else if (errors[name].type === 'pattern') {
        return 'Formato inválido';
      }
    }
    return undefined;
  };

  const onSave = (formData) => {
    if (formData.geometryWKT && formData.geometrySRID) {
      try {
        const geom = getGeometryFromWKT(formData.geometryWKT, null);
        if (geom) {
          const final_geom_wkt = getWKTFromGeometry(geom.clone());
          props.onSave({geometryWKT: final_geom_wkt, geometrySRID: formData.geometrySRID, tolerance: formData.tolerance});
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
  useEffect(() => {
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
    setData({...props.data});
  }, [props.data]);

  return (

    <React.Fragment>

      <div className="field col-12 mb-1">
        { data.geometryWKT ?
          <Alert color="informative" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-info-circle" />
              <span>Clique em 'Editar' para configurar o filtro espacial.</span>
            </Group>
          </Alert>
          :
          <Alert color="warning" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-exclamation-triangle" />
              <span>Sem filtro espacial definido. Clique em 'Editar' para definir um filtro espacial.</span>
            </Group>
          </Alert>
        }
      </div>

      <Group justify="flex-end" gap="xs" className="m-2">
        { data.geometryWKT &&
        <Button type="button" variant="outline" color="danger" leftSection={<i className="pi pi-trash" />}
          onClick={(e)=> {e.preventDefault(); onRemove();}}>Remover</Button>
        }
        <Button type="button" variant="outline" leftSection={<i className="pi pi-pencil" />}
          onClick={(e)=> {e.preventDefault(); setShowForm(true)}}>Editar</Button>
      </Group>

      { showForm &&
      <Modal title="Edição de Filtro Espacial" opened={showForm} size={isMobile ? '95%' : '45vw'} onClose={onHide}>
        <form>
          <div className="grid formgrid">
            <div className="field col-12">
              <Tabs defaultValue="wkt" keepMounted={false}>
                <Tabs.List>
                  <Tabs.Tab value="wkt">WKT</Tabs.Tab>
                  <Tabs.Tab value="map">Mapa</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="wkt" pt="sm">
                  <div className="field col">
                    <Controller name="geometrySRID" control={control} rules={{required: 'Campo obrigatório.' }}
                      render={({ field }) => (
                        <Select
                          id="geometrySRID"
                          label="Sistema de Coordenadas"
                          data={coordinateSystems ? coordinateSystems.map(c => ({ value: String(c.value), label: c.label })) : []}
                          value={field.value == null ? null : String(field.value)}
                          onChange={(value) => field.onChange(value == null ? null : Number(value))}
                          error={fieldError(errors, 'geometrySRID')}
                          clearable
                        />
                      )}
                    />
                  </div>
                  <div className="field col-12">
                    <Textarea id="geometryWKT" label="Geometria (WKT)" rows={5}
                      error={fieldError(errors, 'geometryWKT')}
                      {...register("geometryWKT", { required: 'Campo obrigatório.' })} />
                  </div>
                </Tabs.Panel>
                <Tabs.Panel value="map" pt="sm">
                  <div>
                    <MapWrapper features={features} />
                  </div>
                </Tabs.Panel>
              </Tabs>
            </div>
            <div className="field col-12">
              <Controller name="tolerance" control={control}
                render={({ field }) => (
                  <NumberInput id="tolerance" label="Tolerância (m)" hideControls
                    value={field.value ?? ''}
                    onChange={(value) => field.onChange(value === '' ? null : value)} />
                )}
              />
            </div>
          </div>

          <Group justify="flex-end" gap="xs" className="mt-4">
            <Button type="button" variant="subtle" leftSection={<i className="pi pi-times" />}
              onClick={onHide}>Fechar</Button>
            <Button type="button" leftSection={<i className="pi pi-check" />}
              onClick={handleSubmit((d) => onSave(d))}>Gravar</Button>
          </Group>
        </form>
      </Modal>
      }
    </React.Fragment>
  );
}

export default GeometryFilterEditor;
