import React from 'react';

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

  //const theme = 'mapaspt';
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
