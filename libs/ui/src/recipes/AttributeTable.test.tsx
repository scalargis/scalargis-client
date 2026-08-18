/**
 * AttributeTable: a headerless read-only key/value <Table>. Covers the
 * two-column default, the value-only collapse (explicit and inferred),
 * ReactNode values (FeatureInfo's valueTemplate can render a <Button>),
 * and that striped/dense actually reach the underlying Mantine <Table>.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { AttributeTable } from './AttributeTable';

function renderTable(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

describe('AttributeTable', () => {
  it('renders each row as a label/value pair, two columns, no header', () => {
    renderTable(
      <AttributeTable
        rows={[
          { label: 'Nome', value: 'Ponte 25 de Abril' },
          { label: 'Comprimento', value: '2277 m' },
        ]}
      />
    );

    expect(screen.queryAllByRole('columnheader')).toHaveLength(0);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('Nome').closest('td')).not.toBeNull();
    expect(screen.getByText('Ponte 25 de Abril').closest('td')).not.toBeNull();
  });

  it('collapses to a single value-only column when hideLabels is set', () => {
    renderTable(
      <AttributeTable hideLabels rows={[{ label: 'Nome', value: 'Texto livre' }]} />
    );

    // The label is dropped entirely, not just visually hidden.
    expect(screen.queryByText('Nome')).toBeNull();
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(1);
    expect(cells[0].textContent).toBe('Texto livre');
  });

  it('infers the single-column layout when no row carries a label', () => {
    renderTable(
      <AttributeTable
        rows={[
          { value: 'Linha 1' },
          { value: 'Linha 2' },
        ]}
      />
    );

    expect(screen.getAllByRole('cell')).toHaveLength(2);
  });

  it('keeps the label column when only some rows omit a label', () => {
    renderTable(
      <AttributeTable
        rows={[
          { label: 'Campo', value: 'Valor' },
          { value: 'Sem etiqueta' },
        ]}
      />
    );

    // Mixed rows are not the "no row has a label" case, so both columns stay.
    expect(screen.getAllByRole('cell')).toHaveLength(4);
  });

  it('renders a ReactNode value, e.g. an action button', () => {
    renderTable(
      <AttributeTable rows={[{ label: 'Ação', value: <button type="button">Exportar</button> }]} />
    );

    expect(screen.getByRole('button', { name: 'Exportar' })).toBeTruthy();
  });

  it('forwards striped to the underlying Table rows', () => {
    renderTable(<AttributeTable striped rows={[{ label: 'A', value: '1' }]} />);
    const row = screen.getAllByRole('row')[0];
    expect(row.getAttribute('data-striped')).toBeTruthy();
  });

  it('does not stripe rows when striped is omitted', () => {
    renderTable(<AttributeTable rows={[{ label: 'A', value: '1' }]} />);
    const row = screen.getAllByRole('row')[0];
    expect(row.getAttribute('data-striped')).toBeNull();
  });

  it('maps dense to the xs table spacing tokens', () => {
    const { container: denseContainer } = renderTable(
      <AttributeTable dense rows={[{ label: 'A', value: '1' }]} />
    );
    const denseTable = denseContainer.querySelector('table') as HTMLTableElement;
    expect(denseTable.style.getPropertyValue('--table-vertical-spacing')).toBe(
      'var(--mantine-spacing-xs)'
    );

    const { container: plainContainer } = renderTable(
      <AttributeTable rows={[{ label: 'A', value: '1' }]} />
    );
    const plainTable = plainContainer.querySelector('table') as HTMLTableElement;
    expect(plainTable.style.getPropertyValue('--table-vertical-spacing')).not.toBe(
      'var(--mantine-spacing-xs)'
    );
  });

  it('preserves the className passed through (e.g. "fi-result-table")', () => {
    const { container } = renderTable(
      <AttributeTable className="fi-result-table" rows={[{ label: 'A', value: '1' }]} />
    );
    expect(container.querySelector('table.fi-result-table')).not.toBeNull();
  });
});
