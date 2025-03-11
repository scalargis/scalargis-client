import React from 'react';

import ThemeDefault from '../../core/themes/default/main';

export default function ThemeSelector(props) {
  const { theme, children } = props;
  
  let Theme = null;

  if (!theme || theme === 'default') {
    Theme = () => <ThemeDefault />
  } else {
    Theme = React.lazy(() => import(`../../themes/${theme}/src/main.jsx`).catch(error =>
      import(`../../core/themes/${theme}/main.jsx`).catch(error => {
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