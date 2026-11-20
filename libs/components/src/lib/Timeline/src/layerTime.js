import { iso, parseDimension } from './time';

export function updateLayerTime(layer, value, name = 'time') {
  const source = layer.getSource?.();
  if (source?.updateDimensions) {
    const key = Object.keys(source.getDimensions()).find(key => key.toLowerCase() === name.toLowerCase()) || name;
    source.updateDimensions({ [key]: value });
  } else if (source?.updateParams) {
    source.updateParams({ [name.toLowerCase() === 'time' ? 'TIME' : `DIM_${name}`]: value });
  } else if (source?.setUrls && source?.getUrls) {
    const urls = source.getUrls().map(url => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`([?&])${escaped}=[^&#]*`, 'i');
      const parameter = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
      return pattern.test(url) ? url.replace(pattern, (_, separator) => separator + parameter)
        : url + (url.includes('?') ? '&' : '?') + parameter;
    });
    source.set('timelineDimensions', { [name]: value });
    source.setUrls(urls);
  }
}

export function applyLayerTime(layer, theme, current, name, hidden) {
  updateLayerTime(layer, iso(current), name);
  const configured = theme.dimensions?.find(d => d.name?.toLowerCase() === name.toLowerCase());
  const extent = parseDimension(configured);
  const outside = extent && (current < extent.min || current > extent.max);
  if (outside) {
    if (!hidden.has(layer)) hidden.set(layer, layer.getOpacity());
    layer.setOpacity(0);
  } else if (hidden.has(layer)) {
    layer.setOpacity(typeof theme.opacity === 'number' ? theme.opacity : hidden.get(layer));
    hidden.delete(layer);
  }
}
