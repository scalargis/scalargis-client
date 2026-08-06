/* =====================================================================
   Dialog — the Prime <Dialog> twin for windowed content.

   A raw Mantine Modal covers the plain title+body dialogs (the whole
   backoffice converted on it). The viewer's dialogs carry two extras
   Modal's flat API cannot express:

   - `maximizable` — a header control that toggles full-screen, which
     Prime's Dialog offered and the help/results/document windows use;
   - `footer` — an action bar OUTSIDE the scroll region, pinned to the
     dialog's bottom edge.

   Both require the Modal.Root composition; this recipe owns that
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

import { IconWindowMaximize, IconWindowMinimize } from './icons';
import { uiText } from './i18n';

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
  centered = true,
  zIndex,
  withOverlay = true,
  ...rootProps
}: DialogProps) {
  const theme = useMantineTheme();
  const [maximized, setMaximized] = useState(false);

  // Drag-by-header — Prime's <Dialog> was draggable by default; the Modal.Root
  // is not, so every consumer (StreetView, help, results, documents) lost it.
  // Restored centrally here (C-21). The offset is applied as a translate on the
  // Modal's `inner` centring wrapper (see the note at Modal.Content below for
  // why not the content node); dragging is disabled while maximized.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Every fresh open re-centres.
  useEffect(() => {
    if (opened) setOffset({ x: 0, y: 0 });
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

  // Modal.Root does not inherit the theme's `Modal` defaultProps (they only
  // apply to the compound component), so the ADS dialog rung is restated here.
  const z = zIndex ?? theme.other?.zLadder?.dialog ?? 6000;

  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered={centered}
      zIndex={z}
      fullScreen={maximized}
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
        h={maximized ? undefined : height}
        classNames={{ content: 'ads-dialog__content' }}
        styles={{
          inner:
            maximized || (offset.x === 0 && offset.y === 0)
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
      </Modal.Content>
    </Modal.Root>
  );
}
