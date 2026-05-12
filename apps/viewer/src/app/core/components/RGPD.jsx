import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router';
import { useTranslation} from "react-i18next";
import LoadingScreen from './LoadingScreen';
import SplashScreen from './SplashScreen';
import { useCookies } from 'react-cookie';
import CookieConsent from "react-cookie-consent";
import Cookies from 'universal-cookie';

import { i18n as i18nUtils } from '@scalargis/components';

import ThemeSelector from './ThemeSelector';

const cookieName = import.meta.env.VITE_APP_COOKIE_NAME || 'scalargis_rgpd';
const cookieValue = import.meta.env.VITE_APP_COOKIE_VALUE || '2';
const cookiePath = import.meta.env.VITE_APP_COOKIE_PATH || '/'; 
const cookieExpiresDays = parseInt(import.meta.env.VITE_APP_COOKIE_EXPIRES_DAYS || '150', 10);

function RGPD({ core, dispatch, children }) {

  const { i18n } = useTranslation();

  const location = useLocation();

  const [cookies] = useCookies([cookieName]);
  const [cookiergpd, setCookiergpd] = useState(cookies[cookieName]);

  const theme = core?.siteConfig?.theme || import.meta.env.VITE_APP_DEFAULT_THEME || 'default';

  function accept() {
    setCookiergpd(cookieValue);

    // Manually save cookie if using http access
    if (window.location.protocol === 'http:') {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + parseInt(cookieExpiresDays));
      const cookies = new Cookies();
      cookies.set(cookieName, cookieValue, { path: cookiePath, expires: expireDate,
        secure: false, httpOnly: false });
    }
  }

  const acceptText = i18nUtils.translateValue("accept", "Aceito");

  if (!core?.siteConfig?.loaded) {
    return (
      <ThemeSelector theme={theme}>
        <LoadingScreen />
      </ThemeSelector>
    );
  }
  
  if (core?.siteConfig?.rgpd != false && !location.pathname.toLocaleLowerCase().includes('/embedded/map')) {
    return (
      <ThemeSelector theme={theme}>
        <React.Fragment>
          { String(cookiergpd || '') !== String(cookieValue || '') && (
            <SplashScreen core={core} dispatch={dispatch} locale={i18n?.resolvedLanguage}>
              <CookieConsent
                location="bottom"
                buttonText={acceptText}
                ariaAcceptLabel={acceptText}
                cookieName={cookieName}
                cookieValue={cookieValue}
                expires={cookieExpiresDays}
                onAccept={accept}
                extraCookieOptions={{ path: cookiePath }}
                debug={true}
                cookieSecurity={false}
                disableStyles={true}
              >
              </CookieConsent>
            </SplashScreen>
          ) }
          
          { cookiergpd ? children : <></> }
        </React.Fragment>
      </ThemeSelector> 
    );
  }

  return (
    <ThemeSelector theme={theme}>
      {children}
    </ThemeSelector>
  );

} 

export default RGPD;