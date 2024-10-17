import React, { useContext } from 'react';
import { useTranslation} from "react-i18next";
import { useLocation } from 'react-router-dom';
import AppContext from '../../AppContext';


function SplashScreen(props) {

  console.log(props);

  const { children } = props;

  const { t } = useTranslation();

  const { core } = useContext(AppContext);

  const location = useLocation();

  const { CLIENT_URL } = core;

  const defaultLogo = CLIENT_URL + 'assets/images/logo-splash.png';
  const viewerLogo = CLIENT_URL + 'assets/images' + (location.pathname || '') + '/logo-splash.png';

  const addDefaultSrc = (ev) => {
    ev.target.src = defaultLogo;
  }

  const message = t("defaultRGPDmsg", "Este website usa cookies para melhorar a sua experiência de navegação. Ao pressionar 'Aceito' está a concordar com a sua utilização.");

  return (
    <div className="splashscreen p-d-flex p-jc-center">
      <div role="main" className="p-as-center">

        <div className="login-logo p-text-center">
          <img onError={addDefaultSrc} className="img-responsive" src={viewerLogo} alt="Logo" style={{maxWidth: "100%"}} />  
        </div>

        <h1>{`${t("welcome", "Bem-vindo")}!`}</h1>
        <p>
          { process.env.REACT_APP_COOKIE_MESSAGE ? 
            t(process.env.REACT_APP_COOKIE_MESSAGE, process.env.REACT_APP_COOKIE_MESSAGE)  
            : message }
        </p>
        { process.env.REACT_APP_COOKIE_INFO_URL && (<p><a href={process.env.REACT_APP_COOKIE_INFO_URL} target="_blank" rel="noopener noreferrer">{t("moreInformation", "Mais informação")}</a></p>) }

        { children }

      </div>
  </div>
  )
}

export default SplashScreen;