import { useContext, useEffect, useRef } from "react";
import OLTileLayer from "ol/layer/Tile"
import OlSourceBingMaps from "ol/source/BingMaps"
import AppContext from "../../../AppContext"

const BingLayer = ({ config, group, checked }) => {

  const { mainMap } = useContext(AppContext);
  const layer = useRef();
  
  useEffect(() => {
    if (!mainMap) return;

    const source = new OlSourceBingMaps({
      key:
        "AuwLFA-O1AcL74VKikVahe1-ERPMta838eby5eIXMswtCKNdsioHUpMrJFyj5c1g",
      imagerySet: "AerialWithLabels"
    })
    layer.current = new OLTileLayer({
      ...config,
      source
    });

    if (!group) mainMap.addLayer(layer.current);
    else {
      const collection = group.getLayers();
      collection.push(layer.current);
      group.setLayers(collection);
    }

    return () => {
      group.getLayers().remove(layer.current);
    };

  }, [mainMap]);

  // Toggle layer visibility
  useEffect(() => {
    console.log('changed checked', checked, config.id, checked.includes(config.id));
    layer.current.setVisible(checked.includes(config.id))
  }, [checked]);

  return null;
};

export default BingLayer;