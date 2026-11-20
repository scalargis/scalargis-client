import { describe, expect, it, vi } from 'vitest';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { applyLayerTime } from './layerTime';
import { clampDate, initialNow, initialDate, iso, parseDimension, selectDate, stepDate, timestamp, unionDimensions } from './time';

const current = timestamp('2026-11-14T21:30:00Z');
const dimension = unionDimensions([
  parseDimension({ values: '2026-11-01/2026-11-14T21:30:00Z/PT10M' }),
  parseDimension({ values: '2026-11-14/2026-11-20/P1D', nearestValue: false }),
]);

describe('Timeline regressions with daily forecast coverage', () => {
  it('honours minute/hour steps beyond the end of intraday observations', () => {
    expect(iso(stepDate(current, dimension, 'PT10M', 1))).toBe('2026-11-14T21:40:00Z');
    expect(iso(stepDate(current, dimension, 'PT1H', 1))).toBe('2026-11-14T22:30:00Z');
    expect(stepDate(current + 600000, dimension, 'PT10M', -1)).toBe(current);
    expect(stepDate(dimension.max - 300000, dimension, 'PT10M', 1)).toBe(dimension.max);
    expect(stepDate(dimension.min, dimension, 'PT1H', -1)).toBe(dimension.min);
    expect(selectDate(current + 600000, dimension, 'PT10M')).toBe(current + 600000);
    expect(clampDate(current + 600000, dimension)).toBe(current + 600000);
  });
  it('initialises now using the selected step even with only daily capabilities', () => {
    vi.spyOn(Date, 'now').mockReturnValue(current);
    try {
      expect(initialDate(parseDimension({ values: '2026-11-14/2026-11-20/P1D' }), { selectedIndex: 'now' }, 'PT10M')).toBe(current);
    } finally { vi.restoreAllMocks(); }
  });
  it('applies TIME to a newly created WMS source without hiding discovered coverage', () => {
    const layer = new TileLayer({ source: new TileWMS({ url: 'https://example.test/wms', params: { LAYERS: 'MODIS' } }), opacity: 0.7 });
    applyLayerTime(layer, {}, current, 'time', new Map());
    expect(layer.getSource().getParams().TIME).toBe('2026-11-14T21:30:00Z');
    expect(layer.getOpacity()).toBe(0.7);
  });
  it('always sends TIME even when explicit coverage hides a layer, then restores opacity', () => {
    const layer = new TileLayer({ source: new TileWMS({ params: { LAYERS: 'forecast' } }), opacity: 0.6 });
    const hidden = new Map();
    const theme = { dimensions: [{ name: 'time', values: '2026-11-01/2026-11-14/P1D' }] };
    applyLayerTime(layer, theme, current, 'time', hidden);
    expect(layer.getSource().getParams().TIME).toBe('2026-11-14T21:30:00Z');
    expect(layer.getOpacity()).toBe(0);
    applyLayerTime(layer, theme, timestamp('2026-11-13'), 'time', hidden);
    expect(layer.getSource().getParams().TIME).toBe('2026-11-13T00:00:00Z');
    expect(layer.getOpacity()).toBe(0.6);
    expect(hidden.size).toBe(0);
  });
});

it('aligns automatic now after bounding by the latest available time', () => {
  const dim = parseDimension({ values: '2026-11-14T00:05:00Z/2026-11-14T21:35:00Z/PT10M' });
  const now = timestamp('2026-11-14T21:43:00Z');
  expect(iso(initialNow(dim, 'PT10M', now))).toBe('2026-11-14T21:30:00Z');
  expect(iso(initialNow(dim, 'PT1H', now))).toBe('2026-11-14T21:00:00Z');
  expect(iso(initialNow({ ...dim, min: timestamp('2026-11-14') }, 'P1D', now))).toBe('2026-11-14T00:00:00Z');
  expect(iso(initialNow(dim, 'PT10M', timestamp('2026-11-14T20:47Z')))).toBe('2026-11-14T20:40:00Z');
  expect(iso(clampDate(timestamp('2026-11-14T21:25Z'), dim))).toBe('2026-11-14T21:25:00Z');
  const narrow = { ...dim, min: timestamp('2026-11-14T21:31Z') };
  expect(initialNow(narrow, 'PT10M', now)).toBe(narrow.min);
});
