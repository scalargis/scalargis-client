/**
 * DataGrid groups — the grouped-header branch forwards `groups` to
 * mantine-datatable, so a two-row header (group cells over leaf columns)
 * renders while the ADS header band and grid defaults still apply. This is
 * the branch the grouped monitoring list needs.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { DataGrid, type DataGridProps } from './DataGrid';

/* Same matchMedia bridge as the reorder test: the global stub answers false
   to every query and hides every cell one tick after mount; answer true for
   the empty query so columns render like they do in a browser. */
beforeAll(() => {
  const base = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    ...base(query),
    matches: query === '',
  })) as typeof window.matchMedia;
});

interface Row {
  id: number;
  cartCode: string;
  cartState: string;
  orderRef: string;
}

const records: Row[] = [
  { id: 1, cartCode: 'C-1', cartState: 'aberto', orderRef: 'E-1' },
  { id: 2, cartCode: 'C-2', cartState: 'pago', orderRef: 'E-2' },
];

function renderGrid(extra: Partial<DataGridProps<Row>> = {}) {
  return render(
    <MantineProvider theme={adsBaseTheme}>
      <DataGrid<Row>
        records={records}
        groups={[
          {
            id: 'carrinho',
            title: 'Carrinho',
            columns: [
              { accessor: 'cartCode', title: 'Código' },
              { accessor: 'cartState', title: 'Estado' },
            ],
          },
          {
            id: 'encomenda',
            title: 'Encomenda',
            columns: [{ accessor: 'orderRef', title: 'Referência' }],
          },
        ]}
        {...extra}
      />
    </MantineProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DataGrid groups', () => {
  it('renders the group header cells over their leaf columns', () => {
    renderGrid();

    // getByText throws when the node is absent, so a returned element is the assertion.
    for (const label of ['Carrinho', 'Encomenda', 'Código', 'Estado', 'Referência']) {
      expect(screen.getByText(label).tagName).toBeTruthy();
    }
  });

  it('keeps the ADS header band class on the grouped header', () => {
    const { container } = renderGrid();
    expect(container.querySelector('.ads-datagrid__header')).not.toBeNull();
  });

  it('renders the record rows under the grouped header', () => {
    renderGrid();
    expect(screen.getByText('C-1').tagName).toBeTruthy();
    expect(screen.getByText('E-2').tagName).toBeTruthy();
  });
});
