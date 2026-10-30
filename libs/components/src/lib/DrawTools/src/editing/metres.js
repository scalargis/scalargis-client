import { getPointResolution, transform } from 'ol/proj';

const WGS84_A = 6378137;
const WGS84_E2 = 0.00669437999014;
const RAD = Math.PI / 180;

/** Returns the ground metres of one view unit at a coordinate. */
export function metresPerUnit(projection, coordinate) {
  return getPointResolution(projection, 1, coordinate, 'm');
}

/** Converts metres to view units at a coordinate. */
export function metresToUnits(projection, coordinate, metres) {
  return metres / metresPerUnit(projection, coordinate);
}

/** Converts view units to metres at a coordinate. */
export function unitsToMetres(projection, coordinate, units) {
  return units * metresPerUnit(projection, coordinate);
}

/** Converts [east, north] ground offsets in metres around a centre to view coordinates on the WGS84 ellipsoid. The offsets turn clockwise by the rotation in degrees. */
export function groundToCoordinates(projection, centre, offsets, rotationDegrees = 0) {
  const [lon0, lat0] = transform(centre, projection, 'EPSG:4326');
  const phi0 = lat0 * RAD;
  const angle = rotationDegrees * RAD;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const w0 = Math.sqrt(1 - WGS84_E2 * Math.sin(phi0) ** 2);
  const meridianRadius = (WGS84_A * (1 - WGS84_E2)) / w0 ** 3;
  return offsets.map(([x, y]) => {
    const east = x * cos + y * sin;
    const north = -x * sin + y * cos;
    const phi = phi0 + north / meridianRadius;
    const phiMid = phi0 + north / (2 * meridianRadius);
    const wMid = Math.sqrt(1 - WGS84_E2 * Math.sin(phiMid) ** 2);
    const lon = lon0 + east / ((WGS84_A / wMid) * Math.cos(phiMid) * RAD);
    return transform([lon, phi / RAD], 'EPSG:4326', projection);
  });
}
