const children = (node, name) => Array.from(node.children).filter(child => child.localName === name);
const text = (node, name) => children(node, name)[0]?.textContent.trim();

export function readTimeDimension(xml, theme, name = 'time') {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.getElementsByTagName('parsererror').length) throw new Error('Invalid capabilities XML');
  const wmts = String(theme.type).toUpperCase() === 'WMTS';
  const layerName = wmts ? theme.layer || theme.layers : String(theme.layers || theme.layer || '').split(',')[0].trim();
  const layers = Array.from(document.getElementsByTagNameNS('*', 'Layer'));
  let layer = layers.find(node => text(node, wmts ? 'Identifier' : 'Name') === layerName);
  while (layer?.localName === 'Layer') {
    const dimension = children(layer, 'Dimension').find(node => (wmts ? text(node, 'Identifier') : node.getAttribute('name'))?.toLowerCase() === name.toLowerCase());
    if (wmts) {
      if (!dimension) return null;
      const values = children(dimension, 'Value').map(node => node.textContent.trim()).filter(Boolean).join(',');
      return values ? { name: text(dimension, 'Identifier'), values, nearestValue: false } : null;
    }
    const extent = children(layer, 'Extent').find(node => node.getAttribute('name')?.toLowerCase() === name.toLowerCase());
    const valueNode = extent?.textContent.trim() ? extent : dimension;
    if (valueNode?.textContent.trim()) {
      return {
        name: dimension?.getAttribute('name') || extent.getAttribute('name'),
        values: valueNode.textContent.trim(),
        nearestValue: (valueNode.getAttribute('nearestValue') || dimension?.getAttribute('nearestValue') || '0') === '1',
      };
    }
    layer = layer.parentElement;
  }
  return null;
}

export function capabilitiesUrl(theme, core, viewer, utils) {
  const url = new URL(theme.url, window.location.href);
  for (const key of [...url.searchParams.keys()]) {
    if (['request', 'service', 'version'].includes(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.set('SERVICE', String(theme.type).toUpperCase() === 'WMTS' ? 'WMTS' : 'WMS');
  url.searchParams.set('REQUEST', 'GetCapabilities');
  if (theme.version) url.searchParams.set('VERSION', theme.version);
  const auth = core.getLoggedUser?.();
  if (utils.isUrlAppHostname(url.href) && viewer.integrated_authentication && auth?.auth_token) {
    url.searchParams.set(viewer.integrated_authentication_key || 'authkey', auth.auth_token);
  }
  return utils.isUrlAppOrigin(url.href) ? url.href : core.MAP_PROXY_URL + encodeURIComponent(url.href);
}
