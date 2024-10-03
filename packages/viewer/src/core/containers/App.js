import React, { useEffect, useState } from 'react'
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
import { getAppBaseUrl, getAppApiUrl } from '../utils'

//import { useTranslation } from 'react-i18next';


const App = () => {

  const base_url = getAppBaseUrl();

  const API_URL = getAppApiUrl();

  /*
  const { t } = useTranslation();
  const s = t('welcome');
  console.log(s);
  */

  const [configLoaded, setConfigLoaded] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [config, setConfig] = useState();
  const [pages, setPages] = useState([]);


  useEffect(()=> {
      const url = API_URL + '/app/site/config';

      fetch(url)
        .then(resp => { 
            return resp.json();
        })
        .then(data => {
            setConfig(data);
        })
        .catch(error => {
            console.log(error);
        })
        .finally(()=>setConfigLoaded(true));
  }, []);

  useEffect(() => {
      if (!configLoaded) return;

      const _getRoutesInfo = (module) => {
          if (!!module["getPageRoutes"]) {
            return module.getPageRoutes();
          }
          return [];
        }
  
      let routes = (config?.customComponents || []).map(async item => {
          return await import(`./../../components/${item}/src/Main.js`)
            .then(module => _getRoutesInfo(module)).catch((error) => {console.log(error); return null})
      });
  
      return Promise.all(routes).then((result) => {
        return result.flat();
      }).then(data => {
        //Filter out invalid elements
        const validData = (data || []).filter(d => d != null); 
        setPages(validData);
      })
      .catch(error => {
          console.log(error);
      })
      .finally(()=> {setPagesLoaded(true)});
  },[configLoaded]);

  if (!pagesLoaded) return null;

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

                <Route path="/mapas/:id?" children={<Viewer />} />
                
                {pages.map((p, i) => {
                  const CustomPage = p.children;
                  return (
                    <Route key={i} path={p.path} render={(props) => {
                      return (
                          <CustomPage
                          core={core}
                          action={props.match.params.action} />
                      )
                    }} />
                  )
                })}

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