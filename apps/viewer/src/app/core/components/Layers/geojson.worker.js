import OlFormatGeoJSON from 'ol/format/GeoJSON';

const format = new OlFormatGeoJSON();

/** Packs an OL geometry into flat typed arrays that a postMessage can transfer. */
function packGeometry(geom, transfer) {
  if (!geom) return null;
  const type = geom.getType();
  if (type === 'GeometryCollection') {
    return { type, geometries: geom.getGeometriesArray().map(g => packGeometry(g, transfer)) };
  }
  const flat = Float64Array.from(geom.getFlatCoordinates());
  transfer.push(flat.buffer);
  const packed = { type, layout: geom.getLayout(), flat };
  if (type === 'Polygon' || type === 'MultiLineString') packed.ends = geom.getEnds();
  if (type === 'MultiPolygon') packed.endss = geom.getEndss();
  return packed;
}

globalThis.onmessage = async ({ data: { id, url } }) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const text = await res.text();
    const transfer = [];
    const features = format.readFeatures(text).map(f => {
      const props = f.getProperties();
      delete props[f.getGeometryName()];
      return { id: f.getId(), props, geom: packGeometry(f.getGeometry(), transfer) };
    });
    globalThis.postMessage({ id, features }, transfer);
  } catch (error) {
    globalThis.postMessage({ id, error: String(error?.message || error) });
  }
};
