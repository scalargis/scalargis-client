// CSS order rule (migration2/mantine plan, kit 05): the Prime keeps first,
// then the Mantine block (@scalargis/ui: Mantine core → ads-tokens → ads-globals).
// These lines own that order for the whole backoffice — keep them at the top.
// saga-blue and primereact.min left with the last Prime widget (Phase 2 wave 3);
// primeicons and primeflex stay for good (plan §what does NOT migrate).
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import { AdsProviders } from '@scalargis/ui';

import React, {useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router';
import { Provider } from 'react-redux';

import AppContext, { core } from './AppContext';
import ScrollToTop from './core/components/ScrollToTop';
import RGPD from './core/components/RGPD';
import Routes from './core/containers/Routes';
import LoadingScreen from './core/components/LoadingScreen'
import { getBackofficeBaseUrl } from './core/utils';

import './core/components/index.css';

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
        if (module["getBackOfficePageRoutes"]) {
          return module.getBackOfficePageRoutes();
        }
        return [];
      }
      
      const routes = (config?.customComponents || []).map(async (item) => {
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
      .finally(()=> {
        setPagesLoaded(true);
      });
    }));
  }, []);

  return (
    <AdsProviders>
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
    </AdsProviders>
  );
}

export default App;    