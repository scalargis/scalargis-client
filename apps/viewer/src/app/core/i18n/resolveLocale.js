import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getAppDefaultLocale } from './../utils';

const STORAGE_KEY = 'i18nextLng';

/** Reads the language the user picked, or an empty string. */
export const readStoredLocale = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
};

const normalizeLocales = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map(l => (l && typeof l === 'object') ? (l.value ?? l.values) : l)
    .filter(l => typeof l === 'string' && l.trim())
    .map(l => l.trim().toLowerCase());
};

const baseOf = (code) => code.split(/[-_]/)[0];

const matchLocale = (candidate, allowed) => {
  if (typeof candidate !== 'string' || !candidate.trim()) return null;
  const code = candidate.trim().toLowerCase();
  if (allowed.includes(code)) return code;
  const base = baseOf(code);
  return allowed.find(a => baseOf(a) === base) || null;
};

/** Returns the languages a viewer allows: the LocaleSelector list, its own list, or its single language. */
export const getViewerLocales = (viewer) => {
  const components = viewer?.config_json?.components;
  if (Array.isArray(components)) {
    for (const component of components) {
      if (component?.type !== 'LocaleSelector') continue;
      const fromComponent = normalizeLocales(component?.config_json?.locales);
      if (fromComponent.length) return fromComponent;
    }
  }

  const fromViewer = normalizeLocales(viewer?.config_json?.locales);
  if (fromViewer.length) return fromViewer;

  return normalizeLocales([viewer?.lang]);
};

/** Picks the viewer language: stored pick, then browser language, both only if the viewer allows them, then the viewer language, then the site default. */
export const resolveViewerLocale = (viewer) => {
  const allowed = getViewerLocales(viewer);

  const stored = matchLocale(readStoredLocale(), allowed);
  if (stored) return stored;

  const browserLanguages = (typeof navigator !== 'undefined')
    ? (navigator.languages?.length ? navigator.languages : [navigator.language])
    : [];
  for (const language of browserLanguages) {
    const matched = matchLocale(language, allowed);
    if (matched) return matched;
  }

  return viewer?.lang || getAppDefaultLocale() || undefined;
};

/** Applies the resolved viewer language to i18next, and the lang query param when present. */
export const useViewerLocale = (viewer, location) => {
  const { i18n } = useTranslation();

  const loaded = Array.isArray(viewer?.config_json?.components);
  const allowedKey = loaded ? getViewerLocales(viewer).join(',') : '';

  useEffect(() => {
    const queryLang = new URLSearchParams(location?.search || '').get('lang');
    const lang = queryLang || (loaded ? resolveViewerLocale(viewer) : null);
    if (lang && lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
  }, [loaded, viewer?.lang, allowedKey, location?.search]);
};
