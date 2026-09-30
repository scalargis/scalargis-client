/* =====================================================================
   SkipLink — the "skip to content" link every app shell must lead with
   (keyboard operability: cheap, high-value, expected on
   public-sector portals; ADS ships SkipNavigation, this is the
   Mantine-side equivalent).

   Render it as the FIRST element of a shell, before the topbar, and mark
   the shell's content region with the target id (<main id="main-content">).
   The link sits visually off-screen until it receives keyboard focus
   (.ads-skip-link in ads-components.css), then moves focus onto the
   content region so the next Tab lands inside it.

   The recipe owns the focus mechanics: a landmark is not natively
   focusable, so it gets a transient tabindex="-1" that is dropped again
   on blur — the region must be focusable *once*, not join the tab order.
   If the target id is absent the click falls through to the browser's
   fragment navigation, so the link never dead-ends.
   ===================================================================== */

import React from 'react';

import { uiText } from './i18n';

export interface SkipLinkProps {
  /** id of the shell's content landmark. Default 'main-content'. */
  targetId?: string;
  /** Link text; defaults to the scalargis_ui i18n string. */
  label?: string;
}

export function SkipLink({ targetId = 'main-content', label }: SkipLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), {
        once: true,
      });
    }
    target.focus();
  };

  return (
    <a className="ads-skip-link" href={`#${targetId}`} onClick={handleClick}>
      {label ?? uiText('skiplink.label', 'Skip to main content')}
    </a>
  );
}
