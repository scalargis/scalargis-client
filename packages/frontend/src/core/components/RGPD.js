import React, { useState } from 'react';
import SplashScreen from './SplashScreen';
import { withCookies } from 'react-cookie';
import CookieConsent from "react-cookie-consent";
import Cookies from 'universal-cookie';
import ThemeSelector from './ThemeSelector'

const cookieName = process.env.REACT_APP_COOKIE_NAME || 'scalargis_rgpd';
const cookieValue = process.env.REACT_APP_COOKIE_VALUE || '2';
const cookiePath = process.env.REACT_APP_COOKIE_PATH || '/';
const cookieExpiresDays = parseInt(process.env.REACT_APP_COOKIE_EXPIRES_DAYS || '150', 10);

function RGPD({ cookies, children }) {

  const [cookiergpd, setCookiergpd] = useState(cookies.get(cookieName));

  let theme = process.env.REACT_APP_DEFAULT_THEME || 'default';

  function accept() {
    setCookiergpd(cookieValue);

    // Manually save cookie if using http access
    if (window.location.protocol === 'http:') {
      let expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + parseInt(cookieExpiresDays));
      const cookies = new Cookies();
      cookies.set(cookieName, cookieValue, { path: cookiePath, expires: expireDate, path: cookiePath,
        secure: false, httpOnly: false });
    }
  }

  return (
    <ThemeSelector theme={theme}>
      <React.Fragment>
        { cookiergpd !== cookieValue && (
          <SplashScreen>
            <CookieConsent
              location="bottom"
              buttonText="Aceito"
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