import React, { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import Viewer from './Viewer'
import ViewerEmbedded from './ViewerEmbedded'
import { Routes as ReactRoutes, Route, Navigate, useLocation } from 'react-router'
import LoadingScreen from '../components/LoadingScreen'
import ErrorBoundary from '../components/ErrorBoundary'

const Page404 = lazy(() => import('../components/Page404'))
const Page401 = lazy(() => import('../components/Page401'))
const PageLogin = lazy(() => import('./PageLogin'))
const PageRegistrationConfirmation = lazy(() => import('./PageRegistrationConfirmation'))
const PagePassword = lazy(() => import('./PagePassword'))

const Routes = ({core, pages}) => {

    const location = useLocation();
    const { t } = useTranslation();

    const pageError = <div role="alert" style={{ padding: '2rem' }}>{t('pageRenderError', 'Não foi possível mostrar esta página.')}</div>;

    return (
        <Suspense fallback={<LoadingScreen />}>
        <ReactRoutes>
            <Route path="/login" element={<PageLogin core={core} />} />
            <Route path="/registration" element={<PageRegistrationConfirmation core={core} />} />
            <Route path="/password" element={<PagePassword core={core}/>} />
            <Route path="/not-found" element={<Page404 core={core} />} />
            <Route path="/not-allowed" element={<Page401 core={core} />} />

            <Route path="/embedded/mapa/:id?" element={<ViewerEmbedded />} />
            <Route path="/embedded/map/:id?" element={<ViewerEmbedded />} />

            <Route path="/mapa/session/:id?" element={<Viewer />} />
            <Route path="/map/session/:id?" element={<Viewer />} />
            <Route path="/mapa/:id?" element={<Viewer />} />
            <Route path="/map/:id?" element={<Viewer />} />

            <Route path="/mapas/:id?" element={<Viewer />} />

            {pages.map((p, i) => {
                const CustomPage = p.children;
                return (
                    <Route key={i} path={p.path} element={
                        <ErrorBoundary name={p.path} fallback={pageError}>
                            <CustomPage core={core} />
                        </ErrorBoundary>
                    } />
                )
            })}

            <Route path="/:id" element={<Viewer />} />

            <Route path="/" element={core?.siteConfig?.home ? 
                <Navigate to={`${core.siteConfig.home}${location.search || ''}${location.hash || ''}`} /> : 
                <Navigate to={`/map/${location.search || ''}${location.hash || ''}`} />} 
            />

        </ReactRoutes>
        </Suspense>
    )
}

export default Routes;