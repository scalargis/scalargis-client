import React, { useMemo } from 'react'
import Viewer from './Viewer'
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import { Provider } from 'react-redux'
import HomePage from '../components/HomePage'
import Page404 from '../components/Page404'
import Page401 from '../components/Page401'
import AppContext, { core, mainMap } from '../../AppContext'
import PageLogin from '../components/PageLogin'
import PageRegistrationConfirmation from '../components/PageRegistrationConfirmation'
import PagePassword from '../components/PagePassword'
import RGPD from '../components/RGPD'
import { getAppBaseUrl } from '../utils'

//import { useTranslation } from 'react-i18next';

const App = () => {

  const base_url = getAppBaseUrl();

  /*
  const { t } = useTranslation();
  const s = t('welcome');
  console.log(s);
  */

  return (
    <React.StrictMode>
      <AppContext.Provider value={{ core, mainMap }}>
        <Provider store={core.store}>
          <Router basename={base_url}>
            <RGPD>
              <Switch>
                <Route path="/login" children={<PageLogin />} />
                <Route path="/registration" children={<PageRegistrationConfirmation />} />
                <Route path="/password" children={<PagePassword/>} />
                <Route path="/not-found" children={<Page404 />} />
                <Route path="/not-allowed" children={<Page401 />} />
                <Route path="/mapa/session/:id?" children={<Viewer />} />
                <Route path="/map/session/:id?" children={<Viewer />} />
                <Route path="/mapa/:id?" children={<Viewer />} />
                <Route path="/map/:id?" children={<Viewer />} />
                <Route path="/:id" children={<Viewer />} />
                {/*
                <Route path="/:id" render={(props) => {
                    console.log(props);
                    return <Redirect to={`/map/${props.match.params.id || ''}${props.location.search || ''}`} />
                }} />
                */}
                {/*
                <Route path="/" children={<HomePage />} />
                */}
                <Route path="/" render={(props) => {
                    return <Redirect to={`/map/${props.location.search || ''}`} />
                }} />
              </Switch>
            </RGPD>
          </Router>
        </Provider>
      </AppContext.Provider>
    </React.StrictMode>
  )
}

export default App;