import type { OnboardingStep } from '@scalargis/ui';

export const CORE_SECTION = 'core';

const SECTION_SPAN = 1000;

const VIEWER_FLOW = 'viewer';

/** Reads onboarding.sections from a viewer config_json, or null when absent. */
export function tourSections(configJson: unknown): string[] | null {
  const onboarding = (configJson as { onboarding?: { sections?: unknown } } | null | undefined)?.onboarding;
  const sections = onboarding?.sections;
  if (!Array.isArray(sections)) return null;
  return sections.filter((s): s is string => typeof s === 'string' && s.length > 0);
}

/** Returns a copy of the step without the viewer flow, or null when no flow is left. */
function withoutViewerFlow(step: OnboardingStep): OnboardingStep | null {
  const flows = Array.isArray(step.flow) ? step.flow : [step.flow ?? VIEWER_FLOW];
  const kept = flows.filter((f) => f !== VIEWER_FLOW);
  if (kept.length === 0) return null;
  return { ...step, flow: kept.length === 1 ? kept[0] : kept };
}

/** Puts the named sections in the viewer flow in list order (position * 1000 + order); other sections keep only their scoped flows. */
export function applyTourSections(
  baseSteps: OnboardingStep[],
  selfByType: Record<string, OnboardingStep[]>,
  sections: string[],
): OnboardingStep[] {
  const groups: Record<string, OnboardingStep[]> = { ...selfByType, [CORE_SECTION]: baseSteps };
  const out: OnboardingStep[] = [];
  const seen = new Set<string>();
  sections.forEach((name, i) => {
    if (seen.has(name)) return;
    const group = groups[name];
    if (!group) return;
    seen.add(name);
    for (const s of group) {
      out.push({ ...s, order: (i + 1) * SECTION_SPAN + (s.order ?? 100) });
    }
  });
  for (const [name, group] of Object.entries(groups)) {
    if (seen.has(name)) continue;
    for (const s of group) {
      const scoped = withoutViewerFlow(s);
      if (scoped) out.push(scoped);
    }
  }
  return out;
}
