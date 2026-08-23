/* ==========================================================================
   Panel reveal hooks — the prior-menu restore contract (F8).

   The reveal before hook opens the tour's panel and remembers the menu the user
   had; the after hook puts that menu back. A dismiss (pause) skips the after
   hook by design, so the panel stays open. The before hook must capture the
   prior selection once per tour session, or a resume would capture the tour's
   own open panel and the next move would restore to it, losing the user's menu.
   ========================================================================== */

import type { OnboardingStep } from '@scalargis/ui';
import { describe, expect, it } from 'vitest';

import { attachPanelRevealForType, type RevealHooksContext } from './hooks';

/**
 * A desktop context with the sidebar already open, so the reveal path is just
 * select-menu / restore-menu. `dispatch(setSelectedMenu(id))` moves the live
 * selection, which `getSelectedMenu` reads back — the store, in miniature.
 */
function makeContext(revealType: string, menuId: string, initialMenu: string) {
  let selected = initialMenu;
  const ctx: RevealHooksContext = {
    components: [{ type: revealType, target: 'mainmenu', id: menuId }],
    dispatch: (action) => {
      const next = (action as { menuId?: string }).menuId;
      if (next !== undefined) selected = next;
    },
    setSelectedMenu: (id) => ({ menuId: id }),
    getSelectedMenu: () => selected,
    showMenu: () => undefined,
    hideMenu: () => undefined,
    isSidebarClosed: () => false,
    isMobile: () => false,
    isMobileMenuClosed: () => true,
    openMobileMenu: () => undefined,
    closeMobileMenu: () => undefined,
  };
  return { ctx, current: () => selected };
}

describe('panel reveal — prior menu restore', () => {
  it('restores the menu the user had before the step revealed its panel', async () => {
    const step: OnboardingStep = { id: 'measure:panel' };
    const { ctx, current } = makeContext('measure', 'measureMenu', 'layers');
    attachPanelRevealForType([step], 'measure', ctx);

    await step.before?.();
    expect(current()).toBe('measureMenu'); // tour opened its panel

    step.after?.();
    expect(current()).toBe('layers'); // and put the user's menu back
  });

  it('does not re-capture prior on resume, so pause then resume keeps the original menu', async () => {
    const step: OnboardingStep = { id: 'measure:panel' };
    const { ctx, current } = makeContext('measure', 'measureMenu', 'layers');
    attachPanelRevealForType([step], 'measure', ctx);

    // Enter the step: prior = 'layers', panel opens.
    await step.before?.();
    expect(current()).toBe('measureMenu');

    // Dismiss (pause): the controller skips the after hook, so the panel stays
    // open. The live selection is the tour's own panel now.
    expect(current()).toBe('measureMenu');

    // Resume: before runs again with the tour's panel still selected. The fix
    // keeps prior at 'layers' instead of re-reading 'measureMenu' here.
    await step.before?.();
    expect(current()).toBe('measureMenu');

    // A following move runs the after hook. It must restore the user's original
    // menu, not the tour's panel.
    step.after?.();
    expect(current()).toBe('layers');
  });
});
