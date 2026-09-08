export { AdsProviders } from './AdsProviders';
export type { AdsProvidersProps } from './AdsProviders';

export { adsBaseTheme, adsCssVariablesResolver } from './theme/ads-mantine-theme';
export type { AdsBaseTheme } from './theme/ads-mantine-theme';

/* Motion — the central animation control (see theme/motion.ts). */
export {
  FORCE_REDUCED_MOTION,
  applyMotionPreference,
  motionCssVariables,
  motionDurations,
  motionEasing,
  motionTransitionProps,
} from './theme/motion';

export { createClientTheme } from './theme/client-theme';
export type { ClientThemeOverride } from './theme/client-theme';

export { clientThemePresets, resolveClientThemePreset } from './theme/presets';
export type { ClientThemePreset } from './theme/presets';

export { useApplyClientTheme } from './theme/client-theme-registry';
export type { ClientThemeEntry } from './theme/client-theme-registry';

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

export { CodeEditor } from './recipes/CodeEditor';
export type {
  CodeEditorProps,
  CodeEditorHandle,
  CodeEditorLanguage,
} from './recipes/CodeEditor';

export { FileUpload } from './recipes/FileUpload';
export type { FileUploadProps } from './recipes/FileUpload';

export { TabPanel } from './recipes/TabPanel';
export type { TabPanelProps, TabMount } from './recipes/TabPanel';

export { SkipLink } from './recipes/SkipLink';
export type { SkipLinkProps } from './recipes/SkipLink';

export { Dialog } from './recipes/Dialog';
export type { DialogProps } from './recipes/Dialog';

export { Lightbox } from './recipes/Lightbox';
export type { LightboxProps } from './recipes/Lightbox';

export { Field } from './recipes/Field';
export type { FieldProps } from './recipes/Field';

export { AttributeTable } from './recipes/AttributeTable';
export type { AttributeTableProps, AttributeRow } from './recipes/AttributeTable';

export { MapPanel } from './recipes/MapPanel';
export type {
  MapPanelProps,
  DockMapPanelProps,
  FloatMapPanelProps,
} from './recipes/MapPanel';

export { useMapResize } from './recipes/useMapResize';
export type { MapResizeDeps, MapResizeActions } from './recipes/useMapResize';

/* Icon seam — primeicons behind one indirection (see recipes/icons.tsx). */
export * from './recipes/icons';

/* ─── Onboarding tour engine ───────────────────────────────────────── */
export {
  TourProvider,
  TourTarget,
  useTour,
  useOptionalTour,
  OVERLAY_Z,
  POPOVER_Z,
  createController,
  TourContext,
  resetTourState,
} from './onboarding';
export type {
  OnboardingStep,
  OnboardingState,
  OnboardingLabels,
  PopoverPosition,
  TourHandle,
  OnboardingController,
  ControllerListener,
  TourContextValue,
} from './onboarding';

/* ─── Hooks ──────────────────────────────────────────────────────────── */
export { useIsMobile } from './hooks/useIsMobile';
