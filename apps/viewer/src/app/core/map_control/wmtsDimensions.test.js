import { expect, it } from 'vitest';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { withWmtsDimensions } from './wmtsDimensions';

it('passes current source dimensions to feature info without duplicate TIME parameters', () => {
  const source = new WMTS({
    url: 'https://example.org/wmts', layer: 'wind', matrixSet: 'grid', style: '',
    tileGrid: new WMTSTileGrid({ origin: [0, 0], resolutions: [1], matrixIds: ['0'] }),
    dimensions: { Time: '2024-01-01', elevation: '10' },
  });
  source.updateDimensions({ Time: '2024-02-01T12:00:00+01:00' });
  const url = new URL(withWmtsDimensions('https://example.org/wmts?TIME=old&REQUEST=GetFeatureInfo', source));
  expect(url.searchParams.get('Time')).toBe('2024-02-01T12:00:00+01:00');
  expect(url.searchParams.has('TIME')).toBe(false);
  expect(url.searchParams.get('elevation')).toBe('10');
  expect(url.searchParams.get('REQUEST')).toBe('GetFeatureInfo');
});
