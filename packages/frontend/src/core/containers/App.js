import React from 'react'
import Viewer from './Viewer'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import Page404 from '../components/Page404'
import Page401 from '../components/Page401'
import AppContext, { core, mainMap } from '../../AppContext'
import PageLogin from '../components/PageLogin'
import RGPD from '../components/RGPD'

function App() {
  return (
    <React.StrictMode>
      <AppContext.Provider value={{ core, mainMap }}>
        <Provider store={core.store}>
          <Router basename={core.config.BASE_URL}>
            <RGPD>
              <Switch>
                <Route path="/login" children={<PageLogin />} />
                <Route path="/not-found" children={<Page404 />} />
                <Route path="/not-allowed" children={<Page401 />} />
                <Route path="/session/:id?" children={<Viewer />} />
                <Route path="/:id?" children={<Viewer />} />
              </Switch>
            </RGPD>
          </Router>
        </Provider>
      </AppContext.Provider>
    </React.StrictMode>
  )
}

export default App;