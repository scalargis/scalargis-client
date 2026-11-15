import OlInteractionSnap from 'ol/interaction/Snap';
import OlSource from 'ol/source/Vector';
import OlLayerGroup from 'ol/layer/Group';
import OlLineString from 'ol/geom/LineString';
import OlStyle from 'ol/style/Style';
import OlStroke from 'ol/style/Stroke';
import { buffer as olExtentBuffer, getHeight, getWidth } from 'ol/extent';
import SnapGuides from 'ol-ext/interaction/SnapGuides';

/** Clips the segment a-b to the extent, or returns null. */
const clipSegment = ([x0, y0], [x1, y1], [minX, minY, maxX, maxY]) => {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const p = [-dx, dx, -dy, dy];
  const q = [x0 - minX, maxX - x0, y0 - minY, maxY - y0];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) {
        if (r > t1) return null;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return null;
        if (r < t1) t1 = r;
      }
    }
  }
  return [[x0 + t0 * dx, y0 + t0 * dy], [x0 + t1 * dx, y0 + t1 * dy]];
};

/** Dashed guide style that draws only the part of each guide near the view. */
const guideStyle = (map) => new OlStyle({
  stroke: new OlStroke({ color: '#ffcc33', lineDash: [8, 5], width: 1.25 }),
  geometry: (feature) => {
    const size = map.getSize();
    if (!size) return undefined;
    const view = map.getView().calculateExtent(size);
    const extent = olExtentBuffer(view, Math.max(getWidth(view), getHeight(view)));
    const coords = feature.getGeometry().getCoordinates();
    if (!coords[0] || !coords[1]) return undefined;
    const clipped = clipSegment(coords[0], coords[coords.length - 1], extent);
    return clipped ? new OlLineString(clipped) : undefined;
  }
});

const collectSources = (group, drawingsSource, found) => {
  group.getLayers().forEach((layer) => {
    if (!layer.getVisible()) return;
    if (layer instanceof OlLayerGroup) {
      collectSources(layer, drawingsSource, found);
      return;
    }
    const source = layer.getSource && layer.getSource();
    if (source instanceof OlSource && !found.includes(source)) found.push(source);
  });
  if (drawingsSource && !found.includes(drawingsSource)) found.push(drawingsSource);
  return found;
};

/** Snap to the drawings and to the visible vector layers. `refresh({ draw })` puts the interactions after the active one. */
export function createSnap({ map, getDrawingsSource, pixelTolerance = 10 }) {
  let enabled = false;
  let interactions = [];

  const clear = () => {
    interactions.forEach(i => map.removeInteraction(i));
    interactions = [];
  };

  const refresh = ({ draw = null } = {}) => {
    clear();
    if (!enabled) return;
    if (draw) {
      const guides = new SnapGuides({ pixelTolerance, style: guideStyle(map) });
      map.addInteraction(guides);
      guides.setDrawInteraction(draw);
      interactions.push(guides);
    }
    const sources = collectSources(map.getLayerGroup(), getDrawingsSource(), []);
    sources.forEach((source) => {
      const snap = new OlInteractionSnap({ source, pixelTolerance });
      map.addInteraction(snap);
      interactions.push(snap);
    });
  };

  return {
    isEnabled: () => enabled,
    setEnabled(value) {
      enabled = !!value;
    },
    refresh,
    dispose: clear
  };
}
