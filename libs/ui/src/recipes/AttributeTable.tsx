/* =====================================================================
   AttributeTable — a read-only key/value list, composed over Mantine
   <Table>.

   Not DataGrid. DataGrid (mantine-datatable) is for the sortable/paged/
   selectable grid; a feature-attribute popup or a geolocation readout is
   neither — it's a fixed field/value list with no header of meaning. The
   two raw <Table> holdouts this replaces (FeatureInfo/FeatureResults,
   GeoLocation) both render exactly that shape, so the recipe is
   deliberately headerless: no <Thead>, no sort, no paging, just rows.

   Values are ReactNode, not strings: FeatureInfo's valueTemplate can
   return a <Button> (an inline action tied to a field), so this never
   narrows to string-only cells. A row with no label (or hideLabels) drops
   to a single value-only column — the "isText" feature case in
   FeatureInfo, where there is nothing meaningful to put in a first column.
   ===================================================================== */

import React from 'react';
import { Table } from '@mantine/core';

export interface AttributeRow {
  /** Omit/undefined to render as a value-only row (see hideLabels). */
  label?: React.ReactNode;
  /** ReactNode: a field's valueTemplate can render a <Button>, not just text. */
  value: React.ReactNode;
  /** Stable row key. Falls back to the row's index when absent. */
  key?: React.Key;
}

export interface AttributeTableProps {
  rows: AttributeRow[];
  /** Maps to Mantine <Table> verticalSpacing/horizontalSpacing 'xs'. */
  dense?: boolean;
  /** Maps to Mantine <Table striped>. */
  striped?: boolean;
  /**
   * Force the value-only single-column layout. When omitted, it is inferred:
   * if no row carries a label, the table collapses to one column on its own.
   */
  hideLabels?: boolean;
  /** Forwarded to the underlying <Table> (preserves e.g. "fi-result-table"). */
  className?: string;
  /** Extra class applied to every cell, alongside the pre-wrap default. */
  cellClassName?: string;
}

// Long attribute values (addresses, descriptions, …) must wrap, not clip or
// overflow the panel — both source call sites relied on this.
const cellStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
};

export function AttributeTable({
  rows,
  dense,
  striped,
  hideLabels,
  className,
  cellClassName,
}: AttributeTableProps) {
  const singleColumn = hideLabels ?? rows.every((row) => row.label == null);

  return (
    <Table
      className={className}
      striped={striped}
      verticalSpacing={dense ? 'xs' : undefined}
      horizontalSpacing={dense ? 'xs' : undefined}
    >
      <Table.Tbody>
        {rows.map((row, index) => (
          <Table.Tr key={row.key ?? index}>
            {!singleColumn && (
              <Table.Td style={cellStyle} className={cellClassName}>
                {row.label}
              </Table.Td>
            )}
            <Table.Td style={cellStyle} className={cellClassName}>
              {row.value}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
