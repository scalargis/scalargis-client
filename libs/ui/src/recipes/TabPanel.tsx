/* =====================================================================
   TabPanel — a tab body's mount + hide strategy, expressed as one prop.

   Mantine's own tab hiding is either display:none (Tabs.Panel keepMounted)
   or unmount (keepMounted={false}). Neither fits a mixed editor:
     - display:none makes a CodeMirror gutter re-measure/reflow on reveal;
     - keeping a mantine-datatable mounted at height:0 makes it measure a
       zero-height viewport and defer its rows to a rAF *after* the tab is
       shown (the visible empty-then-fill); and
     - unmounting a react-hook-form field would unregister it.

   So a panel declares how it wants to be mounted:
     eager   — always mounted, hidden off-flow when inactive
               (CodeMirror, react-hook-form fields).
     lazy    — mounted on first reveal, then eager (datatables: a fresh
               mount into an already-laid-out container renders rows on the
               first paint, and stays mounted so re-reveals are instant).
     unmount — mounted only while active (cheap content that should be
               pristine each time it opens).

   Off-flow hiding is self-contained: the panel owns a position:relative
   wrapper, so the hidden body is measured at the real container width and
   needs no positioned ancestor the way an inline height:0 hack does.
   ===================================================================== */

import React, { useRef, type CSSProperties, type ReactNode } from 'react';

export type TabMount = 'eager' | 'lazy' | 'unmount';

export interface TabPanelProps {
  /** Is this the active tab right now? */
  active: boolean;
  /** Mount strategy. Default 'eager'. */
  mount?: TabMount;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// Kept mounted but taken out of flow and hidden — deliberately NOT
// display:none, which drops the node from layout and forces CodeMirror /
// datatable content to re-measure on the next reveal.
const OFF_FLOW: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: 0,
  overflow: 'hidden',
  visibility: 'hidden',
  pointerEvents: 'none',
};

export function TabPanel({ active, mount = 'eager', className, style, children }: TabPanelProps) {
  // 'lazy' latches: once revealed it stays mounted, so re-reveals are instant.
  const revealed = useRef(false);
  if (active) revealed.current = true;

  if (mount === 'unmount' && !active) return null;
  if (mount === 'lazy' && !revealed.current) return null;

  // Outer wrapper stays in flow and establishes the positioning context, so
  // the hidden inner body lays out at the true container width.
  return (
    <div style={{ position: 'relative' }}>
      <div className={className} style={active ? style : { ...style, ...OFF_FLOW }}>
        {children}
      </div>
    </div>
  );
}
