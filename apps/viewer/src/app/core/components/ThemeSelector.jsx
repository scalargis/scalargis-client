import React from 'react';

import ThemeDefault from '../../core/themes/default/main';

export default function ThemeSelector(props) {
  const { theme, children } = props;
  
  let Theme = null;

  if (!theme || theme === 'default') {
    Theme = () => <ThemeDefault />
  } else {
    Theme = React.lazy(async () => {
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
                return null;
              }
            }
          }
        }
        
        if (!thm) {
          console.error("Standard Theme Failed Loading:", error);
          return { default: () => <ThemeDefault /> }
        }
        
        return thm;
      }
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