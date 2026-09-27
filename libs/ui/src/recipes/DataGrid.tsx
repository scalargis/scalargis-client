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
   3. Row drag-reordering (`onRowReorder`) — the DataTable reorderableRows
      replacement. The @hello-pangea/dnd wiring, the grip-handle column and
      the drag-time cell-width lock all live here so call sites declare one
      callback instead of assembling rowFactory/tableWrapper/dnd themselves.

   Every default below is overridable — pass the prop and it wins.
   ===================================================================== */

import React from 'react';
import { UnstyledButton } from '@mantine/core';
import {
  DataTable,
  DataTableDraggableRow,
  getRecordId,
  reorderRecords,
  type DataTableColumn,
  type DataTableColumnGroup,
  type DataTableProps,
} from 'mantine-datatable';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DraggableProvidedDragHandleProps,
  type DropResult,
} from '@hello-pangea/dnd';

import { exportCSV, type ExportCSVOptions, type ExportColumn } from './exportCSV';
import { IconGripVertical } from './icons';
import { uiText } from './i18n';

export type DataGridColumn<T> = DataTableColumn<T> & {
  /** Cell → CSV value, when the exported value differs from the rendered one. */
  exportRender?: (record: T) => unknown;
  /** Exclude this column from CSV export (action columns, checkboxes). */
  exportable?: boolean;
};

/** A grouped-header cell whose leaf columns carry the DataGrid CSV metadata. */
export type DataGridGroup<T> = Omit<DataTableColumnGroup<T>, 'columns'> & {
  columns: DataGridColumn<T>[];
};

/** Props shared by both the `columns` and the `groups` branch. */
type DataGridBaseProps<T> = Omit<DataTableProps<T>, 'columns' | 'groups'> & {
  /**
   * Enables row drag-reordering: a grip-handle column is prepended and the
   * callback receives the full `records` array in its new order (the caller
   * owns persistence — typically `onChange`/`setState` with that array).
   *
   * Requirements: `records` must carry stable unique ids under `idAccessor`
   * (pass a function accessor for rows without natural ids), and the grid
   * must not be sorted or paged during reordering — indices are relative to
   * the `records` prop as rendered. Owns `rowFactory` and `tableWrapper`;
   * passing either alongside is a programming error and they are ignored.
   *
   * The handle is a real button, so keyboard reordering works out of the
   * box (focus the grip, Space lifts, arrows move, Space drops).
   *
   * Reordering pairs with the `columns` branch only. It is ignored under
   * `groups`, where no in-scope screen reorders rows.
   */
  onRowReorder?: (records: T[]) => void;
};

/**
 * `DataTableProps` is a union: a table is defined by `columns` XOR `groups`
 * (grouped header rows). DataGrid mirrors that discriminant so each call site
 * passes exactly one, and neither branch leaves the other's props assignable.
 *
 * The `groups` branch serves the grouped monitoring list. mantine-datatable
 * renders `groups` natively, so this is a type and pass-through, not a new
 * rendering path; the ADS header band and grid defaults apply to both.
 */
export type DataGridProps<T> =
  | (DataGridBaseProps<T> & { columns: DataGridColumn<T>[]; groups?: never })
  | (DataGridBaseProps<T> & { groups: DataGridGroup<T>[]; columns?: never });

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
  getPaginationItemProps: () => ({ 'data-ads-page-item': '' }),
  getPaginationControlProps: (control: 'first' | 'last' | 'previous' | 'next') => ({
    'data-ads-control': control,
  }),
} as const satisfies Partial<DataTableProps<never>>;

// An empty table has no rows, so its body has no height, and the empty state
// is centred into it absolutely — with nothing to centre in, the icon and its
// text end up crushed against the header. This is the floor that gives them
// somewhere to be. It is the body that needs the room, not the state: adding
// spacing inside the state instead pushes it out of a body this short.
const EMPTY_MIN_HEIGHT = 180;

const ADS_CLASS_NAMES = {
  // The root carries `container-type: inline-size`, so the pagination footer
  // can reflow against the GRID's width rather than the viewport's: the same
  // grid sits in a full-width backoffice page and in a ~300px viewer side
  // panel, and only the latter needs the footer stacked. See ads-components.css.
  root: 'ads-datagrid',
  header: 'ads-datagrid__header',
  pagination: 'ads-datagrid__pagination',
} as const;

