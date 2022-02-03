export const SEARCHLAYERS_SET_LAYER = 'SEARCHLAYERS_SET_LAYER';

export function searchlayers_set_layer(control, layer) {
  const action = {
    type: SEARCHLAYERS_SET_LAYER,
    control,
    layer
  }
  return action;
}

export default {
  SEARCHLAYERS_SET_LAYER,  
  searchlayers_set_layer
}

