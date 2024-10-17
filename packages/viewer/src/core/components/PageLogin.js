import React, { useContext }  from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginWidget from './LoginWidget';
import AppContext from '../../AppContext';

function PageLogin(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const history = {
    location,
    navigate
  }

  const { search } = location;

  const params = new URLSearchParams(search)
  const redirect = params.get('redirect');
  const path = params.get('path');
  const url_redirect = params.get('url_redirect');

  const { core } = useContext(AppContext);

  const { CLIENT_URL } = core;

  // Render page
  const logo = CLIENT_URL + 'assets/images/logo.png';
  return (
    <div id="login-page" className="p-d-flex p-jc-center" style={{ height: '100%' }}>
      <div className="p-as-center" style={{ backgroundColor: 'white', padding: '6rem' }}>
        
        <div className="login-logo">
          <img alt="Logo" src={logo} />  
        </div>
        
        <LoginWidget
          history={history}
          redirect={redirect || null}
          path={path || null}
          urlRedirect = {url_redirect || null}
        />

      </div>
  </div>
  )
}

export default PageLogin;