// CSS order rule: the Prime keeps first,
// then the Mantine block (@scalargis/ui: Mantine core → ads-tokens → ads-globals).
// These lines own that order for the whole backoffice — keep them at the top.
// saga-blue and primereact.min left with the last Prime widget (Phase 2 wave 3),
// and primeflex left with the backoffice page shell. primeicons stays for good.
import 'primeicons/primeicons.css';

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
import { loadComponentModule } from './componentModules';

import './core/components/index.css';

const App = () => {
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [pages, setPages] = useState([]);

  let base_url = getBackofficeBaseUrl();
  if (base_url?.length && base_url.length > 1 && base_url.endsWith("/")) {
    base_url = base_url.slice(0, -1);
  }

  // react-router >= 6 renders nothing when the URL lives outside the basename;
  // the v5 router matched from the root instead, which kept /login, /not-found
  // and /not-allowed working without the /backoffice prefix. Keep that
  // tolerance: reached outside the base path, match routes from the root.
  const { pathname } = window.location;
  const basename = pathname === base_url || pathname.startsWith(`${base_url}/`)
    ? base_url : '/';

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
        try {
          const mod = await loadComponentModule(item);
          return mod ? _getRoutesInfo(mod) : null;
        } catch (e) {
          console.error(e);
          return null;
        }
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
              <Router basename={basename}>
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