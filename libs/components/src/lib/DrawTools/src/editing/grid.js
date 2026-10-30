import OlFeature from 'ol/Feature';
import OlPolygon from 'ol/geom/Polygon';
import { groundToCoordinates } from './metres';

/** Creates rows x cols square cells of a size in metres around the centre, rotated clockwise by degrees. One Polygon per cell. Calls `onChange(features)`. */
export function createGrid({ map, centre, rows, cols, cellSize, rotation = 0, onChange }) {
  const projection = map.getView().getProjection();
  const originX = -(cols * cellSize) / 2;
  const originY = -(rows * cellSize) / 2;
  const lattice = [];
  for (let row = 0; row <= rows; row += 1) {
    for (let col = 0; col <= cols; col += 1) {
      lattice.push([originX + col * cellSize, originY + row * cellSize]);
    }
  }
  const nodes = groundToCoordinates(projection, centre, lattice, rotation);
  const stride = cols + 1;

  const features = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const a = nodes[row * stride + col];
      const b = nodes[(row + 1) * stride + col];
      const c = nodes[(row + 1) * stride + col + 1];
      const d = nodes[row * stride + col + 1];
      features.push(new OlFeature(new OlPolygon([[a.slice(), b.slice(), c.slice(), d.slice(), a.slice()]])));
    }
  }
  if (onChange) onChange(features);
  return features;
}
