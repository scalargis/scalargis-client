import React,{ useContext } from 'react';

export const AppFooter = () => {
    
    return (
        <div className="layout-footer">
            <span className="footer-text ml-2">&copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_ENTITY_NAME || ''}</span>
        </div>
    );
}