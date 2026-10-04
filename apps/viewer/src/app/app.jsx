// CSS order rule: global CSS first, then
// the Mantine block (@scalargis/ui: Mantine core → ads-tokens → ads-globals).
// These lines own that order for the whole viewer — keep them at the top.
// primeicons stays (the recipe icons ARE primeicons);
// primeflex utility classnames are still used and leave in Phase 5.
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import { AdsProviders } from '@scalargis/ui';

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router';
import { Provider } from 'react-redux';

import AppContext, { core, mainMap } from './AppContext';
import RGPD from './core/components/RGPD';
import Routes from './core/containers/Routes';
import LoadingScreen from './core/components/LoadingScreen';
import { getAppBaseUrl } from './core/utils';
import { importComponentModule } from './componentModules';


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
        if (module["getPageRoutes"]) {
          return module.getPageRoutes();
        }
        return [];
      }
      
      const _mods = (config?.customComponents || []).map(item =>
        importComponentModule(item)
          .then(mod => ({ type: item, module: mod }))
          .catch(error => {
            console.error(error);
            return null;
          })
      );

      return Promise.all(_mods).then((result) => {
        return result.flat();
      }).then(data => {
        const pgs = [];
        const elems = (data || []).filter(d => d != null);
        elems.forEach(d => {
          // Register component widgets
          if (d?.module?.widgets) core.registerComponentWidgets(d.type, d.module.widgets);
          // Load component translations
          if (d?.module?.translations && typeof d?.module?.translations === 'object') {
            d?.module?.translations?.load && d?.module?.translations.load();
          }
          //Load component page routes
          if (d?.module?.getPageRoutes) {
            const _routes = d?.module?.getPageRoutes();
            if (_routes?.length) pgs.push(..._routes);
          }
        });
        setPages(pgs);
      })
      .catch(error => {
          console.log(error);
      })
      .finally(()=> {setPagesLoaded(true)});

    }));
  }, []);

  return (
    <AdsProviders>
      <AppContext.Provider value={{ core, mainMap }}>
        <Provider store={core.store}>
          <Router basename={base_url}>
            <RGPD core={core} dispatch={dispatch}>
              {pagesLoaded ? <Routes core={core} pages={pages} /> : <LoadingScreen />}
            </RGPD>
          </Router>
        </Provider>
      </AppContext.Provider>
    </AdsProviders>
  )
}

export default App;
