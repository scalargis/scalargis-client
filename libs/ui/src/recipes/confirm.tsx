/* =====================================================================
   confirm — replaces PrimeReact's ConfirmDialog (34 sites) and
   ConfirmPopup (4 sites).

   Two presentations, because Prime has two and they are not
   interchangeable:

   - `confirm({...})`   imperative, centred modal. Drop-in for
                        confirmDialog({message, header, accept, reject}).
   - `<ConfirmPopover>` declarative, anchored to its trigger. Prime's
                        confirmPopup() is imperative because it takes a
                        DOM `target`; a React trigger wrapper gets the
                        same anchoring without the ref plumbing, and
                        focus-return comes for free.

   Accessibility bar: both trap focus, close on Esc, and return
   focus to the trigger. Neither signals severity by colour alone — a
   destructive action carries an icon and an explicit verb, not just red.
   ===================================================================== */

import React, { useState } from 'react';
import { Box, Button, Group, Popover, Text } from '@mantine/core';
import { modals } from '@mantine/modals';

import { IconAlertTriangle, IconInfoCircle } from './icons';
import { uiText } from './i18n';

export type ConfirmSeverity = 'primary' | 'warning' | 'danger';

/** Severity → the ADS palette the accept button fills with. */
const ACCEPT_COLOR: Record<ConfirmSeverity, string> = {
  primary: 'primary',
  warning: 'warning',
  danger: 'danger',
};

function severityIcon(severity: ConfirmSeverity) {
  return severity === 'primary' ? <IconInfoCircle /> : <IconAlertTriangle />;
}

export interface ConfirmOptions {
  message: React.ReactNode;
  /** Modal title. Omitted → an untitled dialog, as Prime allows. */
  header?: React.ReactNode;
  severity?: ConfirmSeverity;
  /** Replaces the severity icon next to the message. */
  icon?: React.ReactNode;
  acceptLabel?: string;
  rejectLabel?: string;
  /** Runs when the user accepts. */
  accept?: () => void;
  /**
   * Runs when the user presses the reject button — NOT on an Esc or
   * backdrop dismiss. This is Prime's `reject` contract, and call sites
   * depend on it: `reject` typically raises a "cancelled" toast, which
   * must not fire because someone tapped Esc.
   */
  reject?: () => void;
  /** Runs on every close, whichever button (or Esc) caused it. */
  onHide?: () => void;
  /**
   * Overrides the modal z-index. Defaults to the ADS dialog rung (6000);
   * raise it (e.g. 6100) so a confirm clears an already-open Dialog.
   */
  zIndex?: number;
}

/**
 * Imperative confirmation modal. Returns the modal id so a caller can close
 * it programmatically (e.g. after an async action started elsewhere).
 */
export function confirm({
  message,
  header,
  severity = 'primary',
  icon,
  // Default params re-evaluate per call, so these follow the app language.
  // Yes/No, not OK/Cancel: Prime's confirmDialog falls back to
  // localeOption('accept'/'reject') — en Yes/No, pt Sim/Não — and call
  // sites that rely on the defaults must not change wording mid-migration.
  acceptLabel = uiText('confirm.yes', 'Yes'),
  rejectLabel = uiText('confirm.no', 'No'),
  accept,
  reject,
  onHide,
  zIndex,
}: ConfirmOptions): string {
  return modals.openConfirmModal({
    ...(zIndex != null ? { zIndex } : {}),
    title: header,
    // The icon rides with the message rather than the header, so severity
    // survives when `header` is omitted and reads in DOM order for a
    // screen reader. Decorative: the verb on the accept button carries
    // the meaning (WCAG 1.4.1), not the colour or the glyph.
    children: (
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Box c={icon ? undefined : ACCEPT_COLOR[severity]} fz="lg" mt={2} aria-hidden>
          {icon ?? severityIcon(severity)}
        </Box>
        <Text size="sm">{message}</Text>
      </Group>
    ),
    labels: { confirm: acceptLabel, cancel: rejectLabel },
    confirmProps: { color: ACCEPT_COLOR[severity] },
    cancelProps: { variant: 'subtle' },
    // @mantine/modals fires onCancel only from the cancel button, and
    // onClose from every close path (accept included) — which lines up
    // with Prime's reject/onHide split exactly.
    onConfirm: accept,
    onCancel: reject,
    onClose: onHide,
  });
}

export interface ConfirmPopoverProps
  extends Pick<ConfirmOptions, 'message' | 'severity' | 'acceptLabel' | 'rejectLabel'> {
  /** The trigger. Must forward its ref and props (any Mantine control does). */
  children: React.ReactElement;
  /** Runs when the user accepts. */
  onConfirm?: () => void;
  /** Runs on the reject button only — not on Esc or an outside click. */
  onReject?: () => void;
  width?: number | string;
  position?: React.ComponentProps<typeof Popover>['position'];
  /** Accessible name for the popover, since it has no visible title. */
  'aria-label'?: string;
}

/**
 * Anchored confirmation, the ConfirmPopup twin. Wraps its trigger:
 *
 *   <ConfirmPopover message="Delete this record?" severity="danger"
 *                   acceptLabel="Yes" rejectLabel="No" onConfirm={del}>
 *     <Button color="danger">Delete</Button>
 *   </ConfirmPopover>
 */
export function ConfirmPopover({
  children,
  message,
  severity = 'primary',
  acceptLabel = uiText('confirm.yes', 'Yes'),
  rejectLabel = uiText('confirm.no', 'No'),
  onConfirm,
  onReject,
  width = 300,
  position = 'bottom',
  'aria-label': ariaLabel = uiText('confirm.title', 'Confirmation'),
}: ConfirmPopoverProps) {
  const [opened, setOpened] = useState(false);

  const close = () => setOpened(false);

  // Popover.Target injects a ref and positioning props; we add the toggle and
  // the aria wiring on top without clobbering an onClick the caller supplied.
  const trigger = children as React.ReactElement<
    React.HTMLAttributes<HTMLElement>
  >;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position={position}
      width={width}
      shadow="md"
      withArrow
      trapFocus
      closeOnEscape
      closeOnClickOutside
      returnFocus
    >
      <Popover.Target>
        {React.cloneElement(trigger, {
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            trigger.props.onClick?.(event);
            setOpened((o) => !o);
          },
          'aria-haspopup': 'dialog',
          'aria-expanded': opened,
        })}
      </Popover.Target>

      <Popover.Dropdown role="dialog" aria-label={ariaLabel}>
        <Group gap="sm" wrap="nowrap" align="flex-start" mb="sm">
          <Box c={ACCEPT_COLOR[severity]} fz="lg" mt={2} aria-hidden>
            {severityIcon(severity)}
          </Box>
          <Text size="sm">{message}</Text>
        </Group>
        <Group gap="xs" justify="flex-end">
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              onReject?.();
              close();
            }}
          >
            {rejectLabel}
          </Button>
          <Button
            size="sm"
            color={ACCEPT_COLOR[severity]}
            onClick={() => {
              onConfirm?.();
              close();
            }}
          >
            {acceptLabel}
          </Button>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}
