import OlInteractionSnap from 'ol/interaction/Snap';
import OlSource from 'ol/source/Vector';
import OlLayerGroup from 'ol/layer/Group';
import SnapGuides from 'ol-ext/interaction/SnapGuides';

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
      const guides = new SnapGuides({ pixelTolerance });
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
