import React from 'react';

export default function ThemeSelector(props) {
  const { theme, children } = props;
  
  let Theme = null;

  if (!theme || theme === 'default') {
    Theme = React.lazy(() => import(/* @vite-ignore */'../../themes/default/main'));
  } else {
    Theme = React.lazy(() => import(/* @vite-ignore */'../../themes/' + theme + '/main'));
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