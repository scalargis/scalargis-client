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
}

function piIcon(piClass: string) {
  function Icon({ title, className, style, ...props }: IconProps) {
    return (
      <i
        className={[piClass, className].filter(Boolean).join(' ')}
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

export const IconChevronRight = piIcon('pi pi-chevron-right');
export const IconChevronDown = piIcon('pi pi-chevron-down');
export const IconCheckCircle = piIcon('pi pi-check-circle');
export const IconInfoCircle = piIcon('pi pi-info-circle');
export const IconAlertTriangle = piIcon('pi pi-exclamation-triangle');
export const IconXCircle = piIcon('pi pi-times-circle');
export const IconUpload = piIcon('pi pi-upload');
export const IconX = piIcon('pi pi-times');
export const IconPlus = piIcon('pi pi-plus');
export const IconFile = piIcon('pi pi-file');
