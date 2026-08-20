/* ==========================================================================
   Named membership conditions (Phase 2, D11).

   A catalog step may carry a `condition` name. The name binds to a predicate
   (ctx) => boolean here. ctx holds { auth, viewer }. The membership selector
   drops a step whose predicate is false.

   The mechanism is general, so a later gated step reuses it: add a named
   predicate and set `condition` on the catalog row.
   ========================================================================== */

/** The loose shapes the predicates read. Kept minimal, no `any`. */
export interface ConditionContext {
  auth?: { data?: { token?: string | null } | null } | null;
  viewer?: { is_owner?: boolean | null } | null;
}

export type ConditionPredicate = (ctx: ConditionContext) => boolean;

/**
 * auth_and_owner mirrors SaveViewerWidget.jsx line 45
 * (`!!auth?.data?.token && !!viewer.is_owner`). The save:intro step joins the
 * tour only with a session and for the owner of the open viewer.
 */
export const conditions: Record<string, ConditionPredicate> = {
  auth_and_owner: (ctx) => !!ctx.auth?.data?.token && !!ctx.viewer?.is_owner,
};

/**
 * Evaluate a step condition. No condition passes. An unknown condition name
 * fails closed: a gate we cannot evaluate drops the step, rather than show a
 * step that should stay gated.
 */
export function evaluateCondition(
  name: string | null | undefined,
  ctx: ConditionContext,
): boolean {
  if (!name) return true;
  const predicate = conditions[name];
  if (!predicate) {
    // eslint-disable-next-line no-console
    console.warn(`[onboarding] unknown step condition "${name}"; dropping step`);
    return false;
  }
  return predicate(ctx);
}
