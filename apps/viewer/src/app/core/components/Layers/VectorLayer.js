import { useContext, useEffect, useRef } from "react";
import OLVectorLayer from "ol/layer/Vector";
import AppContext from "../../../AppContext";
import VectorSource from "ol/source/Vector";
import OlCollection from "ol/Collection";
import OlFormatGeoJSON from "ol/format/GeoJSON";
import * as utils from '../../utils';

const STATE_KEYS = ['draw_geom', 'draw_symbol', 'draw_text', 'fill', 'stroke', 'size', 'symbol_type', 'text_style', 'text_size', 'text_font', 'text_value'];

const normalizeState = (state) => JSON.stringify(STATE_KEYS.map(k => {
  const v = state ? state[k] : undefined;
  if (v && typeof v === 'object') return ['r', 'g', 'b', 'a'].map(c => String(v[c]));
  return v === undefined || v === null ? '' : String(v);
}));

/** True when the feature has the geometry and the state of the drawing. */
const featureMatchesDrawing = (feature, drawing, crs, writer) => {
  const geometry = feature.getGeometry();
  if (!geometry || !drawing.geometry) return false;
  const written = writer.writeGeometryObject(geometry, { dataProjection: crs, featureProjection: crs, decimals: 6 });
  if (written.type !== drawing.geometry.type) return false;
  if (JSON.stringify(written.coordinates) !== JSON.stringify(drawing.geometry.coordinates)) return false;
  return normalizeState(feature.get('state')) === normalizeState(drawing.properties && drawing.properties.state);
};

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
      const writer = new OlFormatGeoJSON();
      drawings.forEach(d => {
        const exists = ollayer.getSource().getFeatureById(d.id);
        if (exists && featureMatchesDrawing(exists, d, crs, writer)) return;
        if (exists) ollayer.getSource().removeFeature(exists);
        ollayer.getSource().addFeature(utils.deserializeDrawing(d, crs));
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