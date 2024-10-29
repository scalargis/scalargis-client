import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';

import AppContext, { core, mainMap } from '../../AppContext';
import RGPD from '../components/RGPD';
import Routes from './Routes';
import LoadingScreen from './../components/LoadingScreen';
import { getAppBaseUrl } from '../utils';

//import { useTranslation } from 'react-i18next';


const App = () => {

  /*
  const { t } = useTranslation();
  const s = t('welcome');
  console.log(s);
  */

  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [pages, setPages] = useState([]);

  const base_url = getAppBaseUrl();

  useEffect(()=> {
    const {actions} = core;
    const {site_load} = actions;
    const dispatch = core.store.dispatch;

    dispatch(site_load(core, (config) => {
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
    }));
  }, []);

  return (
    <AppContext.Provider value={{ core, mainMap }}>
      <Provider store={core.store}>
        <Router basename={base_url}>
          <RGPD>
            {pagesLoaded ? <Routes core={core} pages={pages} /> : <LoadingScreen />}
          </RGPD>
        </Router>
      </Provider>
    </AppContext.Provider>
  )
}

export default App;
