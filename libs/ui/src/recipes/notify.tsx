/* =====================================================================
   notify — the Toast replacement.

   Prime's Toast is ref-based: every screen declares <Toast ref={t} /> and
   calls t.current.show({severity, summary, detail}). That pattern dies
   here — <Notifications /> is mounted once in AdsProviders, so `notify`
   is importable from anywhere with no ref, no mount, no prop drilling.

   Accessibility bar: Mantine's Notifications root is the live
   region, so a toast announces without stealing focus. Severity is never
   signalled by colour alone (WCAG 1.4.1) — each level carries an icon and
   a title. `warn` fills with the light ADS amber, so its content is dark
   by contract.
   ===================================================================== */

import React from 'react';
import { notifications } from '@mantine/notifications';
import type { NotificationData } from '@mantine/notifications';

import {
  IconAlertTriangle,
  IconCheckCircle,
  IconInfoCircle,
  IconXCircle,
} from './icons';
import { uiText } from './i18n';

export type NotifySeverity = 'success' | 'info' | 'warn' | 'error';

/** Severity → ADS foundation palette. These palettes are immutable.
 *  Titles resolve through uiText at call time so they follow the language. */
const SEVERITY: Record<
  NotifySeverity,
  { color: string; icon: React.ReactNode; titleKey: string; titleFallback: string }
> = {
  success: { color: 'success', icon: <IconCheckCircle />, titleKey: 'notify.success', titleFallback: 'Success' },
  info: { color: 'informative', icon: <IconInfoCircle />, titleKey: 'notify.info', titleFallback: 'Info' },
  warn: { color: 'warning', icon: <IconAlertTriangle />, titleKey: 'notify.warn', titleFallback: 'Warning' },
  error: { color: 'danger', icon: <IconXCircle />, titleKey: 'notify.error', titleFallback: 'Error' },
};

export interface NotifyOptions
  extends Omit<NotificationData, 'message' | 'color' | 'autoClose'> {
  /** Milliseconds before auto-dismiss. There is no opt-out — see below. */
  autoClose?: number;
}

/** How long a toast stays up. EVERY toast auto-dismisses, at every severity —
 *  Prime's Toast did (life 3000 across the board) and the migrated call sites
 *  expect it; errors and warnings just get longer to read.
 *
 *  A sticky toast is not on offer: `autoClose: false` is off the type AND
 *  discarded at runtime below, because errors that never leave the screen are
 *  what the Phase-3 smoke found (D33) and a type alone would not have stopped
 *  the next call site from reintroducing it. A message that truly demands an
 *  action wants a dialog, not a toast — `notify.show` remains the escape hatch
 *  into Mantine's raw API for anything genuinely exceptional. */
const DEFAULT_AUTO_CLOSE: Record<NotifySeverity, number> = {
  success: 3000,
  info: 3000,
  warn: 5000,
  error: 5000,
};

function show(
  severity: NotifySeverity,
  summary: React.ReactNode,
  detail?: React.ReactNode,
  options: NotifyOptions = {}
) {
  const { color, icon, titleKey, titleFallback } = SEVERITY[severity];

  // Prime's call shape is show({summary, detail}) with detail optional. Keep
  // that: notify.error('Save failed') must not render an empty message body.
  const hasDetail = detail !== undefined && detail !== null && detail !== '';
  const title = hasDetail ? summary : undefined;
  const message = hasDetail ? detail : summary ?? uiText(titleKey, titleFallback);

  // autoClose is resolved AFTER the spread, so a stray `false` (from JS, or
  // from a `any`-typed options bag) cannot bring the sticky toast back.
  const autoClose =
    typeof options.autoClose === 'number'
      ? options.autoClose
      : DEFAULT_AUTO_CLOSE[severity];

  return notifications.show({
    color,
    icon,
    title,
    message,
    withBorder: true,
    ...options,
    autoClose,
  });
}

export const notify = {
  success: (summary: React.ReactNode, detail?: React.ReactNode, o?: NotifyOptions) =>
    show('success', summary, detail, o),
  info: (summary: React.ReactNode, detail?: React.ReactNode, o?: NotifyOptions) =>
    show('info', summary, detail, o),
  warn: (summary: React.ReactNode, detail?: React.ReactNode, o?: NotifyOptions) =>
    show('warn', summary, detail, o),
  error: (summary: React.ReactNode, detail?: React.ReactNode, o?: NotifyOptions) =>
    show('error', summary, detail, o),

  /** Escape hatch for the rare call that needs a non-standard severity/colour. */
  show: notifications.show,
  hide: notifications.hide,
  clean: notifications.clean,
};
