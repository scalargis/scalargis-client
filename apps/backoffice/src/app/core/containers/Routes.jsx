import React from 'react';
import { Routes as ReactRoutes, Route, Navigate, useLocation } from 'react-router-dom';
import Page404 from '../components/Page404';
import Page401 from '../components/Page401';
import PageLogin from '../components/PageLogin';
import Backoffice from './Backoffice';

const Routes = ({core, pages}) => {

    const location = useLocation();

    return (
        <ReactRoutes>
            <Route path="/login" element={<PageLogin />} />
            <Route path="/not-found" element={<Page404 />} />
            <Route path="/not-allowed" element={<Page401 />} />
            
            {pages.map((p, i) => {
                const CustomPage = p.children;
                return (
                    <Route key={i} path={p.path} element={<CustomPage core={core} />} />
                )
            })}

            <Route path="/*" element={core?.siteConfig?.backoffice ? 
                <Navigate to={`${core.siteConfig.backoffice}${location.search || ''}${location.hash || ''}`} /> : 
                <Backoffice />} 
            />

        </ReactRoutes>
    )
}

export default Routes;