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
import type { OnboardingStep } from './types';
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
  children: ReactNode;
}

export default function TourProvider({ viewerId, steps, children }: Props) {
  const registry = useRef(new Map<string, HTMLElement>()).current;

  const controller = useMemo(
    () => createController(viewerId, steps),
    [viewerId, steps],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      controller.destroy();
    };
  }, [controller]);

  const ctx: TourContextValue = useMemo(
    () => ({ controller, registry, steps }),
    [controller, registry, steps],
  );

  return (
    <TourContext.Provider value={ctx}>
      {children}
      <TourOverlay />
    </TourContext.Provider>
  );
}
