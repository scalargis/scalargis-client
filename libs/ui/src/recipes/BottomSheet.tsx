/** Phone bottom sheet with three height stops, shared by MapPanel and Dialog. */

import React, { useRef, useState } from 'react';
import { ActionIcon, Box, CloseButton, Group, Paper, Portal, UnstyledButton } from '@mantine/core';
import { useWindowEvent } from '@mantine/hooks';

import { uiText } from './i18n';
import { IconAngleDown, IconAngleUp } from './icons';

export const SHEET_TOPBAR = 50;
export const SHEET_STOPS = [0.3, 0.55, 0.85];
const SHEET_MIN = 80;
const TAP_SLOP = 5;

export interface BottomSheetProps {
  title?: React.ReactNode;
  /** Header background (a Mantine colour like `"warning.5"`). */
  headerColor?: string;
  /** Controls rendered before the close button. */
  headerActions?: React.ReactNode;
  onClose: () => void;
  /** Space kept free under the sheet, to clear the app footer. */
  offsetBottom: number;
  /** Action bar pinned below the scrolling body. */
  footer?: React.ReactNode;
  zIndex: number;
  /** Index into the 30, 55, and 85 percent stops. */
  initialStop?: number;
  /** Close on the Escape key. */
  closeOnEscape?: boolean;
  children?: React.ReactNode;
}

/** A sheet on the bottom edge: drag or tap the grip to move between the stops. */
export function BottomSheet({
  title,
  headerColor,
  headerActions,
  onClose,
  offsetBottom,
  footer,
  zIndex,
  initialStop = 0,
  closeOnEscape = false,
  children,
}: BottomSheetProps) {
  const [stop, setStop] = useState(initialStop);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useWindowEvent('keydown', (e) => {
    if (closeOnEscape && e.key === 'Escape') onClose();
  });

  const maxPx = () => window.innerHeight - SHEET_TOPBAR - offsetBottom;
  const stopPx = (i: number) => Math.min(SHEET_STOPS[i] * window.innerHeight, maxPx());
  const last = SHEET_STOPS.length - 1;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input') && !target.closest('[data-sheet-grip]')) return;
    const startH = sheetRef.current?.getBoundingClientRect().height ?? stopPx(stop);
    drag.current = { startY: e.clientY, startH, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.startY - e.clientY;
    if (!d.moved && Math.abs(dy) <= TAP_SLOP) return;
    d.moved = true;
    setDragHeight(Math.max(SHEET_MIN, Math.min(d.startH + dy, maxPx())));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!d || !d.moved) return;
    const h = sheetRef.current?.getBoundingClientRect().height ?? d.startH;
    let nearest = 0;
    SHEET_STOPS.forEach((_, i) => {
      if (Math.abs(stopPx(i) - h) < Math.abs(stopPx(nearest) - h)) nearest = i;
    });
    suppressClick.current = true;
    setDragHeight(null);
    setStop(nearest);
  };

  const onGripClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setStop((s) => (s + 1) % SHEET_STOPS.length);
  };

  const onGripKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setStop((s) => Math.min(s + 1, last));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setStop((s) => Math.max(s - 1, 0));
    }
  };

  const atTop = stop === last;
  const stepLabel = atTop ? uiText('mappanel.collapse', 'Collapse') : uiText('mappanel.expand', 'Expand');
  const height =
    dragHeight != null
      ? `${dragHeight}px`
      : `min(${SHEET_STOPS[stop] * 100}dvh, calc(100dvh - ${SHEET_TOPBAR + offsetBottom}px))`;

  return (
    <Portal>
      <Paper
        ref={sheetRef}
        className="ads-mappanel-sheet"
        shadow="md"
        withBorder
        role="region"
        aria-label={typeof title === 'string' ? title : undefined}
        data-stop={stop}
        style={{
          bottom: offsetBottom,
          height,
          maxWidth: 'none',
          zIndex,
          transition: dragHeight != null ? 'none' : 'height 200ms ease',
        }}
      >
        <Box
          bg={headerColor}
          className="ads-mappanel-sheet-head"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <UnstyledButton
            data-sheet-grip
            className="ads-mappanel-sheet-grip"
            aria-label={uiText('mappanel.resize', 'Resize panel')}
            onClick={onGripClick}
            onKeyDown={onGripKey}
          />
          <Group justify="space-between" wrap="nowrap" gap={4} px="xs" pb={4}>
            <ActionIcon
              variant="subtle"
              color="dark"
              aria-label={stepLabel}
              onClick={() => setStop(atTop ? 0 : stop + 1)}
            >
              {atTop ? <IconAngleDown /> : <IconAngleUp />}
            </ActionIcon>
            <Box fw={600} fz="sm" className="ads-mappanel-sheet-title">
              {title}
            </Box>
            <Group gap={4} wrap="nowrap">
              {headerActions}
              <CloseButton onClick={onClose} aria-label={uiText('mappanel.close', 'Close')} />
            </Group>
          </Group>
        </Box>
        <Box p="sm" className="ads-mappanel-sheet-body">
          {children}
        </Box>
        {footer && <Box className="ads-dialog__footer">{footer}</Box>}
      </Paper>
    </Portal>
  );
}
