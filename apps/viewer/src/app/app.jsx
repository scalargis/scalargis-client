import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useTranslation} from "react-i18next";
import { locale, addLocale } from 'primereact/api';

import AppContext, { core, mainMap } from './AppContext';
import RGPD from './core/components/RGPD';
import Routes from './core/containers/Routes';
import LoadingScreen from './core/components/LoadingScreen';
import { getAppBaseUrl } from './core/utils';


const App = () => {
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [pages, setPages] = useState([]);

  const { i18n } = useTranslation();

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
      
      let routes = (config?.customComponents || []).map(async (item) => {
        let mod = null;
        try {
          mod = await import(`./components/${item}/src/Main.jsx`);
        } catch (e1) {
          try {
            mod = await import(`./components/${item}/src/Main.tsx`);
          } catch (e2) {
            console.error(e2);
            return null;
          }
        }
        return _getRoutesInfo(mod);
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

  useEffect(() => {
    if (!i18n.resolvedLanguage) return;
    locale(i18n.resolvedLanguage);
  }, [i18n.resolvedLanguage]);

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
