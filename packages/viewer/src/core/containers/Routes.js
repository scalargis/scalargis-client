import React from 'react'
import Viewer from './Viewer'
import { BrowserRouter as Router, Routes as ReactRoutes, Route, Navigate, useLocation } from 'react-router-dom'
import HomePage from '../components/HomePage'
import Page404 from '../components/Page404'
import Page401 from '../components/Page401'
import PageLogin from '../components/PageLogin'
import PageRegistrationConfirmation from '../components/PageRegistrationConfirmation'
import PagePassword from '../components/PagePassword'

const Routes = ({core, pages}) => {

    const location = useLocation();

    return (
        <ReactRoutes>
            <Route path="/login" element={<PageLogin />} />
            <Route path="/registration" element={<PageRegistrationConfirmation />} />
            <Route path="/password" element={<PagePassword/>} />
            <Route path="/not-found" element={<Page404 />} />
            <Route path="/not-allowed" element={<Page401 />} />
            <Route path="/mapa/session/:id?" element={<Viewer />} />
            <Route path="/map/session/:id?" element={<Viewer />} />
            <Route path="/mapa/:id?" element={<Viewer />} />
            <Route path="/map/:id?" element={<Viewer />} />

            <Route path="/mapas/:id?" element={<Viewer />} />
            
            {/*
            {pages.map((p, i) => {
                const CustomPage = p.children;
                return (
                    <Route key={i} path={p.path} render={(props) => {
                    return (
                        <CustomPage
                        core={core}
                        action={props.match.params.action} />
                    )
                    }} />
                )
            })}
            */}

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