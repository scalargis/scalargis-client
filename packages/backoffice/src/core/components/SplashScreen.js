import React from 'react'
import { withRouter } from 'react-router-dom'

const logo = (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + 'assets/images/Logo_splash.png'

function SplashScreen({ history }) {
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