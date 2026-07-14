import React, { useState, useEffect, useMemo } from 'react';
import { DataView } from 'primereact/dataview';
import { Button } from 'primereact/button';
import classNames from 'classnames';

import { getDescribeFeatureType } from './service';
import SearchLayerForm from './SearchLayerForm';

export default function SearchLayers(props) {
  const { core, config, layer, layers, setLayersList, actions, pubsub, dispatch, mainMap, Models, record } = props;
  const { viewer, auth } = config;
  const component_cfg = record.config_json ? { show_icon: true, ...record.config_json } : { show_icon: true};
  const { show_icon } = component_cfg;

  const [loaded, setLoaded] = useState(false);

  const [active, setActive] = useState(null);
  const [schemas, setSchemas] = useState({});

  const [errorSchema, setErrorSchema] = useState(null);


  const schemaConfig = useMemo(() => {
    if (!active) return null;

    let schemaCfg = null
    if (active.schema) {
      schemaCfg = {
        schema: {...active.schema},
        uischema: {...active.uischema}
      }
    }
    
    if (schemas[active.id]) {
      schemaCfg = {...schemas[active.id]};
    }

    return schemaCfg;
  }, [active, schemas]);

  useEffect(() => {
    setErrorSchema(null);
    if (!active) return;

    const {schema={}, uischema={}, geometry_field} = schemaConfig || {};

    if (schema && Object.keys(schema).length > 0 && uischema && Object.keys(uischema).length) {
      updateLayerSchema(active.id, {schema, uischema, geometry_field: null});
      setLoaded(true);
      return;
    }

    setLoaded(false);

    props.setBlockedPanel(true);

    getDescribeFeatureType({cfg: active, core, viewer, auth}).then(data => {
      try {
        if (active?.uischema) {
          updateLayerSchema(id, {
            ...data,
            uischema: {
              type: 'VerticalLayout',
              elements: [...(data?.uischema?.elements ?? [])],
              ...active?.uischema
            }
          });
        } else {
          updateLayerSchema(active.id, data);
        }
      } catch (err) {
        return Promise.reject(err);
      }
      setLoaded(true);
    }).catch(error => {
      console.log(error);
      setErrorSchema({message:'Não foi possível obter informação do tema'});
    }).finally(()=> {
      props.setBlockedPanel(false);
    });
  }, [active, schemaConfig?.id]);

  useEffect(() => {
    if (layers.length === 1 && (!component_cfg.show_main || layers[0].is_standalone)) {
      setActive(layers[0]);
    }
  }, [layers, component_cfg.show_main]);

  const updateLayerSchema = (id, data) => {
    const sch = {...schemas};
    sch[id] = data;
    setSchemas(sch);
  }

  const itemTemplate = (item, index) => {

    const iconClass = {
      "pi": !item.icon
    }
    iconClass[item.icon] = item.icon ? true : false;
    iconClass['pi-bars'] = item.icon ? false : true;

    return (
      <div className={classNames('card col-12 pt-2', { 'border-top-1 surface-border pt-2': index !== 0 })} key={index}>
          <div class="flex flex-row p-1 pt-2 gap-3" key={index} style={{cursor: 'pointer'}} title={item.tooltip || 'Pesquisar'} onClick={e => setActive(item)}>
            <div class="flex-none flex align-items-center justify-content-center">
              <i className={classNames(iconClass)} style={{fontSize: '2.5em'}}></i>
            </div>
            <div class="flex-grow-1 flex align-items-center justify-content-left">{item.title}</div>
            <div class="flex-none flex align-items-center justify-content-center">
              <Button icon="pi pi-chevron-right" size="small" rounded text title={item.tooltip || 'Pesquisar'} onClick={e => setActive(item)}></Button>
            </div>
          </div>
          {item?.description && <div className="col-12"><small className="text-color-secondary italic">{item.description}</small></div>}
      </div>
    );
  }

  if (loaded && active) {
    const showPanelPrev = component_cfg?.layers?.length > 1 || component_cfg.show_main === true;

    return <SearchLayerForm
      core={core}
      viewer={viewer}
      auth={auth}
      actions={actions}
      pubsub={pubsub}
      dispatch={dispatch}
      mainMap={mainMap}
      Models={Models}
      layers={layers}
      layer={layer}
      searchConfig={active}
      schemaConfig={schemaConfig}
      goPanelSearchPrev={showPanelPrev && ((e) => 
        {
          layer.current.getSource().clear();
          setActive(null);
          setLayersList();
        }
      )}
      errorSchema={errorSchema}
      setBlockedPanel={props.setBlockedPanel}
    />
  }

  const listTemplate = (items) => {
      if (!items || items.length === 0) return null;

      let list = items.map((item, index) => {
          return itemTemplate(item, index);
      });

      return <div className="grid grid-nogutter">{list}</div>;
  };

  if (component_cfg?.layers?.length > 1 || component_cfg.show_main === true) {
    return (
      <DataView value={layers} listTemplate={listTemplate} />    
    );
  }

  return (
    <></>
  )
}