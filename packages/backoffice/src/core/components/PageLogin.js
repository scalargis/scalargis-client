import React, { useContext } from 'react'
import { withRouter } from 'react-router-dom';
import LoginWidget from './LoginWidget';
import AppContext from '../../AppContext';

function PageLogin(props) {
  const { search } = props.location;
  const foundRedirect = /redirect=(.*)/i.exec(search);

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
          history={props.history}
          redirect={foundRedirect ? foundRedirect[1] : null }
        />

      </div>
  </div>
  )
}

export default withRouter(PageLogin);