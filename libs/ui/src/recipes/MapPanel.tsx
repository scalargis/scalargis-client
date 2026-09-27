/** Map-side panel: a non-modal dock (Mantine Drawer) or a float card
 *  (Affix + Paper + Transition), sharing one controlled open state, a
 *  close button, a headerActions slot, and a collapse-to-pill toggle. */

import React from 'react';
import {
  Affix,
  Box,
  CloseButton,
  Drawer,
  Group,
  Paper,
  Transition,
  type AffixProps,
  type DrawerRootProps,
  type MantineTransition,
} from '@mantine/core';

import { uiText } from './i18n';

interface MapPanelBase {
  opened: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Dock width or float card width. */
  size?: number | string;
  /** The pill shown when closed. The consumer owns its label, icon, and position. */
  collapsedControl?: React.ReactNode;
  /** Controls rendered before the close button (Help button, extra icons). */
  headerActions?: React.ReactNode;
  /** Header background (a Mantine colour like `"warning.5"`). Omit for the plain header. */
  headerColor?: string;
  children?: React.ReactNode;
}

export interface DockMapPanelProps extends MapPanelBase {
  variant?: 'dock';
  /** Drawer edge. Every current dock consumer sits on the right. */
  position?: DrawerRootProps['position'];
  /** Inset from the viewport top, to clear the app topbar. Defaults to the 50px viewer topbar. */
  offsetTop?: number | string;
  /** Inset from the viewport bottom, to clear the app footer. Defaults to the 50px viewer footer. */
  offsetBottom?: number | string;
}

export interface FloatMapPanelProps extends MapPanelBase {
  variant: 'float';
  /** Affix anchor on the map edge. Defaults below the topbar on the right. */
  affixPosition?: AffixProps['position'];
  /** Slide direction. */
  transition?: MantineTransition;
}

export type MapPanelProps = DockMapPanelProps | FloatMapPanelProps;

export function MapPanel(props: MapPanelProps) {
  const { opened, onClose, title, size, collapsedControl, headerActions, headerColor, children } = props;
  const pill = opened ? null : collapsedControl;
  const closeLabel = uiText('mappanel.close', 'Close');
  const roundedTop = headerColor
    ? { borderTopLeftRadius: 'var(--mantine-radius-md)', borderTopRightRadius: 'var(--mantine-radius-md)' }
    : undefined;

  if (props.variant === 'float') {
    const { affixPosition = { top: 58, right: 16 }, transition = 'slide-left' } = props;
    const affixTop = typeof affixPosition.top === 'number' ? affixPosition.top : 58;
    return (
      <>
        {pill && <Affix position={affixPosition}>{pill}</Affix>}
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
                  style={{ maxHeight: `calc(100vh - ${affixTop + 66}px)`, overflowY: 'auto', overflowX: 'hidden' }}
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

  const { position = 'right', offsetTop = 50, offsetBottom = 50 } = props;
  const toLength = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);
  return (
    <>
      {pill}
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
