import OlFeature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import MultiPoint from 'ol/geom/MultiPoint';
import MultiLineString from 'ol/geom/MultiLineString';
import MultiPolygon from 'ol/geom/MultiPolygon';
import GeometryCollection from 'ol/geom/GeometryCollection';
import { get as getProjection, equivalent } from 'ol/proj';

let worker = null;
let nextId = 0;
const pending = new Map();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./geojson.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = ({ data }) => {
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if (data.error) request.reject(new Error(data.error));
    else request.resolve(data.features);
  };
  return worker;
}

function unpackGeometry(g) {
  if (!g) return undefined;
  switch (g.type) {
    case 'Point': return new Point(Array.from(g.flat), g.layout);
    case 'LineString': return new LineString(Array.from(g.flat), g.layout);
    case 'Polygon': return new Polygon(Array.from(g.flat), g.layout, g.ends);
    case 'MultiPoint': return new MultiPoint(Array.from(g.flat), g.layout);
    case 'MultiLineString': return new MultiLineString(Array.from(g.flat), g.layout, g.ends);
    case 'MultiPolygon': return new MultiPolygon(Array.from(g.flat), g.layout, g.endss);
    case 'GeometryCollection': return new GeometryCollection(g.geometries.map(unpackGeometry).filter(Boolean));
    default: return undefined;
  }
}

/** Fetches and parses a GeoJSON url in a Web Worker. Resolves to OL features in the feature projection. */
export function readGeoJSONInWorker(url, dataProjection, featureProjection) {
  const absoluteUrl = new URL(url, window.location.href).href;
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, url: absoluteUrl });
  }).then(packed => {
    const source = getProjection(dataProjection);
    const target = getProjection(featureProjection);
    const reproject = source && target && !equivalent(source, target);
    return packed.map(p => {
      const feature = new OlFeature(p.props);
      const geom = unpackGeometry(p.geom);
      if (geom) {
        if (reproject) geom.transform(source, target);
        feature.setGeometry(geom);
      }
      if (p.id !== undefined) feature.setId(p.id);
      return feature;
    });
  });
}
