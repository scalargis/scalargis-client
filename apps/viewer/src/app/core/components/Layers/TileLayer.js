import { useContext, useEffect, useRef } from "react";
import OLTileLayer from "ol/layer/Tile";
import AppContext from "../../../AppContext";

const TileLayer = ({ config, source, group, checked }) => {

  const { mainMap } = useContext(AppContext);
  const layer = useRef();
  
  useEffect(() => {
    if (!mainMap) return;

    if (config.attributions) {
      source.setAttributions(config.attributions);
    }

    const new_layer = new OLTileLayer({
      ...config,
      source
    });

    if (new_layer && config.min_resolution) {
      new_layer.setMinResolution(config.min_resolution);
    }
    if (new_layer && config.max_resolution) {
      new_layer.setMaxResolution(config.max_resolution);
    }
    if (new_layer && config.min_scale) {
      const res = getResolutionForScale(config.min_scale, mainMap.getView().getProjection().getUnits());
      new_layer.setMinResolution(res);
    }    
    if (new_layer && config.max_scale) {
      const res = getResolutionForScale(config.max_scale, mainMap.getView().getProjection().getUnits());
      new_layer.setMaxResolution(res);
    }

    layer.current = new_layer; 
    group.getLayers().push(layer.current);

    return () => {
      group.getLayers().remove(layer.current);
    };

  }, [mainMap]);

  // Toggle layer visibility
  useEffect(() => {
    layer.current.setVisible(checked.includes(config.id))
  }, [checked]);

  // Changed config
  useEffect(() => {
    layer.current.setOpacity(config.opacity);
  }, [config]);  

  return null;
};

export default TileLayer;