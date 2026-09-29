/** Map-side panel: a non-modal dock (Mantine Drawer) or a float card
 *  (Affix + Paper + Transition), sharing one controlled open state, a
 *  close button, a headerActions slot, and a collapse-to-pill toggle. */

import React, { useRef, useState } from 'react';
import {
  ActionIcon,
  Affix,
  Box,
  CloseButton,
  Drawer,
  Group,
  Paper,
  Portal,
  Transition,
  UnstyledButton,
  type AffixProps,
  type DrawerRootProps,
  type MantineTransition,
} from '@mantine/core';

import { useFooterHeight } from '../hooks/useFooterHeight';
import { useIsMobile } from '../hooks/useIsMobile';
import { uiText } from './i18n';
import { IconAngleDown, IconAngleUp } from './icons';

interface MapPanelBase {
  opened: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Dock width or float card width. */
  size?: number | string;
  /** The pill shown when closed. The consumer owns its label and icon. */
  collapsedControl?: React.ReactNode;
  /** Controls rendered before the close button (Help button, extra icons). */
  headerActions?: React.ReactNode;
  /** Header background (a Mantine colour like `"warning.5"`). Omit for the plain header. */
  headerColor?: string;
  /** `"off"` keeps the desktop form on a phone. */
  mobile?: 'auto' | 'off';
  children?: React.ReactNode;
}

export interface DockMapPanelProps extends MapPanelBase {
  variant?: 'dock';
  /** Drawer edge. Every current dock consumer sits on the right. */
  position?: DrawerRootProps['position'];
  /** Inset from the viewport top, to clear the app topbar. Defaults to the 50px viewer topbar. */
  offsetTop?: number | string;
  /** Inset from the viewport bottom, to clear the app footer. Defaults to the measured viewer footer. */
  offsetBottom?: number | string;
}

export interface FloatMapPanelProps extends MapPanelBase {
  variant: 'float';
  /** Affix anchor on the map edge. Defaults below the topbar on the right. */
  affixPosition?: AffixProps['position'];
  /** Slide direction. */
  transition?: MantineTransition;
  /** Space kept free under the card, to clear the app footer. Defaults to the measured viewer footer. */
  offsetBottom?: number;
}

export type MapPanelProps = DockMapPanelProps | FloatMapPanelProps;

const TOPBAR = 50;
const SHEET_STOPS = [0.3, 0.55, 0.85];
const SHEET_MIN = 80;
const TAP_SLOP = 5;
const PILL_LIFT = 68;
const PANEL_Z = 200;

/** The closed pill on a phone: bottom centre, above the map attribution row. */
function MobilePill({ offsetBottom, children }: { offsetBottom: number; children: React.ReactNode }) {
  return (
    <Portal>
      <Box
        className="ads-mappanel-pill ads-mappanel-pill--mobile"
        style={{ bottom: offsetBottom + PILL_LIFT, zIndex: PANEL_Z }}
      >
        {children}
      </Box>
    </Portal>
  );
}

interface SheetProps {
  title?: React.ReactNode;
  headerColor?: string;
  headerActions?: React.ReactNode;
  onClose: () => void;
  offsetBottom: number;
  children?: React.ReactNode;
}

/** The phone form of the float card: a bottom sheet with a peek, a half, and a full stop. */
function MapPanelSheet({ title, headerColor, headerActions, onClose, offsetBottom, children }: SheetProps) {
  const [stop, setStop] = useState(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const maxPx = () => window.innerHeight - TOPBAR - offsetBottom;
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
      : `min(${SHEET_STOPS[stop] * 100}dvh, calc(100dvh - ${TOPBAR + offsetBottom}px))`;

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
          zIndex: PANEL_Z,
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
      </Paper>
    </Portal>
  );
}

export function MapPanel(props: MapPanelProps) {
  const { opened, onClose, title, size, collapsedControl, headerActions, headerColor, mobile = 'auto', children } =
    props;
  const isMobile = useIsMobile() && mobile !== 'off';
  const footerHeight = useFooterHeight();
  const pill = opened ? null : collapsedControl;
  const closeLabel = uiText('mappanel.close', 'Close');
  const roundedTop = headerColor
    ? { borderTopLeftRadius: 'var(--mantine-radius-md)', borderTopRightRadius: 'var(--mantine-radius-md)' }
    : undefined;

  if (props.variant === 'float') {
    const { affixPosition = { top: 58, right: 16 }, transition = 'slide-left' } = props;
    const offsetBottom = props.offsetBottom ?? footerHeight;
    const affixTop = typeof affixPosition.top === 'number' ? affixPosition.top : 58;

    if (isMobile) {
      return (
        <>
          {pill && <MobilePill offsetBottom={offsetBottom}>{pill}</MobilePill>}
          {opened && (
            <MapPanelSheet
              title={title}
              headerColor={headerColor}
              headerActions={headerActions}
              onClose={onClose}
              offsetBottom={offsetBottom}
            >
              {children}
            </MapPanelSheet>
          )}
        </>
      );
    }

    return (
      <>
        {pill && (
          <Affix position={affixPosition}>
            <div className="ads-mappanel-pill">{pill}</div>
          </Affix>
        )}
        <Affix position={affixPosition}>
          <Transition mounted={opened} transition={transition}>
            {(styles) => (
              <Paper style={{ ...styles, width: size, maxWidth: 'calc(100vw - 32px)' }} shadow="md" radius="md" withBorder>
                <Box pos="relative" p="xs" bg={headerColor} style={roundedTop}>
                  <Box fw={600} fz="sm" ta="center" px={48}>
                    {title}
                  </Box>
                  <Group
                    gap={4}
                    wrap="nowrap"
                    style={{ position: 'absolute', top: 0, bottom: 0, right: 'var(--mantine-spacing-xs)', alignItems: 'center' }}
                  >
                    {headerActions}
                    <CloseButton onClick={onClose} aria-label={closeLabel} />
                  </Group>
                </Box>
                <Box
                  p="sm"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: `calc(100dvh - ${affixTop + 66 + offsetBottom}px)`,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  {children}
                </Box>
              </Paper>
            )}
          </Transition>
        </Affix>
      </>
    );
  }

  const { position = 'right', offsetTop = TOPBAR } = props;
  const offsetBottom = props.offsetBottom ?? footerHeight;
  const toLength = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);
  return (
    <>
      {pill &&
        (isMobile && typeof offsetBottom === 'number' ? (
          <MobilePill offsetBottom={offsetBottom}>{pill}</MobilePill>
        ) : (
          pill
        ))}
      <Drawer.Root
        opened={opened}
        onClose={onClose}
        position={position}
        size={size}
        trapFocus={false}
        closeOnClickOutside={false}
        lockScroll={false}
        returnFocus
        styles={{ inner: { top: toLength(offsetTop), bottom: toLength(offsetBottom) } }}
      >
        <Drawer.Content>
          <Drawer.Header bg={headerColor}>
            <Drawer.Title>{title}</Drawer.Title>
            <Group gap={4} wrap="nowrap">
              {headerActions}
              <Drawer.CloseButton aria-label={closeLabel} />
            </Group>
          </Drawer.Header>
          <Drawer.Body>{children}</Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>
    </>
  );
}
