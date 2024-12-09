import React,{ useContext }  from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import RegistrationConfirmationWidget from './RegistrationConfirmationWidget';
import AppContext from '../../AppContext';

function PageRegistrationConfirmation(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate()

  const history = {
    location,
    navigate
  }

  const { search } = location;

  const { core } = useContext(AppContext);

  const { CLIENT_URL } = core;
  
  const query = new URLSearchParams(search);
  const token = query.get('token');

  const foundRedirect = /redirect=(.*)/i.exec(search);
  const foundUrlRedirect = /url_redirect=(.*)/i.exec(search);
  

  // Render page
  const logo = CLIENT_URL + 'assets/images/logo.png';

  return (
    <div id="login-page" className="flex justify-content-center" style={{ height: '100%' }}>
      <div className="align-self-center p-6 sm:p-8" style={{ backgroundColor: 'white' }}>
        
        <div className="login-logo">
          <img alt="Logo" src={logo} />  
        </div>
        
        <RegistrationConfirmationWidget
          token={token}
          history={history}
          redirect={foundRedirect ? foundRedirect[1] : null }
          urlRedirect={foundUrlRedirect ? foundUrlRedirect[1] : null }
        />

      </div>
  </div>
  )
}

export default PageRegistrationConfirmation ;