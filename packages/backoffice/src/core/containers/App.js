import React, {useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import AppContext, { core } from '../../AppContext';
import ScrollToTop from '../components/ScrollToTop';
import RGPD from '../components/RGPD';
import Routes from './Routes';
import LoadingScreen from './../components/LoadingScreen'
import { getBackofficeBaseUrl } from '../utils';

import '../components/index.css';

const App = () => {
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [pages, setPages] = useState([]);

  let base_url = getBackofficeBaseUrl();
  if (base_url?.length && base_url.length > 1 && base_url.endsWith("/")) {
    base_url = base_url.slice(0, -1);
  }

  useEffect(()=> {
    const {actions} = core;
    const {site_load} = actions;
    const dispatch = core.store.dispatch;

    dispatch(site_load(core, (config) => {
      const _getRoutesInfo = (module) => {
        if (!!module["getBackOfficePageRoutes"]) {
          return module.getBackOfficePageRoutes();
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
    }));
  }, []);

  return (
      <React.StrictMode>
          <AppContext.Provider value={{ core }}>
              <Provider store={core.store}>           
                  <Router basename={base_url}>
                      <ScrollToTop>                        
                          <RGPD>
                              {pagesLoaded ? <Routes core={core} pages={pages} /> : <LoadingScreen />}
                          </RGPD>
                      </ScrollToTop>
                  </Router>
              </Provider>
          </AppContext.Provider>
      </React.StrictMode>
  );
}

export default App;    