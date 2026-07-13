/* =====================================================================
   notify — the Toast replacement (plan §1c; 76 PrimeReact call sites).

   Prime's Toast is ref-based: every screen declares <Toast ref={t} /> and
   calls t.current.show({severity, summary, detail}). That pattern dies
   here — <Notifications /> is mounted once in AdsProviders, so `notify`
   is importable from anywhere with no ref, no mount, no prop drilling.

   Accessibility bar (kit 04): Mantine's Notifications root is the live
   region, so a toast announces without stealing focus. Severity is never
   signalled by colour alone (WCAG 1.4.1) — each level carries an icon and
   a title. `warn` fills with the light ADS amber, so its content is dark
   by contract (kit 02 §the warning trap).
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

/** Severity → ADS foundation palette. These palettes are immutable (kit 02).
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

export interface NotifyOptions extends Omit<NotificationData, 'message' | 'color'> {
  /** Milliseconds before auto-dismiss. `false` keeps it until dismissed. */
  autoClose?: number | false;
}

/** How long a toast stays up. Every severity auto-dismisses — Prime's Toast
 *  does (life 3000 for all severities), and the 76 migrating call sites
 *  expect that; errors/warnings get longer to read. A toast that demands an
 *  action passes `{ autoClose: false }` explicitly. */
const DEFAULT_AUTO_CLOSE: Record<NotifySeverity, number | false> = {
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

  return notifications.show({
    color,
    icon,
    title,
    message,
    autoClose: DEFAULT_AUTO_CLOSE[severity],
    withBorder: true,
    ...options,
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
