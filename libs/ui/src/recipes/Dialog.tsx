/* =====================================================================
   Dialog — the Prime <Dialog> twin for windowed content.

   A raw Mantine Modal covers the plain title+body dialogs (the whole
   backoffice converted on it). The viewer's dialogs carry extras Modal's
   flat API cannot express:

   - `maximizable` — a header control that toggles full-screen, which
     Prime's Dialog offered and the help/results/document windows use;
   - `footer` — an action bar OUTSIDE the scroll region, pinned to the
     dialog's bottom edge;
   - drag-by-header and corner-resize while windowed (C-21/C-29), which
     Prime's Dialog gave for free and the Modal.Root composition drops.

   These require the Modal.Root composition; this recipe owns that
   boilerplate so call sites stay a prop-rename away from the old Prime
   markup. The content column is a flex layout with the body as the
   scrolling `flex: 1` cell, so percentage/`100%`-height children
   (iframes, embedded panoramas) track the dialog size with no resize
   listeners — the machinery Prime call sites hand-rolled with
   onShow/onResize/onMaximize handlers becomes CSS.
   ===================================================================== */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Box,
  Group,
  Modal,
  useMantineTheme,
  type ModalRootProps,
} from '@mantine/core';

import { useIsMobile } from '../hooks/useIsMobile';
import { DIALOG_DEFAULTS } from './dialogDefaults';
import { IconWindowMaximize, IconWindowMinimize } from './icons';
import { uiText } from './i18n';

// Floor for corner-resize so the dialog can never be dragged to nothing.
const MIN_DIALOG_W = 240;
const MIN_DIALOG_H = 160;

// Desktop width when the caller passes no `size`. Below the ADS md
// breakpoint the dialog collapses to 90% instead (see the size default in
// the component). A caller `size` overrides both. Tunable — it is on
// Miguel's end visual walkthrough list.
const DIALOG_DESKTOP_SIZE = '35vw';

export interface DialogProps extends Omit<ModalRootProps, 'title'> {
  /** Header title (Prime's `header`). */
  title?: React.ReactNode;
  /** Action bar pinned below the scrollable body (Prime's `footer`). */
  footer?: React.ReactNode;
  /** Render the maximize/restore header control. */
  maximizable?: boolean;
  /** Fixed content height while windowed, e.g. '80vh'. Body scrolls inside. */
  height?: number | string;
  /**
   * false = non-modal (Prime's `modal={false}`): no backdrop, page behind
   * stays interactive. Pair with `closeOnClickOutside={false}` and
   * `trapFocus={false}`/`lockScroll={false}` as the call site needs.
   */
  withOverlay?: boolean;
}

