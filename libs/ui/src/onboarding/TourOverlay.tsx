/* ==========================================================================
   TourOverlay — the visual layer of the onboarding engine.

   Draws the full-screen dim overlay with a rounded spotlight cutout, keeps
   the cutout tracking the live target, and places a Mantine Popover card
   next to the target.

   Built fresh on Mantine primitives (Portal, Popover, FocusTrap, CloseButton,
   useHotkeys). The reference site handed this job to an external library. We
   do not.

   Measurement contract (D12):
     1. Controller awaits step.before() before it sets currentIndex.
     2. TourOverlay sees the step change, waits one animation frame, then
        measures with getBoundingClientRect.
     3. A ResizeObserver on the target and window scroll/resize listeners
        keep the rect fresh during the step.

   The popover card is hidden until the first rect measurement completes.
   Without this, the popover flashes at the center fallback position for one
   frame while the rAF measurement is pending.

   Rules of Hooks: every hook runs before the `if (!ctx) return null` guard.
   The controller and registry are read null-safe until that guard, the same
   shape TourTarget uses. This lets the component mount where no provider sits
   above without breaking the hook order.
   ========================================================================== */

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useHotkeys } from '@mantine/hooks';
import { Button, CloseButton, FocusTrap, Popover, Portal, Text } from '@mantine/core';
import { TourContext } from './TourContext';
import type { OnboardingStep, PopoverPosition } from './types';
import type { OnboardingController } from './controller';
import { OVERLAY_Z, POPOVER_Z, LIVE_RECT_MIN_SIZE } from './constants';

/* --------------------------------------------------------------------------
   Defaults
   -------------------------------------------------------------------------- */

const DEFAULT_SPOTLIGHT_PADDING = 8;
const DEFAULT_SPOTLIGHT_RADIUS = 8;
const DEFAULT_POPOVER_OFFSET = 12;
const DEFAULT_POPOVER_WIDTH = 320;
const DIM_COLOR = 'rgba(0, 0, 0, 0.5)';

/** Stable empty list so a null controller never rebuilds the steps array. */
const EMPTY_STEPS: readonly OnboardingStep[] = [];

/* --------------------------------------------------------------------------
   Rect measurement
   -------------------------------------------------------------------------- */

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function measureTarget(el: HTMLElement | undefined): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null; // hidden target
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Whether a measured rect counts as a live target (improvement 02). A null rect
 * (target not mounted or hidden) or a rect below the minimum size (a revealed
 * but empty panel) is not live, so the controller auto-skips the step.
 */
function isLiveRect(rect: Rect | null): boolean {
  if (!rect) return false;
  return rect.width >= LIVE_RECT_MIN_SIZE && rect.height >= LIVE_RECT_MIN_SIZE;
}

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

function resolveNode(
  value: OnboardingStep['title'] | OnboardingStep['content'],
): React.ReactNode {
  if (typeof value === 'function') return value();
  return value;
}

/* --------------------------------------------------------------------------
   Popover position heuristic (Phase 3 visual-test fix).

   The static default 'bottom' works for topbar buttons but puts the card
   off-screen for tall right-side panels (the TOC panel). resolvePopoverPosition
   picks a side that keeps the card visible based on where the target sits
   in the viewport. An explicit step.popover.position always wins.
   -------------------------------------------------------------------------- */

function resolvePopoverPosition(
  rect: Rect | null,
  viewportW: number,
  viewportH: number,
  explicit: PopoverPosition | undefined,
): PopoverPosition {
  if (explicit) return explicit;
  if (!rect) return 'bottom';

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // Vertical edges checked first so footer items (both sides) get 'top'
  // and topbar items stay 'bottom', regardless of horizontal position.
  // Near the bottom edge → popover above
  if (cy > viewportH * 0.7) return 'top';
  // Near the top edge → popover below
  if (cy < viewportH * 0.2) return 'bottom';
  // Right-side (mid-screen panel or control) → popover to the left
  if (cx > viewportW * 0.55) return 'left';
  // Left-side → popover to the right
  if (cx < viewportW * 0.45) return 'right';
  // Default: below
  return 'bottom';
}

