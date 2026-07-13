/* =====================================================================
   DataGrid — the DataTable+Column replacement (plan §1c; 45 files).

   A thin wrapper over mantine-datatable, NOT a new grid abstraction (the
   §1c anti-goal). Everything mantine-datatable does — controlled paging
   and sorting, i.e. server-side lazy mode; per-column filters; selection;
   row expansion; sticky header/scroll — passes straight through. What
   this recipe owns:

   1. The ADS visual contract. Out of the box Mantine's table gives `th`
      nothing but `font-weight: bold`, so header and body read as one flat
      block (Prime tints the header band). Row/border colours and spacing
      also land off the 8px grid.
   2. CSV export, which mantine-datatable has no equivalent for.

   Every default below is overridable — pass the prop and it wins.
   ===================================================================== */

import React from 'react';
import { DataTable, type DataTableColumn, type DataTableProps } from 'mantine-datatable';

import { exportCSV, type ExportCSVOptions, type ExportColumn } from './exportCSV';

export type DataGridColumn<T> = DataTableColumn<T> & {
  /** Cell → CSV value, when the exported value differs from the rendered one. */
  exportRender?: (record: T) => unknown;
  /** Exclude this column from CSV export (action columns, checkboxes). */
  exportable?: boolean;
};

/**
 * `DataTableProps` is a union: a table is defined by `columns` XOR `groups`
 * (grouped header rows). DataGrid supports the `columns` branch only, because
 * carrying the union through makes every call site's props unassignable.
 *
 * ONE in-scope consumer does use grouped headers today: SNICCart's
 * MonitoringList.jsx (`headerColumnGroup`). When that screen migrates
 * (Phase 4), extend DataGrid with a `groups` variant — do not work around
 * the recipe at the call site. Recorded in qa/phase-1.md.
 */
export type DataGridProps<T> = Omit<DataTableProps<T>, 'columns' | 'groups'> & {
  columns: DataGridColumn<T>[];
};

/**
 * ADS defaults. Colours are theme references (`neutral.2`), never hexes, so a
 * client re-skin that swaps a palette does not leave the grid behind.
 */
const ADS_DEFAULTS = {
  withTableBorder: true,
  withColumnBorders: false,
  highlightOnHover: true,
  // Zebra striping and a tinted header both encode "this is a row boundary".
  // Using one keeps the table quiet; the header band is the stronger signal.
  striped: false,
  borderRadius: 'sm',
  borderColor: 'neutral.2',
  rowBorderColor: 'neutral.2',
  highlightOnHoverColor: 'neutral.0',
  // On the 8px grid: 8px vertical, 16px horizontal.
  verticalSpacing: 'xs',
  horizontalSpacing: 'sm',
  verticalAlign: 'center',
  paginationSize: 'sm',
  paginationWithEdges: true,
  paginationWithControls: true,
} as const satisfies Partial<DataTableProps<never>>;

const ADS_CLASS_NAMES = {
  header: 'ads-datagrid__header',
  pagination: 'ads-datagrid__pagination',
} as const;

export function DataGrid<T>({ classNames, columns, ...props }: DataGridProps<T>) {
  // Caller class names extend ours rather than replacing them, so opting into
  // a custom pagination style doesn't silently drop the header band.
  const mergedClassNames = React.useMemo(
    () => ({
      ...ADS_CLASS_NAMES,
      ...classNames,
      header: [ADS_CLASS_NAMES.header, classNames?.header].filter(Boolean).join(' '),
      pagination: [ADS_CLASS_NAMES.pagination, classNames?.pagination]
        .filter(Boolean)
        .join(' '),
    }),
    [classNames]
  );

  // The cast re-enters the union on its `columns` branch, which the type above
  // deliberately flattened away. `columns` is always present, so the branch holds.
  const tableProps = {
    ...ADS_DEFAULTS,
    ...props,
    columns,
    classNames: mergedClassNames,
  } as unknown as DataTableProps<T>;

  return <DataTable {...tableProps} />;
}

/**
 * Export the grid's records through its own column definitions, so the CSV
 * matches what is on screen (titles as headings, `exportRender` where the
 * rendered cell isn't the raw value).
 *
 * Columns are exported in display order; those marked `exportable: false`
 * are skipped, as are columns with no `accessor` (selection, actions).
 */
export function exportGridCSV<T>(
  records: T[],
  columns: DataGridColumn<T>[],
  options: ExportCSVOptions = {}
): void {
  const exportColumns: ExportColumn<T>[] = columns
    .filter((c) => c.exportable !== false && Boolean(c.accessor))
    .map((c) => ({
      accessor: String(c.accessor),
      title: typeof c.title === 'string' ? c.title : String(c.accessor),
      exportRender: c.exportRender,
    }));

  exportCSV(records, exportColumns, options);
}
