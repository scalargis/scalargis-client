import React, { useContext, useEffect, useRef, useState } from "react"
import AppContext from "../../../AppContext"
import OLGroupLayer from 'ol/layer/Group'
import MorphLayer, { dumpLayers } from "./MorphLayer"

const GroupLayer = ({ layers, config, group, checked, viewer }) => {

  const { mainMap } = useContext(AppContext);
  const [loaded, setLoaded] = useState(false);
  const layer = useRef();

  useEffect(() => {
    if (!mainMap) return;
    setLoaded(false);

    layer.current = new OLGroupLayer({
      id: config.id,
      title: config.title,
      type: config.type,
      visible: config.active
    });
    
    if (!group) mainMap.addLayer(layer.current);
    else group.getLayers().push(layer.current);
    setLoaded(true);

    return () => {
      if (!layer.current) return;
      if (!group) mainMap.removeLayer(layer.current);
      else group.getLayers().remove(layer.current);
    };
  }, [mainMap]);

  // Toggle layer visibility
  useEffect(() => {
    layer.current.setVisible(checked.includes(config.id));
  }, [checked]);

  // Validate children prop
  if (!config.children) return null;
  if (!loaded) return null;

  // Render children layers
  const children = config.children.map(id => layers.find(c => c.id === id)).filter(c => !!c);
  children.reverse();
  return children.map((c, i) => {

    // Render component layer
    return (
      <MorphLayer
        key={c.id + i}
        config={c}
        layers={layers}
        group={layer.current}
        checked={checked}
        viewer={viewer}
      />
    )
    
  });
};

export default GroupLayer;