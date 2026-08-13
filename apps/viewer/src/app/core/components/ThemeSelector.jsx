import React from 'react';

import { useApplyClientTheme } from '@scalargis/ui';

import ThemeDefault from '../../core/themes/default/main';

const ThemeDefaultWrapper = () => <ThemeDefault />;
const themeComponentCache = new Map();

const loadTheme = async (theme) => {
  let thm = null;

  try {
    thm = await import(`../../themes/${theme}/src/main.jsx`);
  } catch (e1) {
    try {
      thm = await import(`../../core/themes/${theme}/main.jsx`);
    } catch (e2) {
      try {
        thm = await import(`../../themes/${theme}/src/main.tsx`);
      } catch (e3) {
        try {
          thm = await import(`../../core/themes/${theme}/main.tsx`);
        } catch (e4) {
          console.error(e4);
          return { default: ThemeDefaultWrapper };
        }
      }
    }
  }

  if (!thm) {
    console.error('Standard Theme Failed Loading:', theme);
    return { default: ThemeDefaultWrapper };
  }

  return thm;
};

const getThemeComponent = (theme) => {
  if (!theme || theme === 'default') {
    return ThemeDefaultWrapper;
  }

  if (!themeComponentCache.has(theme)) {
    themeComponentCache.set(theme, React.lazy(() => loadTheme(theme)));
  }

  return themeComponentCache.get(theme);
};

export default function ThemeSelector(props) {
  const { theme, children } = props;

  // The Mantine half of the theme: resolved here, applied at the app-root
  // provider through the @scalargis/ui client-theme registry (a nested
  // provider would leave portaled overlays unbranded). undefined while a
  // module theme is still loading, so switches never flash the base theme.
  const [clientTheme, setClientTheme] = React.useState(undefined);

  React.useEffect(() => {
    if (!theme || theme === 'default') {
      setClientTheme(null);
      return undefined;
    }

    // Every named theme is a module in themes/ (the shipped palette folders
    // and the client submodules alike — see themes/README.md). A module of
    // the post-B2 contract exports `mantineTheme` (built with
    // createClientTheme); Prime-era modules don't and explicitly fall back
    // to the base Mantine theme — their CSS still applies via the component.
    // An unknown name lands on loadTheme's default fallback: no export, so
    // the base theme, i.e. plain ADS.
    let cancelled = false;
    loadTheme(theme).then((mod) => {
      if (cancelled) return;
      setClientTheme(
        mod?.mantineTheme ? { name: theme, theme: mod.mantineTheme } : null
      );
    });
    return () => {
      cancelled = true;
    };
  }, [theme]);

  useApplyClientTheme(clientTheme);

  const Theme = getThemeComponent(theme);

  return (
    <>
      <React.Suspense fallback={<></>}>
        <Theme />
      </React.Suspense>
      {children}
    </>
  )
}
