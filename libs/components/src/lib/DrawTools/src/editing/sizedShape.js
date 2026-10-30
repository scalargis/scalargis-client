import OlFeature from 'ol/Feature';
import OlPolygon from 'ol/geom/Polygon';
import { groundToCoordinates } from './metres';

/** Returns a closed ring in view units: a rectangle of ground metres around the centre, rotated clockwise by degrees. */
export function rectangleRing(projection, centre, widthMetres, heightMetres, rotationDegrees = 0) {
  const halfW = widthMetres / 2;
  const halfH = heightMetres / 2;
  const corners = [[-halfW, -halfH], [-halfW, halfH], [halfW, halfH], [halfW, -halfH]];
  const ring = groundToCoordinates(projection, centre, corners, rotationDegrees);
  ring.push(ring[0].slice());
  return ring;
}

/** Creates one Polygon feature with a set width and height in metres. Calls `onChange([feature])`. */
export function createSizedShape({ map, centre, width, height, rotation = 0, onChange }) {
  const projection = map.getView().getProjection();
  const ring = rectangleRing(projection, centre, width, height, rotation);
  const feature = new OlFeature(new OlPolygon([ring]));
  if (onChange) onChange([feature]);
  return [feature];
}
