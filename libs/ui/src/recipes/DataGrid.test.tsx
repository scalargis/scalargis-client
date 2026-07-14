/**
 * exportGridCSV — the grid-side half of the CSV contract: what the screen
 * shows is what the file contains (column titles, display order,
 * exportRender), and non-data columns stay out.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAs } from 'file-saver';

import { exportGridCSV, type DataGridColumn } from './DataGrid';

// Hoisted above the imports by vitest.
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const saved = vi.mocked(saveAs);

interface City {
  name: string;
  population: number;
  capital: boolean;
}

const records: City[] = [
  { name: 'Lisbon', population: 504718, capital: true },
  { name: 'Porto', population: 214349, capital: false },
];

const columns: DataGridColumn<City>[] = [
  { accessor: 'name', title: 'City' },
  { accessor: 'population', title: 'Population' },
  // Rendered Yes/No on screen — the export must match the screen.
  { accessor: 'capital', title: 'Capital', exportRender: (r) => (r.capital ? 'Yes' : 'No') },
  // Action column: no data behind it, must not leak into the file.
  { accessor: 'actions', title: 'Actions', exportable: false },
];

async function lastCsvText(): Promise<string> {
  const blob = saved.mock.calls.at(-1)?.[0] as Blob;
  return blob.text();
}

beforeEach(() => {
  saved.mockClear();
});

describe('exportGridCSV', () => {
  it('exports titles as the header and applies exportRender, skipping exportable:false', async () => {
    exportGridCSV(records, columns, { withBom: false });

    expect(await lastCsvText()).toBe(
      ['City,Population,Capital', 'Lisbon,504718,Yes', 'Porto,214349,No'].join('\r\n')
    );
  });

  it('skips columns without an accessor (selection/expander columns)', async () => {
    exportGridCSV(records, [{ title: 'Sel' } as DataGridColumn<City>, ...columns], {
      withBom: false,
    });

    expect((await lastCsvText()).split('\r\n')[0]).toBe('City,Population,Capital');
  });

  it('falls back to the accessor when the title is not a plain string', async () => {
    exportGridCSV(
      records,
      [{ accessor: 'name', title: <em>Fancy</em> } as DataGridColumn<City>],
      { withBom: false }
    );

    expect((await lastCsvText()).split('\r\n')[0]).toBe('name');
  });

  it('prepends the BOM by default and appends .csv to the filename', async () => {
    exportGridCSV(records, columns, { filename: 'cities' });

    const [blob, filename] = saved.mock.calls.at(-1) as [Blob, string];
    expect(filename).toBe('cities.csv');
    // Blob.text() strips a leading BOM by spec — check the raw bytes.
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });
});
