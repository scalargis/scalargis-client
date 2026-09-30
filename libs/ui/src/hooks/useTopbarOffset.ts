import { useEffect, useState } from 'react';

/** Space the viewer topbar takes at the viewport top: `fallback` in the normal layout, 0 in the embedded layout. */
export function useTopbarOffset(fallback = 50): number {
  const [offset, setOffset] = useState(fallback);

  useEffect(() => {
    setOffset(document.querySelector('.layout-embedded') ? 0 : fallback);
  }, [fallback]);

  return offset;
}
