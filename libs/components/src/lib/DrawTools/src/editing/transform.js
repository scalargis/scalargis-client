import OlInteractionTransform from 'ol-ext/interaction/Transform';

const END_EVENTS = ['rotateend', 'scaleend', 'translateend'];

/** Creates an inactive Transform interaction on the map. Each finished rotate, scale or move calls `onChange(features)`. */
export function createTransform({ map, source, onChange, onSelect, onStart }) {
  const interaction = new OlInteractionTransform({
    filter: (feature) => source.hasFeature(feature),
    hitTolerance: 5,
    translateFeature: true,
    stretch: false,
    keepAspectRatio: () => true
  });
  interaction.setActive(false);
  map.addInteraction(interaction);

  let current = [];

  const isMoveOnly = (features) => features.some(f => f.getGeometry().getType() === 'Point');

  interaction.on('select', (e) => {
    const features = e.features.getArray().slice();
    current = features;
    const moveOnly = isMoveOnly(features);
    interaction.set('rotate', !moveOnly);
    interaction.set('scale', !moveOnly);
    if (onSelect) onSelect(features);
  });

  interaction.on(['rotatestart', 'scalestart', 'translatestart'], () => {
    if (onStart) onStart();
  });

  interaction.on(END_EVENTS, (e) => {
    if (e.transformed && onChange) onChange(e.features.getArray().slice());
  });

  return {
    interaction,
    getSelection: () => current.slice(),
    setActive(active) {
      if (!active) {
        interaction.select(null);
        current = [];
      }
      interaction.setActive(active);
    },
    selectFeatures(features) {
      interaction.select(null);
      features.forEach(f => interaction.select(f, true));
    },
    clear() {
      interaction.select(null);
      current = [];
      if (onSelect) onSelect([]);
    },
    dispose() {
      interaction.select(null);
      map.removeInteraction(interaction);
    }
  };
}