export function Dialog({
  title,
  footer,
  maximizable = false,
  height,
  children,
  opened,
  onClose,
  centered = DIALOG_DEFAULTS.centered,
  zIndex,
  size: sizeProp,
  withOverlay = true,
  ...rootProps
}: DialogProps) {
  const theme = useMantineTheme();
  const isMobile = useIsMobile();
  const [maximized, setMaximized] = useState(false);

  // Responsive `size` default (P0a): a caller `size` wins; with none, the
  // dialog is 90% wide below the md breakpoint and DIALOG_DESKTOP_SIZE above,
  // so call sites can drop the `size={isMobile ? '90%' : 'Nvw'}` ternary.
  // (Named sizeProp — `size` below is the corner-resize width state.)
  const resolvedSize = sizeProp ?? (isMobile ? '90%' : DIALOG_DESKTOP_SIZE);

  // Drag-by-header — Prime's <Dialog> was draggable by default; the Modal.Root
  // is not, so every consumer (StreetView, help, results, documents) lost it.
  // Restored centrally here (C-21). The offset is applied as a translate on the
  // Modal's `inner` centring wrapper (see the note at Modal.Content below for
  // why not the content node); dragging is disabled while maximized.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Resize-by-corner (C-29) — Prime's <Dialog> could be resized; Modal cannot.
  // A grip in the bottom-right corner drags the windowed dialog's width/height.
  // Only the bottom and right edges may move: on resize start we anchor the
  // dialog by its current top-left (measured from the live rect), switching the
  // centring `inner` to top-left alignment, so from then on the offset IS the
  // absolute top-left position and growing w/h leaves top-left untouched — no
  // centre-compensation guessing. Once resized the dialog stays top-left
  // anchored (drag keeps working as an absolute move); a fresh open drops the
  // manual size and returns to the centred model. Disabled while maximized.
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const resize = useRef<{
    startX: number;
    startY: number;
    baseW: number;
    baseH: number;
  } | null>(null);

  // Every fresh open re-centres and drops any manual resize.
  useEffect(() => {
    if (opened) {
      setOffset({ x: 0, y: 0 });
      setSize(null);
    }
  }, [opened]);

  // Capture the pointer on the header so the drag survives the dialog body's
  // iframe (StreetView's Google pano) stealing pointermove; the browser releases
  // the capture on pointerup. Native text-drag is barred by `userSelect: none`
  // on the header, so there is nothing to preventDefault.
  const onHeaderPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (maximized) return;
      // Let the maximize/close controls click; only the header background drags.
      if ((e.target as HTMLElement).closest('button')) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
    },
    [maximized, offset.x, offset.y]
  );

  const onHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.baseX + (e.clientX - drag.current.startX),
      y: drag.current.baseY + (e.clientY - drag.current.startY),
    });
  }, []);

  const onHeaderPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  // Anchor by the live top-left the instant a resize begins: the rect already
  // reflects any drag translate, so pinning offset to rect.left/top and size to
  // rect.w/h keeps the dialog exactly where it is while switching it out of the
  // centred model. Capture the pointer on the grip so the resize survives the
  // body's iframe, exactly like the drag.
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (maximized) return;
      const node = contentRef.current;
      if (!node) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const rect = node.getBoundingClientRect();
      setOffset({ x: rect.left, y: rect.top });
      setSize({ w: rect.width, h: rect.height });
      resize.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseW: rect.width,
        baseH: rect.height,
      };
    },
    [maximized]
  );

  // Top-left is anchored (offset frozen), so only w/h grow — bottom/right move.
  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    const r = resize.current;
    if (!r) return;
    const w = Math.min(window.innerWidth - 16, Math.max(MIN_DIALOG_W, r.baseW + (e.clientX - r.startX)));
    const h = Math.min(window.innerHeight - 16, Math.max(MIN_DIALOG_H, r.baseH + (e.clientY - r.startY)));
    setSize({ w, h });
  }, []);

  const onResizePointerUp = useCallback(() => {
    resize.current = null;
  }, []);

  // Modal.Root does not inherit the theme's `Modal` defaultProps (they only
  // apply to the compound component), so the ADS dialog rung comes from the
  // shared DIALOG_DEFAULTS (also read by AdsProviders' ModalsProvider, so
  // the two can't drift — R4). The theme's zLadder still wins when present;
  // DIALOG_DEFAULTS.zIndex is the literal floor. Stated before {...rootProps}
  // so a call site can still override.
  const z = zIndex ?? theme.other?.zLadder?.dialog ?? DIALOG_DEFAULTS.zIndex;

  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered={centered}
      zIndex={z}
      size={resolvedSize}
      fullScreen={maximized}
      transitionProps={DIALOG_DEFAULTS.transitionProps}
      {...rootProps}
    >
      {withOverlay && <Modal.Overlay />}
      {/* The flex column MUST ride a per-slot class, never the plain `style`
          prop: Mantine's ModalContent hands the same `style`/`className` to
          BOTH the content and the inner wrapper, and the inner is the flex ROW
          that centres the dialog. Turning it into a column makes the content's
          `flex: 0 0 var(--modal-size)` a HEIGHT basis, so the dialog collapses
          to shrink-to-fit width, maximize only grows downward, and the body
          never distributes height (blank StreetView pano). `h` is a Box style
          prop and reaches the content alone, so it is safe. */}
      {/* The offset rides the per-slot `styles.inner`, NOT `styles.content`:
          the content node carries Mantine's "pop" open transition, whose inline
          `transform: scale()` overrides any transform we put there (the dialog
          stops moving). The `inner` slot is the full-viewport centring wrapper,
          is not animated, and translating it shifts the centred dialog with it.
          Per-slot `styles`, never the plain `style` prop, which Modal.Content
          copies onto both content and inner. */}
      <Modal.Content
        ref={contentRef}
        pos="relative"
        h={maximized ? undefined : (size?.h ?? height)}
        classNames={{ content: 'ads-dialog__content' }}
        styles={{
          // Width lives on flex-basis: the content is a flex item in the
          // centring row, where `flex: 0 0 var(--modal-size)` owns the main
          // (horizontal) size, so a plain `width`/`w` is ignored. When resized,
          // override the basis to the manual width and lift the size caps.
          content:
            size && !maximized
              ? { flex: `0 0 ${size.w}px`, maxWidth: 'none', maxHeight: 'none' }
              : undefined,
          // Centred model (no manual size): translate the centred dialog by the
          // drag offset. Anchored model (after a resize, `size` set): drop the
          // centring AND the inner padding so `inner`'s top-left is the true
          // viewport origin and the offset is the dialog's absolute top-left —
          // without zeroing the padding, translate(rect.left) double-counts it
          // and the dialog jumps on the first click. Growing w/h then moves
          // only the bottom/right edges. Maximized: neither.
          inner: maximized
            ? undefined
            : size
              ? {
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  padding: 0,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }
              : offset.x === 0 && offset.y === 0
                ? undefined
                : { transform: `translate(${offset.x}px, ${offset.y}px)` },
        }}
      >
        <Modal.Header
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          style={
            maximized
              ? undefined
              : { cursor: 'move', touchAction: 'none', userSelect: 'none' }
          }
        >
          <Modal.Title>{title}</Modal.Title>
          <Group gap={4} wrap="nowrap">
            {maximizable && (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                onClick={() => setMaximized((m) => !m)}
                aria-label={
                  maximized
                    ? uiText('dialog.restore', 'Restore')
                    : uiText('dialog.maximize', 'Maximize')
                }
              >
                {maximized ? <IconWindowMinimize /> : <IconWindowMaximize />}
              </ActionIcon>
            )}
            <Modal.CloseButton aria-label={uiText('dialog.close', 'Close')} />
          </Group>
        </Modal.Header>
        {/* minHeight 0 lets the body actually shrink and scroll in a flex
            column; without it long content stretches the dialog offscreen. */}
        <Modal.Body style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {children}
        </Modal.Body>
        {footer && <Box className="ads-dialog__footer">{footer}</Box>}
        {/* Corner resize grip (C-29). Absolute in the content box (hence
            pos="relative" above); captures the pointer so the resize survives
            the body iframe. Hidden while maximized. */}
        {!maximized && (
          <Box
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-hidden
            style={{
              position: 'absolute',
              right: 2,
              bottom: 2,
              width: 16,
              height: 16,
              cursor: 'nwse-resize',
              touchAction: 'none',
              zIndex: 3,
              background:
                'repeating-linear-gradient(-45deg, var(--mantine-color-gray-5) 0 1.5px, transparent 1.5px 4px)',
            }}
          />
        )}
      </Modal.Content>
    </Modal.Root>
  );
}
