import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { ProgressSpinner } from 'primereact/progressspinner';

import { i18n } from '@scalargis/components';

import Intersect from './Intersect';

import './style.css';

/**
 * Main menu component
 */
export function MainMenu({ className, config, actions, record }) {

  const { viewer, mainMap, dispatch } = config;

  const t = i18n.translateValue;

  const title = t(record?.title || "Interseção de Temas", record?.title || "Interseção de Temas");

  if (record && record.target === 'mainmenu') {

      if (record?.config_json?.btn_image) {
        return (
          <Button
            title={title}
            className={className ? className + ' intersect-layers-main-menu-btn' : null}
            icon="pi"
            style={{ backgroundImage: `url("${record.config_json.btn_image}")` }}
            onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
          />
        )
      }

      return (
          <Button
            title={title}
            className={className}
            icon={record?.config_json?.btn_icon ? record.config_json.btn_icon : "pi pi-objects-column"}
            onClick={e => config.dispatch(actions.viewer_set_selectedmenu(record.id))}
          />         
      )
    } else {
      return null;
    }
}

export default function Main(props) {
  
  const {as, core, config, actions, record, utils} = props;
  const { viewer, mainMap, dispatch } = config;

  const t = i18n.translateValue;

  const component_cfg = record.config_json || {};
  const header = t(component_cfg.header, component_cfg.header);

  const ref = useRef(null);
  const [blockedPanel, setBlockedPanel] = useState(false);
  
  const className = config?.classname ? `sg-intersect-layers ${config?.classname}` : 'sg-intersect-layers';


  const getBlockFullHeight = () => {

    const oDiv = ref.current;
    
    let clientHeight = 0;
    let height = 0;
    
    try {
      clientHeight = oDiv.clientHeight;
    
      const sOriginalOverflow = oDiv.style.overflow;
      const sOriginalHeight = oDiv.style.height;
      oDiv.style.overflow = "";
      oDiv.style.height = "";

      height = oDiv.offsetHeight;
      oDiv.style.height = sOriginalHeight;
      oDiv.style.overflow = sOriginalOverflow;
    } catch {}
        
    return clientHeight > height ? clientHeight : height;
  }

  function renderContent() {
    return (
      <Intersect
        title={t(record?.title || "Interseção de Temas", record?.title || "Interseção de Temas")}
        core={core}
        config={config}
        actions={actions}
        dispatch={dispatch}
        record={record}
        utils={utils}
        componentId={record?.id}
        setBlockedPanel={setBlockedPanel}
      />
    ) 
  }

  if (as === 'panel') return (
    <div ref={ref} className="p-blockui-container" style={{height: 'calc(100%)'}}>
      <Panel header={header} className={className}>
        { renderContent() }
      </Panel>
      { blockedPanel && <div className="p-blockui p-component-overlay p-component-overlay-enter" style={{zIndex: 1003, height: getBlockFullHeight()}}>
        <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="8" fill="#EEEEEE" animationDuration=".5s"/>
      </div> }
    </div>

  )  

  // Render component
  return renderContent()
}