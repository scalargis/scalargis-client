import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';

import AppContext, { core, mainMap } from './AppContext';
import RGPD from './core/components/RGPD';
import Routes from './core/containers/Routes';
import LoadingScreen from './core/components/LoadingScreen';
import { getAppBaseUrl } from './core/utils';


const App = () => {
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [pages, setPages] = useState([]);

  const base_url = getAppBaseUrl();

  const dispatch = core?.store?.dispatch;

  useEffect(()=> {
    const {actions} = core;
    const {site_load} = actions;

    dispatch(site_load(core, (config) => {
      const _getRoutesInfo = (module) => {
        if (!!module["getPageRoutes"]) {
          return module.getPageRoutes();
        }
        return [];
      }
      
      let routes = (config?.customComponents || []).map(async item => {
          return await import(`./components/${item}/src/Main.jsx`)
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
    <AppContext.Provider value={{ core, mainMap }}>
      <Provider store={core.store}>
        <Router basename={base_url}>
          <RGPD core={core} dispatch={dispatch}>
            {pagesLoaded ? <Routes core={core} pages={pages} /> : <LoadingScreen />}
          </RGPD>
        </Router>
      </Provider>
    </AppContext.Provider>
  )
}

export default App;
