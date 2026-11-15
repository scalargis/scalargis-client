import React, { useState, useEffect, useMemo } from 'react'
import { Alert, Button, Group, Text, UnstyledButton } from '@mantine/core';
import classNames from 'classnames';
import { IconAlertTriangle, IconChevronLeft, IconRefresh } from '@scalargis/ui';

import { i18n } from '../../components';

import { getDescribeFeatureType } from './service';
import SearchLayerForm from './SearchLayerForm';

export default function SearchLayers(props) {
  const { core, config, layer, layers, setLayersList, actions, pubsub, dispatch, mainMap, Models, record } = props;
  const { viewer, auth } = config;
  const component_cfg = record.config_json ? { show_icon: true, ...record.config_json } : { show_icon: true};
  const { show_icon } = component_cfg;

  const [active, setActive] = useState(null);
  const [schemas, setSchemas] = useState({});
  const [load, setLoad] = useState({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

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
    if (!active) {
      setLoad({ status: 'idle' });
      return;
    }

    const {schema={}, uischema={}} = schemaConfig || {};

    if (schemas[active.id]) {
      setLoad({ status: 'ready', layer: active });
      return;
    }

    if (schema && Object.keys(schema).length > 0 && uischema && Object.keys(uischema).length) {
      updateLayerSchema(active.id, {schema, uischema, geometry_field: null});
      setLoad({ status: 'ready', layer: active });
      return;
    }

    let current = true;
    setLoad({ status: 'loading', layer: active });
    props.setBlockedPanel(true);

    getDescribeFeatureType({cfg: active, core, viewer, auth}).then(data => {
      if (!current) return;
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
      setLoad({ status: 'ready', layer: active });
    }).catch(error => {
      console.log(error);
      if (!current) return;
      setLoad({ status: 'failed', layer: active, detail: error?.message || null });
    }).finally(()=> {
      props.setBlockedPanel(false);
    });

    return () => { current = false; };
  }, [active, attempt]);

  useEffect(() => {
    if (layers.length === 1 && (!component_cfg.show_main || layers[0].is_standalone)) {
      setActive(layers[0]);
    }
  }, [layers, component_cfg.show_main]);

  const updateLayerSchema = (id, data) => {
    setSchemas(prev => ({...prev, [id]: data}));
  }

  const showPanelPrev = (
    (component_cfg.layers && component_cfg.layers.length > 1) || component_cfg.show_main === true
    ) ? true : false;

  const goBack = showPanelPrev && ((e) =>
    {
      layer.current.getSource().clear();
      setActive(null);
      setLayersList();
    }
  );

  if (active && load.layer === active && load.status === 'failed') {
    const title = active.title ? i18n.translateValue(active.title, active.title) : '';
    return (
      <>
        {goBack && <div className="mt-2">
          <Button size="xs" leftSection={<IconChevronLeft />} onClick={goBack}>
            {i18n.translateValue("back", "Voltar")}
          </Button>
        </div>}
        <div className="mt-2">{title}</div>
        <hr />
        <Alert color="warning" py="xs" role="alert">
          <Group justify="center" gap="xs" wrap="nowrap">
            <IconAlertTriangle />
            <span>{i18n.translateValue("searchLayerSchemaError", "Não foi possível obter informação do tema")}</span>
          </Group>
          {load.detail && <Text size="sm" ta="center" mt="xs">{load.detail}</Text>}
        </Alert>
        <Group justify="center" mt="md">
          <Button type="button" variant="default" leftSection={<IconRefresh />} onClick={() => setAttempt(n => n + 1)}>
            {i18n.translateValue("tryAgain", "Tentar de novo")}
          </Button>
        </Group>
      </>
    )
  }

  if (active && load.layer === active && load.status === 'ready') {
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
      goPanelSearchPrev={goBack}
      setBlockedPanel={props.setBlockedPanel}
    />
  }

  if ((component_cfg.layers && component_cfg.layers.length > 1) || component_cfg.show_main === true) {
    return (
      <div>
        {layers.map((l, i) => {

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
