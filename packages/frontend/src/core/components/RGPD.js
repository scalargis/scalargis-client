import React, { useState } from 'react';
import SplashScreen from './SplashScreen';
import { withCookies } from 'react-cookie';
import CookieConsent from "react-cookie-consent";
import Cookies from 'universal-cookie';

const cookieName = process.env.REACT_APP_COOKIE_NAME || 'websig_dgt_rgpd';
const cookieValue = process.env.REACT_APP_COOKIE_VALUE || '2';
const cookiePath = process.env.REACT_APP_COOKIE_PATH || '/';
const cookieExpiresDays = parseInt(process.env.REACT_APP_COOKIE_EXPIRES_DAYS || '150', 10);

function RGPD({ cookies, children }) {

  const [cookiergpd, setCookiergpd] = useState(cookies.get(cookieName));

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
    <React.Fragment>

      { cookiergpd !== cookieValue && (
        <CookieConsent
          location="bottom"
          buttonText="Aceito"
          cookieName={cookieName}
          cookieValue={cookieValue}
          style={{ background: "#2B373B" }}
          buttonStyle={{ color: "#4e503b", fontSize: "13px" }}
          expires={cookieExpiresDays}
          onAccept={accept}
          extraCookieOptions={{ path: cookiePath }}
          debug={true}
          cookieSecurity={false}
        >
          Este website usa cookies para melhorar a experiência do utilizador
        </CookieConsent>
      ) }
      
      { cookiergpd ? children : <SplashScreen /> }
    </React.Fragment> 
  );
} 

export default withCookies(RGPD);