/* ==========================================================================
   TourTarget — marks an element as the spotlight target for a step.

   Wraps its child in a <span style="display:contents"> so the wrapper has
   zero layout impact. Registers the first child DOM element into the
   nearest TourProvider's target registry under the given id.

   No-ops when no <TourProvider> sits above it, so a component that also
   mounts in the embedded shell (ViewerEmbedded) is safe.
   ========================================================================== */

import React, { useContext, useEffect, useRef, type ReactNode } from 'react';
import { TourContext } from './TourContext';

interface Props {
  /** Step id this element is the target for. Must match the step id. */
  id: string;
  /** The element(s) to wrap. */
  children: ReactNode;
}

export default function TourTarget({ id, children }: Props) {
  const ctx = useContext(TourContext);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ctx) return;
    // The wrapper has display:contents, which has no box. Walk to the
    // first real child and register that element instead.
    const el =
      wrapperRef.current?.firstElementChild as HTMLElement | null;
    if (el) {
      ctx.registry.set(id, el);
    }
    return () => {
      ctx.registry.delete(id);
    };
  }, [id, ctx]);

  // No-op when no provider — pass children through unwrapped
  if (!ctx) return <>{children}</>;

  return (
    <span ref={wrapperRef} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}
