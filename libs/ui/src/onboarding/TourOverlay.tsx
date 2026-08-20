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
import type { OnboardingStep } from './types';
import { OVERLAY_Z, POPOVER_Z } from './constants';

/* --------------------------------------------------------------------------
   Defaults
   -------------------------------------------------------------------------- */

const DEFAULT_SPOTLIGHT_PADDING = 8;
const DEFAULT_SPOTLIGHT_RADIUS = 8;
const DEFAULT_POPOVER_OFFSET = 12;
const DEFAULT_POPOVER_WIDTH = 320;
const DIM_COLOR = 'rgba(0, 0, 0, 0.5)';

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
   Component
   -------------------------------------------------------------------------- */

export default function TourOverlay() {
  const ctx = useContext(TourContext);
  if (!ctx) return null; // no provider

  const { controller, registry } = ctx;

  /* ---- controller state (useSyncExternalStore) ---- */

  const active = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        const unsub = controller.subscribe(() => onChange());
        return unsub;
      },
      [controller],
    ),
    () => controller.active,
  );

  const currentIndex = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        const unsub = controller.subscribe(() => onChange());
        return unsub;
      },
      [controller],
    ),
    () => controller.currentIndex,
  );

  const steps = controller.steps;
  const currentStep: OnboardingStep | null =
    active && currentIndex >= 0 && currentIndex < steps.length
      ? steps[currentIndex]
      : null;

  /* ---- target & rect ---- */

  const targetEl = currentStep ? registry.get(currentStep.id) : undefined;
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

  // Measure after step change — wait one rAF so the DOM settles (D12).
  // The controller already awaited step.before() before setting currentIndex,
  // so by the time we see the new step the target should be revealed.
  useEffect(() => {
    if (!active || !currentStep) {
      setRect(null);
      setReady(false);
      return;
    }
    // Reset for the new step — popover hides until measured.
    setReady(false);
    const raf = requestAnimationFrame(() => {
      setRect(measureTarget(targetEl));
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [active, currentStep, targetEl]);

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

  /* ---- step values ---- */

  const spotlight = currentStep?.spotlight;
  const padding = spotlight?.padding ?? DEFAULT_SPOTLIGHT_PADDING;
  const radius = spotlight?.radius ?? DEFAULT_SPOTLIGHT_RADIUS;
  const popover = currentStep?.popover;
  const popoverPosition = popover?.position ?? 'bottom';
  const popoverOffset = popover?.offset ?? DEFAULT_POPOVER_OFFSET;
  const popoverWidth = popover?.width ?? DEFAULT_POPOVER_WIDTH;

  const title = currentStep ? resolveNode(currentStep.title) : null;
  const content = currentStep ? resolveNode(currentStep.content) : null;

  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= steps.length - 1;

  /* ---- keyboard ---- */

  const activeRef = useRef(active);
  activeRef.current = active;
  const ctrlRef = useRef(controller);
  ctrlRef.current = controller;

  useHotkeys([
    ['ArrowRight', () => { if (activeRef.current) ctrlRef.current.next(); }],
    ['ArrowDown', () => { if (activeRef.current) ctrlRef.current.next(); }],
    ['ArrowLeft', () => { if (activeRef.current) ctrlRef.current.prev(); }],
    ['ArrowUp', () => { if (activeRef.current) ctrlRef.current.prev(); }],
    ['Escape', () => { if (activeRef.current) ctrlRef.current.skip(); }],
  ]);

  /* ---- render ---- */

  if (!active) return null;

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
      {ready && (
        <Popover
          opened
          position={popoverPosition}
          offset={popoverOffset}
          width={popoverWidth}
          shadow="md"
          zIndex={POPOVER_Z}
          floatingStrategy="fixed"
          middlewares={{ flip: true, shift: true }}
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
            <FocusTrap active>
              <div>
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
                    <Text fw={700} size="lg">
                      {title}
                    </Text>
                  )}
                  <CloseButton
                    onClick={() => controller.skip()}
                    aria-label="Close tour"
                    style={{ flexShrink: 0 }}
                  />
                </div>

                {/* Content */}
                {content && (
                  <Text size="sm" c="dimmed" style={{ marginBottom: 16 }}>
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
                        onClick={() => controller.prev()}
                      >
                        Previous
                      </Button>
                    )}
                    <Button
                      variant="filled"
                      size="sm"
                      onClick={() => controller.next()}
                    >
                      {isLast ? 'Complete' : 'Next'}
                    </Button>
                  </div>
                </div>
              </div>
            </FocusTrap>
          </Popover.Dropdown>
        </Popover>
      )}
    </Portal>
  );
}
