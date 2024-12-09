import { useContext, useEffect, useRef } from "react";
import OlFormatMVT from 'ol/format/MVT';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlVectorTileLayer from 'ol/layer/VectorTile';
import OlSourceOGCVectorTile from 'ol/source/OGCVectorTile.js';
import AppContext from "../../../AppContext";

const OGCVectorTileLayer = ({ config, source, group, checked }) => {

  const { mainMap } = useContext(AppContext);
  const layer = useRef();
  
  useEffect(() => {
    if (!mainMap) return;

    if (config.attributions) {
      source.setAttributions(config.attributions);
    }

    const options = { url: config.url };

    let format = new OlFormatMVT();
    if (config.mediaType === "application/geo+json") format = new OlFormatGeoJSON();

    options.format = format;
    if (config.mediaType) options.mediaType = config.mediaType;

    layer.current = new OlVectorTileLayer({
      ...config,
      source: source ? source : new OlSourceOGCVectorTile(options)
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

export default OGCVectorTileLayer;