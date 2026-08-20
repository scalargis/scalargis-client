/* ==========================================================================
   Panel reveal hooks (Phase 3).

   The mainmenu keeps every panel mounted and hides inactive ones with
   display:none (core/components/MainMenu.jsx getStyle). A hidden panel measures
   to a zero rect. attachRevealHooks attaches before/after hooks to panel steps
   so the controller reveals the panel, waits, and the renderer measures after
   one animation frame on a painted node.

   Call once inside the useMemo that builds the steps, with fresh catalogToStep
   results. The hooks mutate the step objects in place — no extra allocation.
   ========================================================================== */

import type { OnboardingStep } from '@scalargis/ui';
import { panelRevealByStepId } from './targets';

/** The bits of the open viewer that the reveal hooks need at runtime. */
export interface RevealHooksContext {
  /** config_json.components[] */
  components: { type?: unknown; id?: unknown; target?: unknown }[];
  /** redux dispatch (core.store.dispatch) */
  dispatch: (action: unknown) => unknown;
  /** The viewer_set_selectedmenu action creator */
  setSelectedMenu: (id: string) => unknown;
  /** Read selected_menu live from the store (not from a captured viewer prop) */
  getSelectedMenu: () => string | null;
  /**
   * Open the mainmenu sidebar drawer. Dispatches layout_show_menu(true).
   * Called before the panel reveal so the panel content is not hidden by
   * CSS display:none on #content when the static sidebar is collapsed.
   */
  showMenu: () => unknown;
  /**
   * Is the static sidebar currently collapsed? Reads
   * state.root.viewer.staticMenuInactive + layoutMode from the store.
   */
  isSidebarClosed: () => boolean;
}

/**
 * Attach a reveal before/after pair to one step. The before hook opens the
 * sidebar drawer when collapsed, then selects the menu that shows the panel.
 * The after hook restores the prior selection.
 */
function attachOnePanelReveal(
  step: OnboardingStep,
  menuId: string,
  ctx: RevealHooksContext,
): void {
  let prior: string | null = null;
  step.before = () => {
    prior = ctx.getSelectedMenu();
    // Open the sidebar drawer first when it is collapsed, so the panel
    // content inside #content is no longer display:none and measures to
    // a non-zero rect (layout.scss :233).
    if (ctx.isSidebarClosed()) {
      ctx.showMenu();
    }
    ctx.dispatch(ctx.setSelectedMenu(menuId));
  };
  step.after = () => {
    if (prior != null) {
      ctx.dispatch(ctx.setSelectedMenu(prior));
    }
  };
}

/**
 * Attach before/after hooks to every panel step so the menu panel is visible
 * before the spotlight measurement. Skips steps whose id is not in
 * panelRevealByStepId, and skips when the viewer has no mainmenu mount for the
 * revealed component (safe no-op).
 */
export function attachRevealHooks(
  steps: OnboardingStep[],
  ctx: RevealHooksContext,
): void {
  for (const step of steps) {
    const revealType = panelRevealByStepId[step.id];
    if (!revealType) continue;

    // Find the mainmenu component whose panel the step spotlights
    const comp = ctx.components.find(
      (c) => c.type === revealType && c.target === 'mainmenu',
    );
    const menuId = comp?.id;
    if (menuId == null) continue;

    attachOnePanelReveal(step, menuId as string, ctx);
  }
}

/**
 * Self-step reveal (Phase 5).
 *
 * A self component (for example CatalogoSNIG) ships its own steps that
 * spotlight elements inside its own mainmenu panel. That panel is hidden by
 * display:none while another menu is selected. So every self step of a
 * mainmenu component needs the same panel reveal as a base panel step. This
 * attaches the reveal to all the given steps, keyed on the component TYPE, not
 * on a static step-id map. Safe no-op when the component has no mainmenu mount.
 */
export function attachPanelRevealForType(
  steps: OnboardingStep[],
  revealType: string,
  ctx: RevealHooksContext,
): void {
  const comp = ctx.components.find(
    (c) => c.type === revealType && c.target === 'mainmenu',
  );
  const menuId = comp?.id;
  if (menuId == null) return;

  for (const step of steps) {
    attachOnePanelReveal(step, menuId as string, ctx);
  }
}
