/* ==========================================================================
   Onboarding i18n bundle registration (Phase 2, D4).

   Merges the onboarding.* copy into the i18next "common" namespace for pt and
   en. The client registers its app translations into "common" and sets
   defaultNS "common" (core/i18n/index.js), so t("onboarding.toc.title")
   resolves against the live locale. es and fr fall back to fallbackLng (pt).

   Idempotent. Called from the step loader before the tour renders, after
   initTranslations() has run (Core.jsx runs it at module load).
   ========================================================================== */

import i18next from 'i18next';
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
