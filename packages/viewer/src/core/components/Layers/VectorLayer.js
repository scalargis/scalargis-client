import { useContext, useEffect, useRef } from "react";
import OLVectorLayer from "ol/layer/Vector";
import AppContext from "../../../AppContext";
import VectorSource from "ol/source/Vector";
import OlCollection from "ol/Collection";
import * as utils from '../../utils';

const VectorLayer = ({ config, source, style, group, checked, viewer }) => {

  const { mainMap } = useContext(AppContext);
  const layer = useRef()

  useEffect(() => {
    if (!mainMap) return;

    // TODO: load source and style
    layer.current = new OLVectorLayer({
      ...config,
      source: new VectorSource({ features: new OlCollection(), attributions: config.attributions || [] })
      //style
    });

    group.getLayers().push(layer.current);

    return () => {
      group.getLayers().remove(layer.current);
    };
  }, [mainMap]);

  // Update map with user drawings
  const drawings = viewer.config_json.drawings;
  useEffect(() => {
    let ollayer = null;
    if (layer.current && layer.current.get('id') === 'userlayer') ollayer = layer.current;
    if (ollayer) {
      const crs = mainMap.getView().getProjection().getCode();
      ollayer.getSource().forEachFeature(f => {
        if (f.get('state')) {
          const exists = drawings.filter(d => d.id === f.getId());
          if (exists.length === 0) ollayer.getSource().removeFeature(f);
        }  
      });
      drawings.forEach(d => {
        const exists = ollayer.getSource().getFeatureById(d.id);
        if (!exists) {
          const f = utils.deserializeDrawing(d, crs);
          ollayer.getSource().addFeature(f);
        }
      });
    }
    return () => {
      //if (ollayer) ollayer.getSource().clear();
    }
  }, [drawings]);

  // Toggle layer visibility
  useEffect(() => {
    layer.current.setVisible(checked.includes(config.id))
  }, [checked]);

  return null;
};

export default VectorLayer;