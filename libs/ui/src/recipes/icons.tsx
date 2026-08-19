/* =====================================================================
   Recipe icons — primeicons behind one indirection point.

   The migration keeps primeicons (mantine/README.md §decisions: "primeicons
   stay"; 00-baseline-and-scope.md §prime-ecosystem: Mantine renders them
   via <i className>). The recipes therefore use the same `pi pi-*` classes
   as every other screen — but only through this module, so the "optional
   icon swap" the plan defers to a future project is a one-file change.

   primeicons is a standalone MIT icon FONT with no primereact runtime
   dependency; it survives the Phase 5 primereact removal by decision.
   AdsProviders imports its stylesheet so the recipes render correctly even
   in a shell that no longer loads Prime's own CSS.

   All icons inherit `currentColor`, are sized 1em (the font class's fixed
   1rem is overridden so they track their container like the SVGs they
   replaced), and are decorative by default (aria-hidden); pass `title`
   when one must carry meaning on its own.
   ===================================================================== */

import React from 'react';

export interface IconProps extends React.HTMLAttributes<HTMLElement> {
  /** Accessible name. Omit for decorative icons (the default). */
  title?: string;
  /** Compose primeicons' fixed-width modifier (`pi-fw`) so glyphs align. */
  fixedWidth?: boolean;
  /** Compose primeicons' spin modifier (`pi-spin`) for busy/loading glyphs. */
  spin?: boolean;
}

function piIcon(piClass: string) {
  function Icon({ title, className, style, fixedWidth, spin, ...props }: IconProps) {
    return (
      <i
        // The modifier classes join here so `pi-fw`/`pi-spin` are single-sourced
        // too; order is irrelevant to primeicons (independent classes).
        className={[piClass, fixedWidth && 'pi-fw', spin && 'pi-spin', className]
          .filter(Boolean)
          .join(' ')}
        // .pi pins font-size to 1rem; 1em keeps the glyph on its container.
        style={{ fontSize: '1em', ...style }}
        aria-hidden={title ? undefined : true}
        role={title ? 'img' : undefined}
        aria-label={title}
        {...props}
      />
    );
  }
  Icon.displayName = `Icon(${piClass})`;
  return Icon;
}

// ── Original recipe set ──────────────────────────────────────────────────
export const IconChevronRight = piIcon('pi pi-chevron-right');
// Prime's own RowReorder glyph — familiar as "drag me" from the old grids.
export const IconGripVertical = piIcon('pi pi-bars');
export const IconChevronDown = piIcon('pi pi-chevron-down');
export const IconCheckCircle = piIcon('pi pi-check-circle');
export const IconInfoCircle = piIcon('pi pi-info-circle');
export const IconAlertTriangle = piIcon('pi pi-exclamation-triangle');
export const IconXCircle = piIcon('pi pi-times-circle');
export const IconUpload = piIcon('pi pi-upload');
export const IconX = piIcon('pi pi-times');
export const IconPlus = piIcon('pi pi-plus');
export const IconFile = piIcon('pi pi-file');
export const IconWindowMaximize = piIcon('pi pi-window-maximize');
export const IconWindowMinimize = piIcon('pi pi-window-minimize');

// ── App vocabulary ───────────────────────────────────────────────────────
// The full glyph set the Mantine apps and libs inline today, single-sourced
// here so the eventual primeicons swap is a one-file edit. Named for the use,
// not the glyph, where the two differ (as IconX = pi-times above does).

// The same `pi pi-bars` glyph as IconGripVertical, but used as a hamburger
// menu toggle — a separate export so call sites read for their intent.
export const IconMenu = piIcon('pi pi-bars');

// Actions
export const IconTrash = piIcon('pi pi-trash');
export const IconCheck = piIcon('pi pi-check');
export const IconPencil = piIcon('pi pi-pencil');
export const IconSave = piIcon('pi pi-save');
export const IconDownload = piIcon('pi pi-download');
export const IconPrint = piIcon('pi pi-print');
export const IconCopy = piIcon('pi pi-copy');
export const IconShare = piIcon('pi pi-share-alt');
export const IconRefresh = piIcon('pi pi-refresh');
export const IconReplay = piIcon('pi pi-replay');
export const IconUndo = piIcon('pi pi-undo');
export const IconPlay = piIcon('pi pi-play');
export const IconPause = piIcon('pi pi-pause');
export const IconPowerOff = piIcon('pi pi-power-off');
// A busy/loading glyph — pair with the `spin` modifier prop.
export const IconSpinner = piIcon('pi pi-spinner');

// Search / view
export const IconSearch = piIcon('pi pi-search');
export const IconSearchPlus = piIcon('pi pi-search-plus');
export const IconEye = piIcon('pi pi-eye');
export const IconList = piIcon('pi pi-list');
export const IconTable = piIcon('pi pi-table');
export const IconObjectsColumn = piIcon('pi pi-objects-column');
export const IconSliders = piIcon('pi pi-sliders-h');
export const IconAlignJustify = piIcon('pi pi-align-justify');
export const IconEllipsisV = piIcon('pi pi-ellipsis-v');

// People / auth
export const IconUser = piIcon('pi pi-user');
export const IconUserEdit = piIcon('pi pi-user-edit');
export const IconLock = piIcon('pi pi-lock');
export const IconUnlock = piIcon('pi pi-unlock');
export const IconKey = piIcon('pi pi-key');

// Objects
export const IconHome = piIcon('pi pi-home');
export const IconGlobe = piIcon('pi pi-globe');
export const IconEnvelope = piIcon('pi pi-envelope');
export const IconInbox = piIcon('pi pi-inbox');
export const IconImage = piIcon('pi pi-image');
export const IconFolderOpen = piIcon('pi pi-folder-open');
export const IconPalette = piIcon('pi pi-palette');
export const IconCog = piIcon('pi pi-cog');
export const IconBullseye = piIcon('pi pi-bullseye');
export const IconExternalLink = piIcon('pi pi-external-link');
export const IconQuestionCircle = piIcon('pi pi-question-circle');

// Shapes / status marks
export const IconMinus = piIcon('pi pi-minus');
export const IconPlusCircle = piIcon('pi pi-plus-circle');
export const IconMinusCircle = piIcon('pi pi-minus-circle');
export const IconSquare = piIcon('pi pi-square');
export const IconCircle = piIcon('pi pi-circle');
export const IconCircleFill = piIcon('pi pi-circle-fill');

// Navigation arrows
export const IconArrowLeft = piIcon('pi pi-arrow-left');
export const IconArrowCircleDown = piIcon('pi pi-arrow-circle-down');
export const IconChevronLeft = piIcon('pi pi-chevron-left');
export const IconChevronCircleDown = piIcon('pi pi-chevron-circle-down');
export const IconAngleUp = piIcon('pi pi-angle-up');
export const IconAngleDown = piIcon('pi pi-angle-down');
export const IconAngleLeft = piIcon('pi pi-angle-left');
export const IconAngleRight = piIcon('pi pi-angle-right');
export const IconAngleDoubleLeft = piIcon('pi pi-angle-double-left');
export const IconAngleDoubleRight = piIcon('pi pi-angle-double-right');
