const OFFSET_PIXELS = 20;

/** Adds a clone of each feature to the source, moved by a screen offset. A clone has no id. Calls `onChange(clones)`. */
export function duplicateFeatures({ map, source, features, onChange }) {
  const resolution = map.getView().getResolution();
  const delta = OFFSET_PIXELS * resolution;
  const clones = features.map(feature => {
    const clone = feature.clone();
    clone.setId(undefined);
    clone.unset('id');
    clone.getGeometry().translate(delta, -delta);
    return clone;
  });
  if (!clones.length) return clones;
  source.addFeatures(clones);
  if (onChange) onChange(clones);
  return clones;
}
