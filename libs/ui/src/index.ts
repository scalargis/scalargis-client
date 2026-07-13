export { AdsProviders } from './AdsProviders';
export type { AdsProvidersProps } from './AdsProviders';

export { adsBaseTheme, adsCssVariablesResolver } from './theme/ads-mantine-theme';
export type { AdsBaseTheme } from './theme/ads-mantine-theme';

/* ─── Recipes (plan §1c) ─────────────────────────────────────────────── */
export { DataGrid, exportGridCSV } from './recipes/DataGrid';
export type { DataGridColumn, DataGridProps } from './recipes/DataGrid';

export { confirm, ConfirmPopover } from './recipes/confirm';
export type {
  ConfirmOptions,
  ConfirmPopoverProps,
  ConfirmSeverity,
} from './recipes/confirm';

export { notify } from './recipes/notify';
export type { NotifyOptions, NotifySeverity } from './recipes/notify';

export { exportCSV, toCSV } from './recipes/exportCSV';
export type { ExportCSVOptions, ExportColumn } from './recipes/exportCSV';

export { TreeView, useTree, getTreeExpandedState } from './recipes/TreeView';
export type { TreeNodeData, TreeViewProps } from './recipes/TreeView';

export { TreeSelect } from './recipes/TreeSelect';
export type { TreeSelectProps } from './recipes/TreeSelect';

export { CollapsiblePanel } from './recipes/CollapsiblePanel';
export type { CollapsiblePanelProps } from './recipes/CollapsiblePanel';

export { FileUpload } from './recipes/FileUpload';
export type { FileUploadProps } from './recipes/FileUpload';
