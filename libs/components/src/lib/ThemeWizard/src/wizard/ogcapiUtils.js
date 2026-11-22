/**
 * Utilitários puros para trabalhar com serviços OGC API.
 * Sem dependências de React, o que facilita os testes unitários.
 */

export const REL = {
  maps: ['http://www.opengis.net/def/rel/ogc/1.0/map'],
  mapTiles: ['http://www.opengis.net/def/rel/ogc/1.0/tilesets-map'],
  vectorTiles: ['http://www.opengis.net/def/rel/ogc/1.0/tilesets-vector'],
  features: ['items'],
};

/** Reduz o URL colado à base do serviço (sem /collections, query ou hash). */
export function serviceBase(raw) {
  let u = (raw || '').trim();
  if (!u) return '';
  u = u.split('?')[0].split('#')[0];
  u = u.replace(/\/+$/, '');
  u = u.replace(/\/collections$/i, '');
  return u;
}

/** Resolve um href (absoluto ou relativo) contra um URL base. Devolve null se for inválido. */
export function resolveHref(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

/** Indica se um link de uma coleção corresponde ao tipo de API pedido. */
export function matchesType(link, rels, type, collection) {
  if (!link?.rel || !link?.href || !rels.includes(link.rel)) return false;

  if (type === 'features') {
    // Exclui coleções de outros tipos que também usam rel="items" (ex.: Records)
    if (collection?.itemType && collection.itemType !== 'feature') return false;
    // Se o link declarar type, tem de ser GeoJSON/JSON
    if (link.type && !/json/i.test(link.type)) return false;
  }

  if (type === 'vectorTiles' && link.type && /html/i.test(link.type)) {
    return false;
  }

  return true;
}

/** Devolve apenas as coleções com links do tipo pedido, com hrefs absolutos. */
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

/** Conta as coleções de registos (Records), ainda não suportadas. */
export function countRecordCollections(collections) {
  return (collections || []).filter((c) => c.itemType === 'record').length;
}