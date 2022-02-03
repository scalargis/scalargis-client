import React, { useState, useEffect } from 'react'
import { Card } from 'primereact/card';
import classNames from 'classnames'
import SearchLayerForm from './SearchLayerForm';

export default function SearchLayers(props) {
  const { config, layer, layers, actions, dispatch, mainMap, Models, record } = props;
  const { viewer, auth } = config;
  const component_cfg = record.config_json ? { show_icon: true, ...record.config_json } : { show_icon: true};
  const { show_icon } = component_cfg;

  const [active, setActive] = useState(null);
  const [schemas, setSchemas] = useState({});

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

  if (active) {
    let schemaConfig = null;

    if (active.schema) {
      schemaConfig = {
        schema: {...active.schema},
        uischema: {...active.uischema}
      }
    }
    
    if (schemas[active.id]) {
      schemaConfig = {...schemas[active.id]};
    }

    const showPanelPrev = (
      (component_cfg.layers && component_cfg.layers.length > 1) || component_cfg.show_main === true
      ) ? true : false;

    return <SearchLayerForm
      viewer={viewer}
      auth={auth}
      actions={actions}
      dispatch={dispatch}
      mainMap={mainMap}
      Models={Models}
      layers={layers}
      layer={layer}
      searchConfig={active}
      schemaConfig={schemaConfig}
      updateLayerSchema={updateLayerSchema}
      goPanelSearchPrev={showPanelPrev && ((e) => 
        {
          layer.current.getSource().clear();
          setActive(null);
        }
      )}
      setBlockedPanel={props.setBlockedPanel}
    />
  }

  if ((component_cfg.layers && component_cfg.layers.length > 1) || component_cfg.show_main === true) {
    return (
      <div>
        {component_cfg.layers.map((l, i) => {

          const iconClass = {
            "pi": !l.icon,
            "p-mt-3": true
          }
          iconClass[l.icon] = l.icon ? true : false;
          iconClass['pi-bars'] = l.icon ? false : true;
          
          const icon = <div style={{ cursor: 'pointer'}} title={l.tooltip} 
            onClick={e => setActive(l)}>
            <i className={classNames(iconClass)} style={{fontSize: '3em'}}></i>
          </div>
          const title = <div style={{ cursor: 'pointer'}} title={l.tooltip} 
            onClick={e => setActive(l)}>
            {l.title}
          </div>

          return <Card key={i} header={show_icon && icon} title={title} subTitle={l.subtitle && l.subtitle} style={{ marginBottom: '2em' }} 
            onClick={e => console.log(e)}>
              <div className="p-m-0" dangerouslySetInnerHTML={{__html: l.description || ''}}></div>
            </Card>
        })}
      </div>
    )
  }

  return (
    <></>
  )
}