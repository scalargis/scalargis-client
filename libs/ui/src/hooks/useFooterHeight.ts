import { useEffect, useState } from 'react';

/** Height of the viewer `.layout-footer` in px, kept current on resize. `fallback` until the footer mounts. */
export function useFooterHeight(fallback = 50): number {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    let raf = 0;
    let attempts = 0;
    let observer: ResizeObserver | null = null;

    const attach = () => {
      const el = document.querySelector('.layout-footer') as HTMLElement | null;
      if (el && el.offsetHeight > 0) {
        setHeight(el.offsetHeight);
        observer = new ResizeObserver(() => {
          if (el.offsetHeight > 0) setHeight(el.offsetHeight);
        });
        observer.observe(el);
        return;
      }
      if (attempts++ < 180) raf = requestAnimationFrame(attach);
    };
    attach();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
    };
  }, []);

  return height;
}
