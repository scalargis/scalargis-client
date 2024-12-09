import React, { useContext } from 'react'
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
  const foundRedirect = /redirect=(.*)/i.exec(search);

  const { core } = useContext(AppContext);

  const { CLIENT_URL } = core;

  // Render page
  const logo = CLIENT_URL + 'assets/images/logo.png';
  return (
    <div id="login-page" className="flex align-items-center justify-content-center" style={{ height: '100%' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem' }}>
        
        <div className="login-logo">
          <img alt="Logo" src={logo} />  
        </div>
        
        <LoginWidget
          history={history}
          redirect={foundRedirect ? foundRedirect[1] : null }
        />

      </div>
  </div>
  )
}

export default PageLogin;