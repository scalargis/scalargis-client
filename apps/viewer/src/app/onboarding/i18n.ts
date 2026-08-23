/* ==========================================================================
   Onboarding i18n bundle registration (Phase 2, D4).

   Merges the onboarding.* copy into the i18next "common" namespace for pt and
   en. The client registers its app translations into "common" and sets
   defaultNS "common" (core/i18n/index.js), so t("onboarding.toc.title")
   resolves against the live locale. es and fr fall back to fallbackLng (pt).

   Idempotent. Called from the step loader before the tour renders, after
   initTranslations() has run (Core.jsx runs it at module load).
   ========================================================================== */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import type { OnboardingLabels } from '@scalargis/ui';
import onboardingPt from './i18n/pt.json';
import onboardingEn from './i18n/en.json';

let registered = false;

/** Register the pt and en onboarding bundles once. */
export function registerOnboardingTranslations(): void {
  if (registered) return;
  // addResourceBundle(lng, ns, resources, deep=true, overwrite=true)
  i18next.addResourceBundle('pt', 'common', onboardingPt, true, true);
  i18next.addResourceBundle('en', 'common', onboardingEn, true, true);
  registered = true;
}

/**
 * The step-card control labels for the tour engine, resolved live.
 *
 * Self-contained: this hook registers the onboarding bundle first, then reads
 * the keys. So the bundle is always present before the first read. The consumer
 * used to build these labels in its own memo, which ran before the bundle
 * registered and froze the raw keys on a fast start (the memo never recomputed,
 * because react-i18next does not re-render on addResourceBundle and neither the
 * t reference nor the language changes). Keeping the registration and the read
 * in one place removes that race. The memo still holds a stable object and
 * recomputes on a language change.
 */
export function useOnboardingLabels(): OnboardingLabels {
  registerOnboardingTranslations();
  const { t, i18n } = useTranslation();
  return useMemo(
    () => ({
      previous: t('onboarding.controls.previous'),
      next: t('onboarding.controls.next'),
      complete: t('onboarding.controls.complete'),
      close: t('onboarding.controls.close'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language],
  );
}
