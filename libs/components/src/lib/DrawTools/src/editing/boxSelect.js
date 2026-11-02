import OlInteractionDragBox from 'ol/interaction/DragBox';
import { platformModifierKey } from 'ol/events/condition';

const condition = (event) => platformModifierKey(event);

const addCondition = (event) => event.originalEvent.shiftKey;

const parts = (coordinates, depth) => (depth === 0 ? [coordinates] : coordinates.flatMap((item) => parts(item, depth - 1)));

const DEPTH = { Point: -1, MultiPoint: 0, LineString: 0, MultiLineString: 1, Polygon: 1, MultiPolygon: 2 };

const lineParts = (geometry) => {
  const depth = DEPTH[geometry.getType()];
  if (depth === undefined || depth < 0) return [];
  return parts(geometry.getCoordinates(), depth);
};

const vertices = (geometry) => (geometry.getType() === 'Point' ? [geometry.getCoordinates()] : lineParts(geometry).flat());

const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

const segmentsCross = (a, b, c, d) => orient(a, b, c) * orient(a, b, d) <= 0 && orient(c, d, a) * orient(c, d, b) <= 0;

const edgesOf = (coords, closed) => {
  const edges = [];
  for (let i = 0; i < coords.length - 1; i += 1) edges.push([coords[i], coords[i + 1]]);
  if (closed && coords.length > 2) edges.push([coords[coords.length - 1], coords[0]]);
  return edges;
};

/** True when the geometry touches the polygon of the box. */
export function touchesBox(geometry, box) {
  if (!geometry || !box.intersectsExtent(geometry.getExtent())) return false;
  const type = geometry.getType();
  if (!(type in DEPTH)) return true;
  if (vertices(geometry).some((coordinate) => box.intersectsCoordinate(coordinate))) return true;
  if (type === 'Point' || type === 'MultiPoint') return false;
  const ring = box.getCoordinates()[0];
  const boxEdges = edgesOf(ring, false);
  const closed = type === 'Polygon' || type === 'MultiPolygon';
  const crosses = lineParts(geometry).some((line) => edgesOf(line, closed).some(([a, b]) => boxEdges.some(([c, d]) => segmentsCross(a, b, c, d))));
  if (crosses) return true;
  return closed && ring.slice(0, 4).some((coordinate) => geometry.intersectsCoordinate(coordinate));
}

/** Creates a Ctrl and drag box on the map. On box end it calls `onBox(features, add)` with the drawings that touch the box. `add` is true when Shift is down. */
export function createBoxSelect({ map, getSource, onBox }) {
  const interaction = new OlInteractionDragBox({ condition, className: 'drawtools-dragbox', minArea: 25 });
  let active = false;

  interaction.on('boxend', (e) => {
    const source = getSource();
    if (!source) return;
    const box = interaction.getGeometry();
    const features = source.getFeatures().filter((feature) => touchesBox(feature.getGeometry(), box));
    onBox(features, addCondition(e.mapBrowserEvent));
  });

  return {
    interaction,
    setActive(next) {
      if (active) map.removeInteraction(interaction);
      active = next;
      if (active) map.addInteraction(interaction);
    },
    dispose() {
      if (active) map.removeInteraction(interaction);
      active = false;
    }
  };
}
