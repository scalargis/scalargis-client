/** DataGrid phone cards: one card per record, laid out by the column roles. */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { DataGrid, type DataGridColumn } from './DataGrid';

type Row = { id: number; nic: string; dir: string; qty: number; secret: string };

const rows: Row[] = [
  { id: 1, nic: 'AAA000959352', dir: 'Norte', qty: 2, secret: 'x' },
  { id: 2, nic: 'AAA001004669', dir: 'Sul', qty: 5, secret: 'y' },
];

const columns: DataGridColumn<Row>[] = [
  { accessor: 'nic', title: 'NIC', phone: 'title' },
  { accessor: 'dir', title: 'Posição', phone: 'meta', phoneRender: (r) => `to ${r.dir}` },
  { accessor: 'qty', title: 'Qtd', phone: 'end' },
  { accessor: 'secret', title: 'Oculto', phone: 'hidden' },
  { accessor: 'id', title: 'Id' },
];

function setMobile(isMobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function renderGrid(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

describe('DataGrid phoneLayout="cards"', () => {
  afterEach(() => setMobile(false));

  it('renders one card per record with the column roles', () => {
    setMobile(true);
    renderGrid(<DataGrid idAccessor="id" records={rows} columns={columns} phoneLayout="cards" />);
    expect(document.querySelector('table')).toBeNull();
    const cards = document.querySelectorAll('.ads-datagrid-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('AAA000959352');
    expect(cards[0].textContent).toContain('to Norte');
    expect(cards[0].textContent).toContain('Id:');
    expect(cards[0].textContent).not.toContain('Oculto');
    expect(screen.queryByText('Posição')).toBeNull();
  });

  it('keeps the table on a wide screen', () => {
    setMobile(false);
    renderGrid(<DataGrid idAccessor="id" records={rows} columns={columns} phoneLayout="cards" />);
    expect(document.querySelector('table')).toBeTruthy();
    expect(document.querySelector('.ads-datagrid-card')).toBeNull();
  });

  it('keeps the table on a phone without the prop', () => {
    setMobile(true);
    renderGrid(<DataGrid idAccessor="id" records={rows} columns={columns} />);
    expect(document.querySelector('table')).toBeTruthy();
  });

  it('shows the empty text and calls onRowClick', () => {
    setMobile(true);
    const onRowClick = vi.fn();
    const { rerender } = renderGrid(
      <DataGrid idAccessor="id" records={[]} columns={columns} phoneLayout="cards" noRecordsText="Sem registos" />
    );
    expect(screen.getByText('Sem registos')).toBeTruthy();
    rerender(
      <MantineProvider theme={adsBaseTheme}>
        <DataGrid idAccessor="id" records={rows} columns={columns} phoneLayout="cards" onRowClick={onRowClick} />
      </MantineProvider>
    );
    fireEvent.click(screen.getByText('AAA001004669'));
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ record: rows[1], index: 1 }));
  });

  it('pages the cards when the grid pages', () => {
    setMobile(true);
    const onPageChange = vi.fn();
    renderGrid(
      <DataGrid
        idAccessor="id"
        records={rows}
        columns={columns}
        phoneLayout="cards"
        page={1}
        onPageChange={onPageChange}
        totalRecords={6}
        recordsPerPage={2}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
