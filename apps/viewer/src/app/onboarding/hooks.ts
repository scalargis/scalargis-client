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

/**
 * The mainmenu drawer slides in over the `left` transition
 * ($transitionDuration ≈ the normal motion token, sass/_sidebar.scss). Wait a
 * touch longer than that so the panel has settled before the renderer measures
 * it (bugs/04). Under reduced motion the slide is near-instant, so this is only
 * a small idle.
 */
const DRAWER_REVEAL_MS = 320;

/** Resolve after `ms` milliseconds. */
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** What the tour changed in the menu layout, shared by every reveal step of one viewer. */
export interface RevealSession {
  prior: string | null;
  priorCaptured: boolean;
  openedMobileDrawer: boolean;
  openedSidebar: boolean;
}

/** A clean reveal session. */
export function createRevealSession(): RevealSession {
  return { prior: null, priorCaptured: false, openedMobileDrawer: false, openedSidebar: false };
}

/** The bits of the open viewer that the reveal hooks need at runtime. */
export interface RevealHooksContext {
  /** The reveal session; it outlives a rebuild of the steps. */
  session: RevealSession;
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
   * Collapse the static sidebar again. Dispatches layout_toggle_menu(true),
   * which toggles staticMenuInactive on a static layout. The after hook calls
   * it only when this step opened a collapsed sidebar, so the tour restores the
   * sidebar to the state the user had before it started.
   */
  hideMenu: () => unknown;
  /**
   * Is the static sidebar currently collapsed? Reads
   * state.root.viewer.staticMenuInactive + layoutMode from the store.
   */
  isSidebarClosed: () => boolean;
  /**
   * Small-screen check (viewport ≤ 1024px, the layout mobile breakpoint in
   * sass/_responsive.scss, matching core utils isDesktop()). On a small screen
   * the mainmenu is a slide-in drawer, not the static sidebar, so the reveal
   * path differs (bugs/04).
   */
  isMobile: () => boolean;
  /** Is the mobile drawer closed? Reads state.root.viewer.mobileMenuActive. */
  isMobileMenuClosed: () => boolean;
  /**
   * Open the mobile mainmenu drawer. Dispatches layout_show_menu(false), which
   * toggles the drawer on only when it is closed.
   */
  openMobileMenu: () => unknown;
  /**
   * Close the mobile mainmenu drawer. Dispatches layout_toggle_menu(false),
   * which toggles the drawer off.
   */
  closeMobileMenu: () => unknown;
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
  // Keep any before/after the step already declares. A self step can ship its
  // own reveal on top of the panel reveal — CatalogoSNIG opens its services
  // menu in the add-map-services step (improvement 03). Compose instead of
  // overwrite: the panel reveal runs first, then the step's own before; on the
  // way out the step's own after runs, then the prior menu is restored.
  const ownBefore = step.before;
  const ownAfter = step.after;
  const session = ctx.session;
  step.before = async () => {
    if (!session.priorCaptured) {
      session.prior = ctx.getSelectedMenu();
      session.priorCaptured = true;
    }
    if (ctx.isMobile()) {
      // Mobile: the panel lives in the slide-in drawer, gated on
      // mobileMenuActive, not the static sidebar (bugs/04). Open the drawer,
      // select the menu, then wait for the slide so #content measures a
      // non-zero rect on screen instead of falling back to the center card.
      const opening = ctx.isMobileMenuClosed();
      if (opening) {
        ctx.openMobileMenu();
        session.openedMobileDrawer = true;
      }
      ctx.dispatch(ctx.setSelectedMenu(menuId));
      if (opening) await wait(DRAWER_REVEAL_MS);
    } else {
      // Desktop: open the static sidebar first when it is collapsed, so the
      // panel content inside #content is no longer display:none and measures
      // to a non-zero rect (layout.scss :233).
      if (ctx.isSidebarClosed()) {
        ctx.showMenu();
        session.openedSidebar = true;
      }
      ctx.dispatch(ctx.setSelectedMenu(menuId));
    }
    if (ownBefore) await ownBefore();
  };
  step.after = () => {
    if (ownAfter) ownAfter();
    if (session.prior != null) {
      ctx.dispatch(ctx.setSelectedMenu(session.prior));
    }
    // Close the drawer this step opened, so a following map or topbar step is
    // not left behind the drawer overlay on mobile.
    if (session.openedMobileDrawer) {
      ctx.closeMobileMenu();
    }
    // Collapse the static sidebar this step opened, so leaving the tour on a
    // desktop panel step restores the sidebar the user had collapsed. Guard on
    // the live state so a sidebar the user reopened by hand is not toggled shut.
    if (session.openedSidebar && !ctx.isSidebarClosed()) {
      ctx.hideMenu();
    }
    Object.assign(session, createRevealSession());
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
