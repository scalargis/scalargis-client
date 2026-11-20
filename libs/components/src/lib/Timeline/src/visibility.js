export const SET_TIMELINE_VISIBILITY = 'TIMELINE_SET_WIDGET_VISIBLE';
export function timelineVisible(viewer, record) {
  return viewer.timelineVisibility?.[record.id] ?? (record.config_json?.defaultVisible !== false);
}
export function setTimelineVisible(id, visible) {
  return { type: SET_TIMELINE_VISIBILITY, id, visible };
}