/* --------------------------------------------------------------------------
   Component
   -------------------------------------------------------------------------- */

export default function TourOverlay() {
  const ctx = useContext(TourContext);
  // Read null-safe. The `if (!ctx) return null` guard sits below every hook.
  const controller: OnboardingController | null = ctx?.controller ?? null;
  const registry = ctx?.registry ?? null;

  /* ---- controller state (useSyncExternalStore) ---- */

  const active = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        if (!controller) return () => undefined;
        return controller.subscribe(() => onChange());
      },
      [controller],
    ),
    () => controller?.active ?? false,
  );

  const currentIndex = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        if (!controller) return () => undefined;
        return controller.subscribe(() => onChange());
      },
      [controller],
    ),
    () => controller?.currentIndex ?? -1,
  );

  // Subscribe to the step list too, not only active/currentIndex. setSteps (F4)
  // can swap the list while the tour runs and leave currentIndex unchanged (a
  // step added after the current one). The array reference changes on a swap and
  // holds steady otherwise, so the counter and the last-step check stay fresh
  // without an extra render.
  const steps = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        if (!controller) return () => undefined;
        return controller.subscribe(() => onChange());
      },
      [controller],
    ),
    () => controller?.steps ?? EMPTY_STEPS,
  );
  const currentStep: OnboardingStep | null =
    active && currentIndex >= 0 && currentIndex < steps.length
      ? steps[currentIndex]
      : null;

  /* ---- target & rect ---- */

  const targetEl =
    currentStep && registry ? registry.get(currentStep.id) : undefined;
  const [rect, setRect] = useState<Rect | null>(null);
  // The popover stays hidden until the first rAF measurement lands.
  // Without this, it appears at the center fallback for one frame.
  const [ready, setReady] = useState(false);

  // Viewport size in plain pixels. The SVG has no viewBox, so 1 user unit
  // must equal 1 CSS pixel. We size the SVG with these numbers instead of
  // 100vw/100vh geometry attributes, which SVG does not resolve on every
  // browser. Plain numbers are unambiguous user units everywhere.
  const [viewport, setViewport] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 0,
    h: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  useEffect(() => {
    function onResize() {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Track whether the tour overlay has ever become active so the
  // first-activation branch runs only once per tour session.  A ref
  // keeps ready/rect out of the effect deps — otherwise every rect
  // change from ResizeObserver would re-schedule the rAF.
  const wasActiveRef = useRef(false);

  // Measure after step change — wait one rAF so the DOM settles (D12).
  // The controller already awaited step.before() before setting currentIndex,
  // so by the time we see the new step the target should be revealed.
  useEffect(() => {
    if (!active || !currentStep) {
      setRect(null);
      setReady(false);
      wasActiveRef.current = false;
      return;
    }
    // First activation: also null the stale rect from a previous session.
    if (!wasActiveRef.current) {
      wasActiveRef.current = true;
      setRect(null);
    }
    // Hide the card for one frame while the new rect is pending; `rect` still
    // holds the old value here. One rAF later we measure the new target and
    // show again. The card's side follows the new region through the Popover's
    // preventPositionChangeWhenVisible={false} (see below).
    setReady(false);
    const raf = requestAnimationFrame(() => {
      const measured = measureTarget(targetEl);
      setRect(measured);
      // Auto-skip a dead step (improvement 02). When the landed step has no
      // live target, ask the controller to move on in the last direction. The
      // move notifies, this effect re-runs for the new step, and the card
      // stays hidden (ready false) until a live step lands. So a dead step
      // never shows.
      if (!isLiveRect(measured)) {
        controller?.skipDeadStep();
        return;
      }
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [active, currentStep, targetEl, controller]);

  // Keep the rect fresh during the step.
  useEffect(() => {
    if (!active || !currentStep || !targetEl) return;

    const ro = new ResizeObserver(() => {
      setRect(measureTarget(targetEl));
    });
    ro.observe(targetEl);

    function onMove() {
      setRect(measureTarget(targetEl));
    }
    // Capture phase so we catch scroll events from any ancestor.
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [active, currentStep, targetEl]);

  // Advance on the real target click (improvement 07, D14). Bind a one-shot
  // click listener on the target. It lets the real click through (no
  // preventDefault), then runs the same forward advance Next uses, so the
  // click that opens a panel or runs a search fires and the tour moves on in
  // the same gesture. The auto-skip in improvement 02 still applies, because
  // next() sets the forward direction.
  useEffect(() => {
    if (!active || !currentStep?.advanceOnTargetClick || !targetEl) return;
    let advanced = false;
    function onClick() {
      if (advanced) return;
      advanced = true;
      controller?.next();
    }
    targetEl.addEventListener('click', onClick);
    return () => targetEl.removeEventListener('click', onClick);
  }, [active, currentStep, targetEl, controller]);

  /* ---- step values ---- */

  const spotlight = currentStep?.spotlight;
  const padding = spotlight?.padding ?? DEFAULT_SPOTLIGHT_PADDING;
  const radius = spotlight?.radius ?? DEFAULT_SPOTLIGHT_RADIUS;
  // The spotlight focus effect (improvement 05, D13 seam). Default 'none'
  // draws nothing, so opting in per step never changes an old step. The
  // pulse is a CSS animation, so the reduced-motion kill in ads-globals.css
  // freezes it to a static ring. The renderer hardcodes no motion duration.
  const focus = currentStep?.focus ?? 'none';
  const popover = currentStep?.popover;
  const resolvedPos = resolvePopoverPosition(
    rect,
    viewport.w,
    viewport.h,
    popover?.position,
  );
  const popoverOffset = popover?.offset ?? DEFAULT_POPOVER_OFFSET;
  const popoverWidth = popover?.width ?? DEFAULT_POPOVER_WIDTH;

  const title = currentStep ? resolveNode(currentStep.title) : null;
  const content = currentStep ? resolveNode(currentStep.content) : null;

  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= steps.length - 1;

  /* ---- keyboard ---- */

  const activeRef = useRef(active);
  activeRef.current = active;
  const ctrlRef = useRef<OnboardingController | null>(controller);
  ctrlRef.current = controller;

  // Ref to focus the Next/Complete button after the popover appears.
  // FocusTrap auto-focuses the first tabbable element (CloseButton, which
  // is first in DOM order). We override that to focus Next instead.
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (ready && nextButtonRef.current) {
      nextButtonRef.current.focus();
    }
  }, [ready, currentIndex]);

  useHotkeys([
    ['ArrowRight', () => { if (activeRef.current) ctrlRef.current?.next(); }],
    ['ArrowDown', () => { if (activeRef.current) ctrlRef.current?.next(); }],
    ['ArrowLeft', () => { if (activeRef.current) ctrlRef.current?.prev(); }],
    ['ArrowUp', () => { if (activeRef.current) ctrlRef.current?.prev(); }],
    ['Escape', () => { if (activeRef.current) ctrlRef.current?.pause(); }],
  ]);

  /* ---- render ---- */

  // Guard AFTER every hook (Rules of Hooks). Past this line ctx is non-null.
  if (!ctx || !active) return null;
  const c = ctx.controller;

  // Localised control labels (improvement 06). The consumer passes them from
  // its i18n bundle; absent → the English defaults keep the engine working.
  const labels = ctx.labels;
  const prevLabel = labels?.previous ?? 'Previous';
  const nextLabel = labels?.next ?? 'Next';
  const completeLabel = labels?.complete ?? 'Complete';
  const closeLabel = labels?.close ?? 'Close tour';

  // Stable per-step ids so the screen reader links the dialog to its title and
  // body (improvement 06).
  const titleId = currentStep ? `sg-tour-title-${currentStep.id}` : undefined;
  const descId = currentStep ? `sg-tour-desc-${currentStep.id}` : undefined;

  // Compute cutout coords from the target rect.
  const hasCutout = rect !== null;
  const cx = rect ? rect.left - padding : 0;
  const cy = rect ? rect.top - padding : 0;
  const cw = rect ? rect.width + padding * 2 : 0;
  const ch = rect ? rect.height + padding * 2 : 0;

  const maskId = 'sg-tour-mask';

  return (
    <Portal>
      {/* ── SVG dim overlay ─────────────────────────────────────────── */}
      <svg
        width={viewport.w}
        height={viewport.h}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: OVERLAY_Z,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <mask id={maskId}>
            <rect width={viewport.w} height={viewport.h} fill="white" />
            {hasCutout && (
              <rect
                x={cx}
                y={cy}
                width={cw}
                height={ch}
                rx={radius}
                ry={radius}
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dim fill */}
        <rect
          width={viewport.w}
          height={viewport.h}
          fill={DIM_COLOR}
          mask={`url(#${maskId})`}
        />
        {/* Focus effect around the cutout (improvement 05, D13 seam). The
            pulse variant animates through the CSS class, so the reduced-motion
            kill stops it; the ring variant is static. No motion here. */}
        {hasCutout && focus !== 'none' && (
          <rect
            x={cx}
            y={cy}
            width={cw}
            height={ch}
            rx={radius}
            ry={radius}
            className={
              focus === 'pulse'
                ? 'sg-tour-focus sg-tour-focus--pulse'
                : 'sg-tour-focus'
            }
          />
        )}
        {/* Transparent catcher over the cutout when target interaction is blocked */}
        {hasCutout && currentStep?.disableTargetInteraction && (
          <rect
            x={cx}
            y={cy}
            width={cw}
            height={ch}
            rx={radius}
            ry={radius}
            fill="transparent"
            style={{ pointerEvents: 'auto' }}
          />
        )}
      </svg>

      {/* ── Popover card — hidden until the rect is measured ────────── */}
        {/*
          preventPositionChangeWhenVisible={false} is the cross-region fix.
          Mantine's default (true) locks the popover side on first open and
          never re-flips it while visible. The tour keeps one Popover for the
          whole run and moves it between regions through `position`, so the
          locked side froze at step 1 and cross-region steps landed the card
          wrong. Off = flip stays active, the side follows resolvedPos.
        */}
        <Popover
          opened={ready}
          position={resolvedPos}
          offset={popoverOffset}
          width={popoverWidth}
          shadow="md"
          zIndex={POPOVER_Z}
          floatingStrategy="fixed"
          preventPositionChangeWhenVisible={false}
        >
          <Popover.Target>
            {/* Invisible anchor at the target rect */}
            <div
              style={{
                position: 'fixed',
                left: hasCutout ? cx : '50vw',
                top: hasCutout ? cy : '50vh',
                width: hasCutout ? cw : 0,
                height: hasCutout ? ch : 0,
                pointerEvents: 'none',
              }}
            />
          </Popover.Target>

          <Popover.Dropdown>
            <FocusTrap active={ready}>
              {/* role=dialog + aria links so the screen reader announces the
                  card and reads the title then the body (improvement 06). */}
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={content ? descId : undefined}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: title || content ? 12 : 0,
                  }}
                >
                  {title && (
                    <Text id={titleId} fw={700} size="lg">
                      {title}
                    </Text>
                  )}
                  <CloseButton
                    onClick={() => c.pause()}
                    aria-label={closeLabel}
                    style={{ flexShrink: 0 }}
                  />
                </div>

                {/* Content */}
                {content && (
                  <Text id={descId} size="sm" c="dimmed" style={{ marginBottom: 16 }}>
                    {content}
                  </Text>
                )}

                {/* Footer: nav + step counter */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text size="xs" c="dimmed">
                    {currentIndex + 1} / {steps.length}
                  </Text>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isFirst && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => c.prev()}
                      >
                        {prevLabel}
                      </Button>
                    )}
                    <Button
                      ref={nextButtonRef}
                      variant="filled"
                      size="sm"
                      onClick={() => c.next()}
                    >
                      {isLast ? completeLabel : nextLabel}
                    </Button>
                  </div>
                </div>
              </div>
            </FocusTrap>
          </Popover.Dropdown>
        </Popover>
    </Portal>
  );
}
