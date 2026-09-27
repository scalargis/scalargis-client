/** Prime <Dialog> twin: a Modal.Root with maximize, a pinned footer, and
 *  drag-by-header plus corner-resize while windowed. */

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

const MIN_DIALOG_W = 240;
const MIN_DIALOG_H = 160;
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
  /** false = non-modal: no backdrop, page behind stays interactive. */
  withOverlay?: boolean;
  /** Initial placement. 'top-left' and 'top-right' anchor to that viewport corner (Prime's position prop); default centred. */
  position?: 'center' | 'top-left' | 'top-right';
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
  position,
  ...rootProps
}: DialogProps) {
  const theme = useMantineTheme();
  const isMobile = useIsMobile();
  const [maximized, setMaximized] = useState(false);

  const corner = position === 'top-left' || position === 'top-right';
  const cornerBase = corner
    ? { justifyContent: position === 'top-right' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }
    : undefined;

  const resolvedSize = sizeProp ?? (isMobile ? '90%' : DIALOG_DESKTOP_SIZE);

  // Centred-model drag: a translate on the Modal's `inner` centring wrapper.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number; anchored: boolean } | null>(null);

  // Anchored model after a corner-resize: `box` is the dialog's absolute
  // top-left plus size. Position and size are one atom so the structure switch
  // (flex-start/padding 0) and the anchoring translate cannot land in separate
  // frames. A fresh open drops it and returns to the centred model.
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const resize = useRef<{
    startX: number;
    startY: number;
    baseW: number;
    baseH: number;
    baseX: number;
    baseY: number;
  } | null>(null);

  useEffect(() => {
    if (opened) {
      setOffset({ x: 0, y: 0 });
      setBox(null);
    }
  }, [opened]);

  // Pointer capture keeps the drag/resize alive over a body iframe (StreetView).
  const onHeaderPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (maximized) return;
      if ((e.target as HTMLElement).closest('button')) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = box
        ? { startX: e.clientX, startY: e.clientY, baseX: box.x, baseY: box.y, anchored: true }
        : { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y, anchored: false };
    },
    [maximized, box, offset.x, offset.y]
  );

  const onHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const x = d.baseX + (e.clientX - d.startX);
    const y = d.baseY + (e.clientY - d.startY);
    if (d.anchored) setBox((b) => (b ? { ...b, x, y } : b));
    else setOffset({ x, y });
  }, []);

  const onHeaderPointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  // Seed `box` from the live rect so the dialog stays put as it leaves the
  // centred model; the rect already reflects any drag translate.
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (maximized) return;
      const node = contentRef.current;
      if (!node) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const rect = node.getBoundingClientRect();
      setBox({ x: rect.left, y: rect.top, w: rect.width, h: rect.height });
      resize.current = {
        startX: e.clientX,
        startY: e.clientY,
        baseW: rect.width,
        baseH: rect.height,
        baseX: rect.left,
        baseY: rect.top,
      };
    },
    [maximized]
  );

  // Top-left frozen, so only w/h grow — bottom/right move.
  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    const r = resize.current;
    if (!r) return;
    const w = Math.min(window.innerWidth - 16, Math.max(MIN_DIALOG_W, r.baseW + (e.clientX - r.startX)));
    const h = Math.min(window.innerHeight - 16, Math.max(MIN_DIALOG_H, r.baseH + (e.clientY - r.startY)));
    setBox({ x: r.baseX, y: r.baseY, w, h });
  }, []);

  const onResizePointerUp = useCallback(() => {
    resize.current = null;
  }, []);

  // Modal.Root skips the theme's Modal defaultProps, so restate the ADS rung.
  const z = zIndex ?? theme.other?.zLadder?.dialog ?? DIALOG_DEFAULTS.zIndex;

  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered={corner ? false : centered}
      zIndex={z}
      size={resolvedSize}
      fullScreen={maximized}
      transitionProps={DIALOG_DEFAULTS.transitionProps}
      {...rootProps}
    >
      {withOverlay && <Modal.Overlay />}
      {/* Slot styles, never the plain `style` prop: Modal.Content copies
          `style`/`className` onto BOTH content and inner, and the inner is the
          flex ROW that centres the dialog. The position transform rides
          `styles.inner`, not the content, whose Mantine "pop" transform would
          override it. `h` is a Box prop and reaches the content alone. */}
      <Modal.Content
        ref={contentRef}
        pos="relative"
        h={maximized ? undefined : (box?.h ?? height)}
        classNames={{ content: 'ads-dialog__content' }}
        styles={{
          // Width is flex-basis: the content is a flex item whose main size is
          // `flex: 0 0 var(--modal-size)`, so a plain width is ignored.
          content:
            box && !maximized
              ? { flex: `0 0 ${box.w}px`, maxWidth: 'none', maxHeight: 'none' }
              : undefined,
          // Centred: translate by the drag offset. Anchored (`box`): drop the
          // centring AND the inner padding, so `box.x/y` is the absolute
          // top-left (padding left in would double-count the translate). The
          // grip then moves only bottom/right. `transition: none` keeps the
          // transform out of any CSS transition — under prefers-reduced-motion
          // the platform kill rule (ads-globals.css) sets
          // `transition-duration: 0.01ms !important` with `transition-property`
          // left at `all`, so a none→translate change flashed the dialog at the
          // viewport origin for one frame.
          inner: maximized
            ? undefined
            : box
              ? {
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  padding: 0,
                  transform: `translate(${box.x}px, ${box.y}px)`,
                  transition: 'none',
                }
              : offset.x === 0 && offset.y === 0
                ? cornerBase
                : { ...cornerBase, transform: `translate(${offset.x}px, ${offset.y}px)`, transition: 'none' },
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
        {/* paddingTop restores the focus-ring room Mantine zeroes when the body
            has a sibling (the Header). */}
        <Modal.Body style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingTop: '0.5rem' }}>
          {children}
        </Modal.Body>
        {footer && <Box className="ads-dialog__footer">{footer}</Box>}
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
