/** Names of the core tools that can hold the map clicks in `viewer.exclusive_mapcontrol`. */
export const MAP_TOOLS = Object.freeze({
  COORDINATES: 'Coordinates',
  FEATURE_INFO: 'FeatureInfo',
  MAP_TOOLS: 'MapTools',
  DRAW_TOOLS: 'DrawTools',
  PRINT: 'Print',
  INTERSECT_LAYERS: 'IntersectLayers',
  STREET_VIEW: 'StreetView'
});

/** Gives the action that turns the named tool off by hand: off for the start tool, back to the start tool for any other. */
export function mapToolOff(actions, viewer, name) {
  if (viewer?.exclusive_mapcontrol === name && viewer?.default_mapcontrol === name) {
    return actions.viewer_set_exclusive_mapcontrol(null);
  }
  return actions.viewer_release_exclusive_mapcontrol(name);
}

/** Gives the id of the first component record of a viewer that has the type, or null. */
export function findComponentId(viewer, type) {
  return (viewer?.config_json?.components || []).find(c => c.type === type)?.id || null;
}
