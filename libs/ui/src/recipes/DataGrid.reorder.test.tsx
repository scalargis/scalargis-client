/**
 * DataGrid onRowReorder — the recipe owns the whole drag-and-drop story:
 * a grip-handle column is prepended (a real button, so keyboard lift/move
 * works and forms are safe from implicit submit), and rowFactory/tableWrapper
 * belong to the recipe while reordering is on.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { DataGrid, type DataGridProps } from './DataGrid';

/* mantine-datatable resolves each column's visibleMediaQuery through
   useMediaQuery(query ?? '', true) — and a real browser matches the empty
   query, keeping columns visible. The global test stub answers false to
   everything, which hides every cell one effect-tick after mount; answer
   true for the empty query so the grid renders like it does in a browser. */
beforeAll(() => {
  const base = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    ...base(query),
    matches: query === '',
  })) as typeof window.matchMedia;
});

interface Layout {
  id: number;
  format: string;
}

const records: Layout[] = [
  { id: 1, format: 'A4' },
  { id: 2, format: 'A3' },
  { id: 3, format: 'A0' },
];

function renderGrid(extra: Partial<DataGridProps<Layout>> = {}) {
  return render(
    <MantineProvider theme={adsBaseTheme}>
      <DataGrid<Layout>
        records={records}
        columns={[{ accessor: 'format', title: 'Formato' }]}
        {...extra}
      />
    </MantineProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DataGrid onRowReorder', () => {
  it('prepends one grip handle per row — a labelled type="button" (form-safe, keyboard-liftable)', () => {
    renderGrid({ onRowReorder: vi.fn() });

    const handles = screen.getAllByRole('button', { name: 'Reorder row' });
    expect(handles).toHaveLength(records.length);
    for (const handle of handles) {
      expect(handle.tagName).toBe('BUTTON');
      expect(handle.getAttribute('type')).toBe('button');
    }
  });

  it('renders no grip column when onRowReorder is not set', () => {
    renderGrid();

    expect(screen.queryByRole('button', { name: 'Reorder row' })).toBeNull();
    expect(screen.getByText('A4')).toBeTruthy(); // the grid itself still renders
  });

  it('keeps the table mounted across record/callback identity changes (stable tableWrapper)', () => {
    // mantine-datatable renders tableWrapper as a component TYPE: if the grid
    // rebuilt it per render, every parent render would unmount and remount the
    // whole table (drag contexts, scroll state). Same DOM node = no remount.
    const grid = (rows: Layout[]) => (
      <MantineProvider theme={adsBaseTheme}>
        <DataGrid<Layout>
          records={rows}
          columns={[{ accessor: 'format', title: 'Formato' }]}
          onRowReorder={vi.fn()}
        />
      </MantineProvider>
    );

    const { container, rerender } = render(grid(records));
    const tableBefore = container.querySelector('table');
    expect(tableBefore).toBeTruthy();

    rerender(grid([...records].reverse()));
    expect(container.querySelector('table')).toBe(tableBefore);
  });

  it('owns rowFactory/tableWrapper: passing one alongside warns and is ignored', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    renderGrid({
      onRowReorder: vi.fn(),
      rowFactory: () => <tr />,
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('onRowReorder owns rowFactory'));
    // The reorder rowFactory won: rows still carry their grip handles.
    expect(screen.getAllByRole('button', { name: 'Reorder row' })).toHaveLength(records.length);
  });
});
