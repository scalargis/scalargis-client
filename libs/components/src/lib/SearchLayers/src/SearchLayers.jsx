import React, { useState, useEffect, useMemo } from 'react'
import { UnstyledButton } from '@mantine/core';
import classNames from 'classnames';

import { getDescribeFeatureType } from './service';
import SearchLayerForm from './SearchLayerForm';

export default function SearchLayers(props) {
  const { core, config, layer, layers, actions, pubsub, dispatch, mainMap, Models, record } = props;
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
          updateLayerSchema(active.id, {
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
    if (layers.length === 1 && !component_cfg.show_main) {
      setActive(layers[0]);
    }
  }, [layers, component_cfg.show_main]);

  const updateLayerSchema = (id, data) => {
    const sch = {...schemas};
    sch[id] = data;
    setSchemas(sch);
  }

  if (loaded && active) {
    const showPanelPrev = (
      (component_cfg.layers && component_cfg.layers.length > 1) || component_cfg.show_main === true
      ) ? true : false;

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
        }
      )}
      errorSchema={errorSchema}
      setBlockedPanel={props.setBlockedPanel}
    />
  }

  if ((component_cfg.layers && component_cfg.layers.length > 1) || component_cfg.show_main === true) {
    return (
      <div>
        {component_cfg.layers.map((l, i) => {

          const iconClass = {
            "pi": !l.icon,
            "mt-3": true
          }
          iconClass[l.icon] = l.icon ? true : false;
          iconClass['pi-bars'] = l.icon ? false : true;

          return (
            <UnstyledButton key={i} type="button" className="search-layer-card"
              title={l.tooltip} onClick={e => setActive(l)}>
              {show_icon &&
                <div className="search-layer-card-header">
                  <i className={classNames(iconClass)} style={{fontSize: '3em'}} aria-hidden="true"></i>
                </div>}
              <div className="search-layer-card-title">{l.title}</div>
              {l.subtitle && <div className="search-layer-card-subtitle">{l.subtitle}</div>}
              <div className="m-0" dangerouslySetInnerHTML={{__html: l.description || ''}}></div>
            </UnstyledButton>
          )
        })}
      </div>
    )
  }

  return (
    <></>
  )
}
