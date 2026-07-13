import { describe, expect, it } from 'vitest';

import { toCSV, type ExportColumn } from './exportCSV';

interface City {
  name: string;
  country: string;
  population: number;
  capital: boolean;
}

const columns: ExportColumn<City>[] = [
  { accessor: 'name', title: 'City' },
  { accessor: 'country', title: 'Country' },
  { accessor: 'population', title: 'Population' },
  { accessor: 'capital', title: 'Capital', exportRender: (c) => (c.capital ? 'Yes' : 'No') },
];

const lisbon: City = { name: 'Lisbon', country: 'Portugal', population: 504718, capital: true };

describe('toCSV', () => {
  it('writes the column titles as the header row, in display order', () => {
    const [header] = toCSV([lisbon], columns).split('\r\n');
    expect(header).toBe('City,Country,Population,Capital');
  });

  it('prefers exportRender over the raw value', () => {
    const [, row] = toCSV([lisbon], columns).split('\r\n');
    expect(row).toBe('Lisbon,Portugal,504718,Yes');
  });

  it('omits the header when asked', () => {
    expect(toCSV([lisbon], columns, { includeHeader: false })).not.toContain('Population');
  });

  it('resolves dotted accessors and tolerates a missing branch', () => {
    const rows = [{ owner: { name: 'Ana' } }, { owner: null }];
    const csv = toCSV(rows, [{ accessor: 'owner.name', title: 'Owner' }], {
      includeHeader: false,
    });
    expect(csv.split('\r\n')).toEqual(['Ana', '']);
  });

  it('quotes fields containing the separator, quotes or newlines', () => {
    const rows = [{ v: 'a,b' }, { v: 'say "hi"' }, { v: 'line1\nline2' }];
    const csv = toCSV(rows, [{ accessor: 'v' }], { includeHeader: false });
    expect(csv.split('\r\n')).toEqual(['"a,b"', '"say ""hi"""', '"line1\nline2"']);
  });

  it('honours a custom separator, and quotes on that separator instead', () => {
    const csv = toCSV([{ v: 'a;b' }, { v: 'a,b' }], [{ accessor: 'v' }], {
      separator: ';',
      includeHeader: false,
    });
    expect(csv.split('\r\n')).toEqual(['"a;b"', 'a,b']);
  });

  it('neutralises formula injection in leading = + - @', () => {
    const rows = [{ v: '=1+1' }, { v: '+cmd' }, { v: '-cmd' }, { v: '@SUM(A1)' }];
    const csv = toCSV(rows, [{ accessor: 'v' }], { includeHeader: false });
    // Each value keeps its text but can no longer be evaluated by a spreadsheet.
    expect(csv.split('\r\n')).toEqual(['\t=1+1', '\t+cmd', '\t-cmd', '\t@SUM(A1)']);
  });

  it('leaves plain numbers alone — negative longitudes must survive a round-trip', () => {
    // A purely numeric value cannot carry a formula payload; tab-prefixing it
    // would turn every negative number in a GIS export into text.
    const rows = [{ v: -8.6538 }, { v: '-2' }, { v: '-2,5' }, { v: '+351' }, { v: '-1e5' }];
    const csv = toCSV(rows, [{ accessor: 'v' }], { includeHeader: false });
    expect(csv.split('\r\n')).toEqual(['-8.6538', '-2', '"-2,5"', '+351', '-1e5']);
  });

  it('renders null and undefined as empty, not as "null"', () => {
    const csv = toCSV([{ a: null, b: undefined }], [{ accessor: 'a' }, { accessor: 'b' }], {
      includeHeader: false,
    });
    expect(csv).toBe(',');
  });
});
