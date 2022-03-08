import React from 'react'
import { withRouter } from 'react-router-dom'

const logo = (process.env.REACT_APP_CLIENT_URL || process.env.REACT_APP_BASE_URL || '') + 'assets/images/Logo_splash.png'
const message = "Este website usa cookies para melhorar a sua experiência de navegação. Ao pressionar 'Aceito' está a concordar com a sua utilização."

function SplashScreen({ history, children }) {
  return (
    <div className="splashscreen p-d-flex p-jc-center">
      <div className="p-as-center">

        <div className="login-logo p-text-center">
          <img alt="Logo" src={logo} />  
        </div>

        <h3>Bem-vindo!</h3>
        <p>
          { process.env.REACT_APP_COOKIE_MESSAGE || message }           
        </p>
        { process.env.REACT_APP_COOKIE_INFO_URL && (<p><a href={process.env.REACT_APP_COOKIE_INFO_URL} target="_blank" rel="noopener noreferrer">Mais informação</a></p>) }

        { children }

      </div>
  </div>
  )
}

export default withRouter(SplashScreen);