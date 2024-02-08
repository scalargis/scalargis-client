import React, { useContext } from 'react';
import { useTranslation} from "react-i18next";
import { withRouter } from 'react-router-dom';
import AppContext from '../../AppContext';


function SplashScreen(props) {

  const { history, children } = props;

  const { t } = useTranslation();

  const { core } = useContext(AppContext);

  const { CLIENT_URL } = core;

  const defaultLogo = CLIENT_URL + 'assets/images/logo-splash.png';
  const viewerLogo = CLIENT_URL + 'assets/images' + (props.location.pathname || '') + '/logo-splash.png';

  const addDefaultSrc = (ev) => {
    ev.target.src = defaultLogo;
  }

  const message = t("defaultRGPDmsg", "Este website usa cookies para melhorar a sua experiência de navegação. Ao pressionar 'Aceito' está a concordar com a sua utilização.");

  return (
    <div className="splashscreen p-d-flex p-jc-center">
      <div className="p-as-center">

        <div className="login-logo p-text-center">
          <img onError={addDefaultSrc} className="img-responsive" src={viewerLogo} alt="Logo" style={{maxWidth: "100%"}} />  
        </div>

        <h3>{`${t("welcome", "Bem-vindo")}!`}</h3>
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

export default withRouter(SplashScreen);