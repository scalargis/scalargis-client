import type { OnboardingStep } from '@scalargis/ui';

export const CORE_SECTION = 'core';

const SECTION_SPAN = 1000;

/** Reads onboarding.sections from a viewer config_json, or null when absent. */
export function tourSections(configJson: unknown): string[] | null {
  const onboarding = (configJson as { onboarding?: { sections?: unknown } } | null | undefined)?.onboarding;
  const sections = onboarding?.sections;
  if (!Array.isArray(sections)) return null;
  return sections.filter((s): s is string => typeof s === 'string' && s.length > 0);
}

/** Keeps the named sections in list order; each step's order becomes position * 1000 + its own order. */
export function applyTourSections(
  baseSteps: OnboardingStep[],
  selfByType: Record<string, OnboardingStep[]>,
  sections: string[],
): OnboardingStep[] {
  const out: OnboardingStep[] = [];
  const seen = new Set<string>();
  sections.forEach((name, i) => {
    if (seen.has(name)) return;
    seen.add(name);
    const group = name === CORE_SECTION ? baseSteps : selfByType[name];
    if (!group) return;
    for (const s of group) {
      out.push({ ...s, order: (i + 1) * SECTION_SPAN + (s.order ?? 100) });
    }
  });
  return out;
}
