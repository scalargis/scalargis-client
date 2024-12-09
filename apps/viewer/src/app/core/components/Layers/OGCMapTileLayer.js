import { useContext, useEffect, useRef } from "react";
import OLTileLayer from "ol/layer/Tile";
import OlSourceOGCMapTile from "ol/source/OGCMapTile";
import AppContext from "../../../AppContext";

const OGCMapTileLayer = ({ config, source, group, checked }) => {

  const { mainMap } = useContext(AppContext);
  const layer = useRef();
  
  useEffect(() => {
    if (!mainMap) return;

    if (config.attributions) {
      source.setAttributions(config.attributions);
    }

    const options = { url: config.url };
    if (config.projection) options.projection = config.projection;
    if (config.mediaType) options.mediaType = config.mediaType;

    layer.current = new OLTileLayer({
      ...config,
      source: source ? source : new OlSourceOGCMapTile(options)
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

export default OGCMapTileLayer;