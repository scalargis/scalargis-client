export const MAPTOOLS_SET_SELECTEDCONTROL = 'MAPTOOLS_SET_SELECTEDCONTROL';

export function maptools_set_selectedcontrol(selected_control) {
  const action = {
    type: MAPTOOLS_SET_SELECTEDCONTROL,
    selected_control
  }
  return action;
}

export default {
  MAPTOOLS_SET_SELECTEDCONTROL,
  maptools_set_selectedcontrol
}