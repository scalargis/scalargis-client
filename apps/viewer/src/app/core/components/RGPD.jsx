import React, { useState, useMemo } from 'react';
//import { useTranslation} from "react-i18next";
import SplashScreen from './SplashScreen';
import { withCookies } from 'react-cookie';
import CookieConsent from "react-cookie-consent";
import Cookies from 'universal-cookie';

import { i18n as i18nUtils } from '@scalargis/components';

import ThemeSelector from './ThemeSelector';

const cookieName = import.meta.env.VITE_APP_COOKIE_NAME || 'scalargis_rgpd';
const cookieValue = import.meta.env.VITE_APP_COOKIE_VALUE || '2';
const cookiePath = import.meta.env.VITE_APP_COOKIE_PATH || ''; 
const cookieExpiresDays = parseInt(import.meta.env.VITE_APP_COOKIE_EXPIRES_DAYS || '150', 10);

function RGPD({ cookies, children }) {

  //const { t } = useTranslation();

  const [cookiergpd, setCookiergpd] = useState(cookies.get(cookieName));

  let theme = import.meta.env.VITE_APP_DEFAULT_THEME || 'default';

  function accept() {
    setCookiergpd(cookieValue);

    // Manually save cookie if using http access
    if (window.location.protocol === 'http:') {
      let expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + parseInt(cookieExpiresDays));
      const cookies = new Cookies();
      cookies.set(cookieName, cookieValue, { path: cookiePath, expires: expireDate,
        secure: false, httpOnly: false });
    }
  }

  const acceptText = i18nUtils.translateValue("accept", "Aceito");

  return (
    <ThemeSelector theme={theme}>
      <React.Fragment>
        { String(cookiergpd || '') !== String(cookieValue || '') && (
          <SplashScreen>
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
        
        {/* cookiergpd ? children : <SplashScreen /> */}
        { cookiergpd ? children : <></> }
      </React.Fragment>
    </ThemeSelector> 
  );
} 

export default withCookies(RGPD);