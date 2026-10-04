import React, { useContext } from 'react'
import { useNavigate, useLocation } from 'react-router';
import LoginWidget from './LoginWidget';
import AppContext from '../../AppContext';
import { Flex } from '@mantine/core';

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
    <Flex id="login-page" align="center" justify="center" style={{ height: '100%' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem' }}>
        
        <div className="login-logo">
          <img alt="Logo" src={logo} />  
        </div>
        
        <LoginWidget
          history={history}
          redirect={foundRedirect ? foundRedirect[1] : null }
        />

      </div>
  </Flex>
  )
}

export default PageLogin;