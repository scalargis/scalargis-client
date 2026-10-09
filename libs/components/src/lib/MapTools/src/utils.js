export const MAPCONTROL_NAME = "MapTools";

/** Gives a length in metres as text: km with 2 decimals from 1 km, m with 2 decimals below. */
export function defaultLengthText(length) {
  if (length >= 1000) return (Math.round(length / 10) / 100).toFixed(2) + ' km';
  return (Math.round(length * 100) / 100).toFixed(2) + ' m';
}
