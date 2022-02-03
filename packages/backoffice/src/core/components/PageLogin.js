import React from 'react'
import { withRouter } from 'react-router-dom';
import LoginWidget from './LoginWidget';

function PageLogin(props) {
  const { search } = props.location;
  const foundRedirect = /redirect=(.*)/i.exec(search);

  // Render page
  const logo = (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + 'assets/images/Logo.png';
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