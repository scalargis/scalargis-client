import { describe, expect, it } from 'vitest';
import { addDuration, initialDate, iso, parseDimension, parseDuration, restrictDimension, snapDate, snapStepPeriod, stepDate, timestamp, unionDimensions } from './time';
import { readTimeDimension } from './capabilities';

describe('Timeline navigation', () => {
  it('keeps long hourly archives compact and includes the last playback frame', () => {
    const dimension = parseDimension({ values: '1950-01-01/2026-01-01/PT1H' });
    expect(dimension.ranges).toHaveLength(1);
    expect(dimension.dates).toHaveLength(0);
    expect(stepDate(dimension.max - 3600000, dimension, dimension.step, 1)).toBe(dimension.max);
  });

  it('navigates irregular lists and skips gaps in multi-range dimensions', () => {
    const list = parseDimension({ values: '2024-01-10,2024-01-01,2024-01-04' });
    expect(iso(stepDate(list.min, list, null, 1))).toBe('2024-01-04T00:00:00Z');
    expect(iso(initialDate(list, { selectedIndex: 2 }))).toBe('2024-01-04T00:00:00Z');
    const range = parseDimension({ values: '2024-01-01/2024-01-02/P1D,2024-01-05/2024-01-06/P1D', nearestValue: 0 });
    expect(iso(stepDate(timestamp('2024-01-02'), range, null, 1))).toBe('2024-01-05T00:00:00Z');
    expect(iso(snapDate(timestamp('2024-01-04'), range))).toBe('2024-01-02T00:00:00Z');
  });

  it('uses calendar months and UTC across daylight-saving transitions', () => {
    expect(iso(addDuration(timestamp('2024-01-31'), 'P1M'))).toBe('2024-02-29T00:00:00Z');
    expect(iso(addDuration(timestamp('2024-03-30T12:00:00Z'), 'P1D'))).toBe('2024-03-31T12:00:00Z');
    const dimension = parseDimension({ values: '2024-01-01/2024-12-01/P1M', nearestValue: 0 });
    expect(iso(snapDate(timestamp('2024-03-29'), dimension))).toBe('2024-03-01T00:00:00Z');
    expect(iso(snapStepPeriod(timestamp('2024-01-01T09:40Z'), 'PT3H'))).toBe('2024-01-01T09:00:00Z');
  });

  it('rejects zero and malformed periods without entering an expansion loop', () => {
    expect(parseDuration('P0D')).toBeNull();
    expect(parseDuration('invalidP1D')).toBeNull();
    expect(parseDimension({ values: 'bad/end/P1D,2024-01-01/2024-02-01/P0D' })).toBeNull();
  });

  it('retains legacy interval, steps, delta and one-based selection', () => {
    const dimension = parseDimension({ values: '2024-01-01/2024-01-10/P1D' });
    const restricted = restrictDimension(dimension, { value: '2024-01-02', steps: [5, 2] });
    expect(iso(restricted.min)).toBe('2024-01-01T00:00:00Z');
    expect(iso(restricted.max)).toBe('2024-01-04T00:00:00Z');
    expect(iso(initialDate(restricted, { selectedIndex: 2 }))).toBe('2024-01-02T00:00:00Z');
    expect(restrictDimension(dimension, { interval: ['2025-01-01', '2025-02-01'] })).toBeNull();
    expect(iso(restrictDimension(dimension, { value: '2024-01-05', delta: ['P1D', 'P2D'] }).max)).toBe('2024-01-07T00:00:00Z');
  });

  it('combines range and list bounds without dropping the individual dates', () => {
    const dimension = unionDimensions([
      parseDimension({ values: '2024-01-01/2024-01-02/PT1H' }),
      parseDimension({ values: '2024-01-05,2024-01-07', nearestValue: 0 }),
    ]);
    expect(dimension.nearestValue).toBe(false);
    expect(iso(stepDate(timestamp('2024-01-02'), dimension, 'PT1H', 1))).toBe('2024-01-02T01:00:00Z');
  });
});

describe('Capabilities dimensions', () => {
  it('reads WMS 1.1.1 Extent inherited through nested groups', () => {
    const xml = '<WMT_MS_Capabilities><Capability><Layer><Dimension name="time" units="ISO8601"/><Extent name="time" nearestValue="0">2024-01-01/2024-01-03/P1D</Extent><Layer><Layer><Name>nested</Name></Layer></Layer></Layer></Capability></WMT_MS_Capabilities>';
    expect(readTimeDimension(xml, { type: 'WMS', layers: 'nested' })).toEqual({ name: 'time', values: '2024-01-01/2024-01-03/P1D', nearestValue: false });
  });

  it('preserves the exact WMTS dimension identifier and all Value elements', () => {
    const xml = '<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1"><Contents><Layer><ows:Identifier>wind</ows:Identifier><Dimension><ows:Identifier>Time</ows:Identifier><Value>2024-01-01</Value><Value>2024-01-04</Value></Dimension></Layer></Contents></Capabilities>';
    expect(readTimeDimension(xml, { type: 'WMTS', layer: 'wind' })).toEqual({ name: 'Time', values: '2024-01-01,2024-01-04', nearestValue: false });
  });
});
