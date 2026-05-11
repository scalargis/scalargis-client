import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import VectorLayer from 'ol/layer/Vector'
import { Vector } from 'ol/source';

import IntersectForm from './IntersectForm';
import LayerStyles from './config/styles.json';

import './style.css';


export default function Intersect({title, core, config, actions, dispatch, record, utils, setBlockedPanel}) {

  const { viewer, mainMap, Models } = config;

  // global
  //const [loaded, setLoaded] = useState(false);

  const intersectLayer = useRef();

  /*
  useEffect(() => {
    const intersectCfg = record?.config_json; 

    if (intersectCfg ?.config_url) {
      setBlockedPanel(true);
      const url = intersectCfg?.config_url;
      fetch(url).then(res => {
          return res.json();
      }).then(result => {
        if (result) {
            //setResults(result);
        }          
      }).catch(error => {
        console.log('error', error);
      }).finally(()=>{
        setTimeout(()=>setLoaded(true), 300);
        setBlockedPanel(false);
      });      
    } else {
      setLoaded(true);
    }
  }, []);
  */

  // Add Intersect layer
  useEffect(() => {
    if (!mainMap) return;
    
    if (!viewer?.loaded) return;

    const _layer = Models.Utils.findOlLayer(mainMap, 'intersect');

    if (_layer) {
      intersectLayer.current = _layer;
    } else {
        intersectLayer.current = new VectorLayer({
        id: 'intersect',
        renderMode: 'vector',
        source: new Vector({}),
        selectable: false
      });

      // Set custom styles
      const configStyles = {...LayerStyles};
      const customStyles = record?.config_json?.styles;
      for (const k in customStyles) {
        if (Array.isArray(customStyles?.[k])) {
          configStyles[k] =  [...configStyles[k], ...customStyles[k]];
        } else {
          configStyles[k] = customStyles[k];
        }
      }
      const finalStyles =[];
      for (const k in configStyles) {
        if (Array.isArray(configStyles[k])) {
          configStyles[k].forEach((st) => finalStyles.push(st));
        } else {
          finalStyles.push(configStyles[k]);
        }
      }
      intersectLayer.current.setStyle(finalStyles);
      // End custom styles

      const parentLayer = Models.Utils.findOlLayer(mainMap, 'overlays');

      if (parentLayer) {
        parentLayer.getLayers().getArray().push(intersectLayer.current);
      } else {
        mainMap.addLayer(intersectLayer.current);
      }
    }

  }, [viewer?.loaded, mainMap]);

  if (!intersectLayer.current) return null;

  return (
    <div style={{ height: '100%' }}>

        <IntersectForm
            title={title}
            core={core}
            config={config}
            control={record}
            actions={actions}
            dispatch={dispatch}
            componentId={record?.id}
            intersectConfig={record?.config_json}
            intersectLayer={intersectLayer}
            setBlockedPanel={setBlockedPanel}
        />
    </div>
  )

}