/* ─── Row reordering ────────────────────────────────────────────────────
   The handle lives in an auto-prepended column, but @hello-pangea/dnd only
   hands out dragHandleProps inside the per-row Draggable render — a context
   bridges them to the cell. Scoping drags to the handle (instead of
   spreading dragHandleProps over the whole row) keeps the row itself a
   plain row: text stays selectable, row clicks and per-row buttons work
   unchanged, and the row doesn't carry role="button" over its own
   interactive children. */

const RowDragHandleContext = React.createContext<
  DraggableProvidedDragHandleProps | null | undefined
>(undefined);

function RowDragHandle() {
  const handleProps = React.useContext(RowDragHandleContext);
  return (
    // type="button": grids render inside <form>s (the wave-2 implicit-submit trap).
    <UnstyledButton
      type="button"
      className="ads-datagrid__drag-handle"
      aria-label={uiText('datagrid.reorder', 'Reorder row')}
      {...handleProps}
    >
      <IconGripVertical />
    </UnstyledButton>
  );
}

const REORDER_HANDLE_COLUMN: DataGridColumn<unknown> = {
  accessor: '__reorder__',
  title: '',
  width: 40,
  render: () => <RowDragHandle />,
};

export function DataGrid<T>({
  classNames,
  columns,
  groups,
  onRowReorder,
  ...props
}: DataGridProps<T>) {
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

  const { records, idAccessor = 'id' } = props;

  // Latest-ref: the drop handler needs the current records/callback, but the
  // tableWrapper below must keep ONE identity for the life of the grid —
  // mantine-datatable renders tableWrapper as a component type, so a new
  // function each render would unmount and remount the entire table subtree
  // (rows, DragDropContext, scroll state) on every parent render.
  const dragEndRef = React.useRef<(result: DropResult) => void>(() => undefined);
  dragEndRef.current = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    onRowReorder?.(reorderRecords(result, records ?? []));
  };

  const reorderRowFactory = React.useCallback<NonNullable<DataTableProps<T>['rowFactory']>>(
    ({ record, index, rowProps, children }) => {
      const id = String(getRecordId(record, idAccessor));
      return (
        // disableInteractiveElementBlocking: the drag handle IS a <button>,
        // and hello-pangea refuses to lift from interactive elements unless
        // told otherwise. Only the handle carries dragHandleProps, so this
        // does not make the row's other buttons draggable.
        <Draggable key={id} draggableId={id} index={index} disableInteractiveElementBlocking>
          {(provided, snapshot) => (
            <RowDragHandleContext.Provider value={provided.dragHandleProps}>
              {/* DataTableDraggableRow copies the header cells' widths onto the
                  row while it drags, so cells don't collapse when dnd lifts the
                  row to position:fixed — columns need no explicit widths.
                  draggableProps spread after rowProps: the drag transform style
                  must win. */}
              <DataTableDraggableRow
                isDragging={snapshot.isDragging}
                {...rowProps}
                {...provided.draggableProps}
                ref={provided.innerRef}
              >
                {children}
              </DataTableDraggableRow>
            </RowDragHandleContext.Provider>
          )}
        </Draggable>
      );
    },
    [idAccessor]
  );

  // Empty deps on purpose — see the latest-ref note above.
  const reorderTableWrapper = React.useCallback<
    NonNullable<DataTableProps<T>['tableWrapper']>
  >(
    ({ children }) => (
      <DragDropContext onDragEnd={(result) => dragEndRef.current(result)}>
        <Droppable droppableId="ads-datagrid-reorder">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {children}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    ),
    []
  );

  // Reorder applies to the flat-columns branch only. The grouped branch has no
  // in-scope reorder consumer, so its columns pass through untouched.
  const reordering = Boolean(onRowReorder) && Boolean(columns);

  const effectiveColumns = React.useMemo(
    () =>
      reordering && columns
        ? [REORDER_HANDLE_COLUMN as DataGridColumn<T>, ...columns]
        : columns,
    [columns, reordering]
  );

  if (onRowReorder && (props.rowFactory || props.tableWrapper)) {
    // eslint-disable-next-line no-console
    console.warn(
      'DataGrid: onRowReorder owns rowFactory/tableWrapper; the ones passed in are ignored.'
    );
  }

  // The cast re-enters the union on whichever branch the call site chose.
  // Exactly one of `columns`/`groups` is present, so the discriminant holds.
  const tableProps = {
    ...ADS_DEFAULTS,
    minHeight: records?.length ? undefined : EMPTY_MIN_HEIGHT,
    ...props,
    ...(reordering
      ? { rowFactory: reorderRowFactory, tableWrapper: reorderTableWrapper }
      : {}),
    ...(groups ? { groups } : { columns: effectiveColumns }),
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
