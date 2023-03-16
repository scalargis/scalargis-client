import React, { useContext }  from 'react';
import { withRouter } from 'react-router-dom';
import AppContext from '../../AppContext';

function SplashScreen({ history }) {

  const { core } = useContext(AppContext);

  const { CLIENT_URL } = core;

  // Render page
  const logo = CLIENT_URL + 'assets/images/logo-splash.png'
  return (
    <div className="p-d-flex p-jc-center" style={{ height: '100%' }}>
      <div className="p-as-center" style={{ backgroundColor: 'white', padding: '6rem' }}>

        <div className="login-logo">
          <img alt="Logo" src={logo} />  
        </div>

        <p>Bem-vindo!</p>
        <p>Para continuar, por favor aceite a nossa política de privacidade.</p>
      </div>
  </div>
  )
}

export default withRouter(SplashScreen);