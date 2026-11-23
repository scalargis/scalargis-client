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
