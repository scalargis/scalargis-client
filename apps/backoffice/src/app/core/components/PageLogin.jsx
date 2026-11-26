import React, { useContext, useRef } from 'react'
import { useSelector } from 'react-redux';
import { Navigate, useNavigate, useLocation } from 'react-router';
import LoginWidget from './LoginWidget';
import AppContext from '../../AppContext';
import { getLoginRedirect } from '../utils';
import { Flex } from '@mantine/core';

function PageLogin(props) {
  const location = useLocation();
  const navigate = useNavigate();

  const history = {
    location,
    navigate
  }

  const redirect = getLoginRedirect(location.search);

  const token = useSelector(state => state.auth?.data?.token);
  const arrivedLogged = useRef(!!token);

  const { core } = useContext(AppContext);

  const { CLIENT_URL } = core;

  if (arrivedLogged.current && token) return <Navigate to={redirect} replace />;

  const logo = CLIENT_URL + 'assets/images/logo.png';
  return (
    <Flex id="login-page" align="center" justify="center" style={{ height: '100%' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem' }}>

        <div className="login-logo">
          <img alt="Logo" src={logo} />
        </div>

        <LoginWidget
          history={history}
          redirect={redirect}
        />

      </div>
  </Flex>
  )
}

export default PageLogin;
