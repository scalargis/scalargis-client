import React from 'react';

import ThemeDefault from '../../core/themes/default/main';

export default function ThemeSelector(props) {
  const { theme, children } = props;
  
  let Theme = null;

  if (!theme || theme === 'default') {
    Theme = () => <ThemeDefault />
  } else {
    Theme = React.lazy(() => import(/* @vite-ignore */`../../themes/${theme}/src/main`).catch(error => 
      import(/* @vite-ignore */`../../core/themes/${theme}/main`).catch(error => {
          console.error("Custom Theme Failed Loading:", error);
          return { default: () => <ThemeDefault /> }
        }
      )).catch(error => {
        console.error("Standard Theme Failed Loading:", error);
        return { default: () => <ThemeDefault /> }
      })
    );
  }

  return (
    <>
      <React.Suspense fallback={<></>}>
        <Theme />
      </React.Suspense>
      {children}
    </>
  )
}