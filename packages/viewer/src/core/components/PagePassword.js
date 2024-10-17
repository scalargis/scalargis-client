import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PasswordWidget from './PasswordWidget';
import AppContext from '../../AppContext';

function PagePassword(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate()

  const history = {
    location,
    navigate
  }

  const { search } = location

  const { core } = useContext(AppContext);

  const { CLIENT_URL } = core;
  
  const query = new URLSearchParams(search);
  const token = query.get('token');

  const foundRedirect = /redirect=(.*)/i.exec(search);
  const foundUrlRedirect = /url_redirect=(.*)/i.exec(search);
  
  // Render page
  const logo = CLIENT_URL + 'assets/images/logo.png';

  useEffect(() => {
    //console.log(token);
  }, []);

  return (
    <div id="login-page" className="p-d-flex p-jc-center" style={{ height: '100%' }}>
      <div className="p-as-center" style={{ backgroundColor: 'white', padding: '6rem', maxWidth: '700px' }}>
        
        <div className="login-logo">
          <img alt="Logo" src={logo} />  
        </div>        
        
        <PasswordWidget
          token={token}
          history={history}
          redirect={foundRedirect ? foundRedirect[1] : null }
          urlRedirect={foundUrlRedirect ? foundUrlRedirect[1] : null }
        />

      </div>
  </div>
  )
}

export default PagePassword;