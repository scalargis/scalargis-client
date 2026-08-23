/* ==========================================================================
   TourProvider — the single React context that holds the controller and the
   target registry.

   Mount ONE provider in the viewer shell (core/containers/Viewer.jsx),
   wrapping the <Layout> it returns. It sits below the app-root MantineProvider
   so the Mantine context holds for the Popover, CloseButton, and the theme
   tokens (D2).

   Exports:
     TourProvider — the React component
     (TourContext is in ./TourContext.ts — import it from there)
   ========================================================================== */

import React, { useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { OnboardingStep, OnboardingLabels } from './types';
import { createController } from './controller';
import { TourContext, type TourContextValue } from './TourContext';
import TourOverlay from './TourOverlay';

/* --------------------------------------------------------------------------
   Provider
   -------------------------------------------------------------------------- */

interface Props {
  /** The viewer id for persistence (key: sg:ob:viewer:<viewerId>). */
  viewerId: string;
  /** The step list for this tour. Sorted internally by the controller. */
  steps: OnboardingStep[];
  /**
   * Localised control labels for the step card (improvement 06). The consumer
   * passes its i18n values. Absent → the engine uses the English defaults.
   */
  labels?: OnboardingLabels;
  children: ReactNode;
}

export default function TourProvider({ viewerId, steps, labels, children }: Props) {
  const registry = useRef(new Map<string, HTMLElement>()).current;

  // The controller is stable per viewer. A new steps array (a login, an
  // is_owner flip, or a self component finishing its async import all build one)
  // must NOT rebuild it: a rebuild resets active to false and drops a running
  // tour. The live list is pushed through setSteps below instead (F4).
  const controller = useMemo(
    () => createController(viewerId, steps),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewerId],
  );

  // Feed the live step list to the stable controller. The first run re-applies
  // the same list the controller already built (idempotent). A later membership
  // change swaps the list without tearing down the tour.
  useEffect(() => {
    controller.setSteps(steps);
  }, [controller, steps]);

  // Clean up on unmount, or when the controller itself changes (a viewerId
  // change). A steps change no longer destroys it.
  useEffect(() => {
    return () => {
      controller.destroy();
    };
  }, [controller]);

  const ctx: TourContextValue = useMemo(
    () => ({ controller, registry, labels }),
    [controller, registry, labels],
  );

  return (
    <TourContext.Provider value={ctx}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}
