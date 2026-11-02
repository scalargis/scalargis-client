import { useContext, useEffect, useRef } from "react";
import OLVectorLayer from "ol/layer/Vector";
import AppContext from "../../../AppContext";
import VectorSource from "ol/source/Vector";
import OlCollection from "ol/Collection";
import OlFormatGeoJSON from "ol/format/GeoJSON";
import { getUid } from "ol/util";
import * as utils from '../../utils';

const STATE_KEYS = ['draw_geom', 'draw_symbol', 'draw_text', 'fill', 'stroke', 'size', 'symbol_type', 'text_style', 'text_size', 'text_font', 'text_value', 'line_style'];

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

/** Sorts features by drawing index, first = bottom. A feature with no index draws under the drawings. */
const drawingOrder = (orderRef) => (a, b) => {
  const order = orderRef.current;
  const ia = order.has(a.getId()) ? order.get(a.getId()) : -1;
  const ib = order.has(b.getId()) ? order.get(b.getId()) : -1;
  return ia - ib || parseInt(getUid(a), 10) - parseInt(getUid(b), 10);
};

const VectorLayer = ({ config, source, style, group, checked, viewer }) => {

  const { mainMap } = useContext(AppContext);
  const layer = useRef()
  const orderRef = useRef(new Map());

  useEffect(() => {
    if (!mainMap) return;

    // TODO: load source and style
    layer.current = new OLVectorLayer({
      ...config,
      source: new VectorSource({ features: new OlCollection(), attributions: config.attributions || [] }),
      ...(config.id === 'userlayer' ? { renderOrder: drawingOrder(orderRef) } : {})
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
      const previous = orderRef.current;
      const reordered = previous.size !== drawings.length || drawings.some((d, i) => previous.get(d.id) !== i);
      if (reordered) {
        orderRef.current = new Map(drawings.map((d, i) => [d.id, i]));
        ollayer.changed();
      }
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