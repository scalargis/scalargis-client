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

    layer.current = new OLTileLayer({
      ...config,
      source
    });
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