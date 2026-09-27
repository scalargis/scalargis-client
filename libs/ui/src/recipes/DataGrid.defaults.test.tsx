/** DataGrid defaults: the empty-state floor on an empty grid only, and the page-size label. */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { DataGrid, type DataGridProps } from './DataGrid';

beforeAll(() => {
  const base = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    ...base(query),
    matches: query === '',
  })) as typeof window.matchMedia;
});

interface Row {
  id: number;
  name: string;
}

function rootOf(extra: Partial<DataGridProps<Row>> = {}) {
  const { container } = render(
    <MantineProvider theme={adsBaseTheme}>
      <DataGrid<Row> records={[]} columns={[{ accessor: 'name', title: 'Nome' }]} {...extra} />
    </MantineProvider>
  );
  return container.querySelector('.ads-datagrid') as HTMLElement;
}

describe('DataGrid min height', () => {
  it('gives an empty grid the 180px floor', () => {
    expect(rootOf().style.minHeight).toBe('180px');
  });

  it('gives a grid with rows no floor', () => {
    expect(rootOf({ records: [{ id: 1, name: 'Lagoa' }] }).style.minHeight).toBe('');
  });

  it('keeps a minHeight that the caller passes', () => {
    expect(rootOf({ records: [{ id: 1, name: 'Lagoa' }], minHeight: 300 }).style.minHeight).toBe('300px');
  });
});

describe('DataGrid page-size label', () => {
  it('labels the page-size picker with the recipe default', () => {
    rootOf({
      records: [{ id: 1, name: 'Lagoa' }],
      totalRecords: 1,
      page: 1,
      onPageChange: () => undefined,
      recordsPerPage: 10,
      recordsPerPageOptions: [10, 20],
      onRecordsPerPageChange: () => undefined,
    });
    expect(screen.getByText('Records per page').tagName).toBeTruthy();
  });
});
