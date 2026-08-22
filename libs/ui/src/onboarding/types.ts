/* ==========================================================================
   Onboarding type definitions — ScalarGIS viewer tour engine.

   OnboardingStep is the contract each tour step follows. It does not extend a
   library step. The engine builds its own visual layer on Mantine primitives.

   The catalog fields (components, sources, target, owner, doc, manual, i18n,
   also_on, condition, primary_component) live in onboarding-index.json. The
   loader in apps/viewer maps them to these runtime fields. Base steps ship
   in the viewer bundle. Self steps export from the component repo (D6) and
   merge at runtime.
   ========================================================================== */

import type { ReactNode } from 'react';

/** Floating UI placement for the step popover (Mantine Popover position). */
export type PopoverPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end';

/** A single step in a guided onboarding tour. */
export interface OnboardingStep {
  /** Unique step id. Must match the <TourTarget id> that wraps the element. */
  id: string;
  /** Sort order within the flow (lower = earlier). Default 100. */
  order?: number;
  /** Flow membership. The viewer uses one flow: "viewer". */
  flow?: string;
  /** Step title shown in the popover card. */
  title?: ReactNode | (() => ReactNode);
  /** Step body shown in the popover card. */
  content?: ReactNode | (() => ReactNode);
  /** The spotlight cutout shape. A big radius gives a circle. */
  spotlight?: {
    /** Extra pixels around the target rect. Default 8. */
    padding?: number;
    /** Corner radius of the cutout. Default 8. */
    radius?: number;
  };
  /** Popover placement relative to the target. */
  popover?: {
    /** Preferred side. Default 'bottom'. */
    position?: PopoverPosition;
    /** Gap between the target and the card. Default 12. */
    offset?: number;
    /** Card width in px. Default 320. */
    width?: number;
  };
  /** Spotlight focus effect. */
  focus?: 'ring' | 'pulse' | 'none';
  /** Block interaction with the live target while this step shows. */
  disableTargetInteraction?: boolean;
  /**
   * Advance the tour when the user clicks the real target (improvement 07,
   * D14). The renderer binds a one-shot click listener on the measured target.
   * It lets the real click through, then runs the same forward advance Next
   * uses. Default off (a D13 seam). The step must keep the target interactive,
   * so do not pair it with disableTargetInteraction.
   */
  advanceOnTargetClick?: boolean;
  /** Hook that runs before this step shows. Awaited. */
  before?: () => void | Promise<void>;
  /** Hook that runs after this step leaves. */
  after?: () => void;
}

/**
 * Localised labels for the step-card controls (improvement 06). The engine
 * stays content-free: the consumer passes these from its i18n bundle. When a
 * label is absent the renderer falls back to the English literal, so a consumer
 * without i18n still works.
 */
export interface OnboardingLabels {
  /** The Previous button. Default "Previous". */
  previous?: string;
  /** The Next button (not the last step). Default "Next". */
  next?: string;
  /** The final button on the last step. Default "Complete". */
  complete?: string;
  /** The close-button aria-label. Default "Close tour". */
  close?: string;
}

/** Persisted state for a viewer tour. */
export interface OnboardingState {
  /** Whether the user completed or dismissed the tour. */
  completed: boolean;
  /** Index of the last active step for resume. */
  lastStep: number;
}
