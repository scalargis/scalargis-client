export const REL = {
  maps: ['http://www.opengis.net/def/rel/ogc/1.0/map'],
  mapTiles: ['http://www.opengis.net/def/rel/ogc/1.0/tilesets-map'],
  vectorTiles: ['http://www.opengis.net/def/rel/ogc/1.0/tilesets-vector'],
  features: ['items'],
};

/** Reduces a pasted URL to the service base, with no /collections, query, or hash. */
export function serviceBase(raw) {
  let u = (raw || '').trim();
  if (!u) return '';
  u = u.split('?')[0].split('#')[0];
  u = u.replace(/\/+$/, '');
  u = u.replace(/\/collections$/i, '');
  return u;
}

/** Resolves an absolute or relative href against a base URL, or returns null. */
export function resolveHref(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

/** True when a collection link matches the requested API type. */
export function matchesType(link, rels, type, collection) {
  if (!link?.rel || !link?.href || !rels.includes(link.rel)) return false;

  if (type === 'features') {
    if (collection?.itemType && collection.itemType !== 'feature') return false;
    if (link.type && !/json/i.test(link.type)) return false;
  }

  if (type === 'vectorTiles' && link.type && /html/i.test(link.type)) {
    return false;
  }

  return true;
}

/** Returns only the collections with links of the requested type, with absolute hrefs. */
export function filterCollectionsByType(collections, type, base) {
  const rels = REL[type] || [];
  const resolveBase = `${base}/collections`;
  const result = [];

  for (const collection of collections || []) {
    const links = (collection.links || [])
      .filter((link) => matchesType(link, rels, type, collection))
      .map((link) => ({ ...link, href: resolveHref(link.href, resolveBase) }))
      .filter((link) => link.href);

    if (links.length) result.push({ ...collection, links });
  }

  return result;
}

/** Returns the limit maximum and default of the items paths of an OpenAPI document, for each collection and for the path template. */
export function itemsLimitOf(doc) {
  const resolve = (p) => {
    if (!p?.$ref) return p;
    const parts = p.$ref.replace(/^#\//, '').split('/');
    return parts.reduce((o, k) => (o ? o[k] : undefined), doc);
  };
  const numberIn = (schema, key) => {
    if (!schema) return undefined;
    if (typeof schema[key] === 'number') return schema[key];
    for (const sub of [...(schema.anyOf || []), ...(schema.oneOf || []), ...(schema.allOf || [])]) {
      const n = numberIn(sub, key);
      if (typeof n === 'number') return n;
    }
    return undefined;
  };
  const result = { max: undefined, def: undefined, byCollection: {} };
  Object.keys(doc?.paths || {}).forEach((path) => {
    const m = path.match(/\/collections\/([^/]+)\/items$/);
    if (!m) return;
    const entry = doc.paths[path];
    const params = [...(entry.parameters || []), ...(entry.get?.parameters || [])].map(resolve);
    const limit = params.find((p) => p?.name === 'limit' && p?.in === 'query');
    if (!limit) return;
    const schema = resolve(limit.schema);
    const facts = { max: numberIn(schema, 'maximum'), def: numberIn(schema, 'default') };
    if (/^\{.*\}$/.test(m[1])) {
      result.max = facts.max;
      result.def = facts.def;
    } else {
      result.byCollection[decodeURIComponent(m[1])] = facts;
    }
  });
  return result;
}
