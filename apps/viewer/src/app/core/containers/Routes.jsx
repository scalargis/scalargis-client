import React from 'react'
import Viewer from './Viewer'
import ViewerEmbedded from './ViewerEmbedded'
import { Routes as ReactRoutes, Route, Navigate, useLocation } from 'react-router'
import HomePage from '../components/HomePage'
import Page404 from '../components/Page404'
import Page401 from '../components/Page401'
import PageLogin from './PageLogin'
import PageRegistrationConfirmation from './PageRegistrationConfirmation'
import PagePassword from './PagePassword'

const Routes = ({core, pages}) => {

    const location = useLocation();

    return (
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
                    <Route key={i} path={p.path} element={<CustomPage core={core} />} />
                )
            })}

            <Route path="/:id" element={<Viewer />} />

            <Route path="/" element={core?.siteConfig?.home ? 
                <Navigate to={`${core.siteConfig.home}${location.search || ''}${location.hash || ''}`} /> : 
                <Navigate to={`/map/${location.search || ''}${location.hash || ''}`} />} 
            />

        </ReactRoutes>
    )
}

export default Routes;