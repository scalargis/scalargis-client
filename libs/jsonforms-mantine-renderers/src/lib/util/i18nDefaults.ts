import type { Translator } from '@jsonforms/core';

/** Same keys and fallbacks as the Prime lib — screens with translations for
 *  these keys keep working unchanged when they migrate. */
export const i18nDefaults: Record<string, string> = {
  'enum.none': 'None',
  'enum.placeholder': 'Select an option',
  'oneofenum.placeholder': 'Select one or more options',
  'stepper.previous': 'Previous',
  'stepper.next': 'Next',
};

/**
 * Resolve one of the keys above through the JSONForms translator, trying the
 * locale-prefixed key first when a locale is set — the exact lookup pattern
 * the Prime renderers use, factored out of the four call sites.
 */
export const translateDefault = (
  t: Translator,
  locale: string | undefined,
  key: keyof typeof i18nDefaults & string,
  context?: Record<string, unknown>
): string | undefined =>
  locale
    ? t(`${locale}.${key}`, i18nDefaults[key], context)
    : t(key, i18nDefaults[key], context);
