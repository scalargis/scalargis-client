import React from 'react'
//import Viewer from './Viewer'
import Backoffice from './Backoffice'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import Page404 from '../components/Page404'
import Page401 from '../components/Page401'
import AppContext, { core } from '../../AppContext'
import PageLogin from '../components/PageLogin'
import ScrollToTop from '../components/ScrollToTop'
import RGPD from '../components/RGPD'
import '../components/index.css'

const App = () => {

    return (
        <React.StrictMode>
            <AppContext.Provider value={{ core }}>
                <Provider store={core.store}>           
                    <Router basename={core.config.BASE_URL}>
                        <ScrollToTop>                        
                            <RGPD>
                                <Switch>
                                    <Route path="/login" children={<PageLogin />} />
                                    <Route path="/not-found" children={<Page404 />} />
                                    <Route path="/not-allowed" children={<Page401 />} />
                                    <Route path="/" children={<Backoffice />} />
                                </Switch>
                            </RGPD>
                        </ScrollToTop>
                    </Router>
                </Provider>
            </AppContext.Provider>
        </React.StrictMode>
    );

}

export default App;    