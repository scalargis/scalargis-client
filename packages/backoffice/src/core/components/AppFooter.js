import React from 'react';

export const AppFooter = () => {

    const CLIENT_URL = process.env.REACT_APP_CLIENT_URL || '';

    return (
        <div className="layout-footer">
            <span className="footer-text" style={{ 'marginLeft': '5px' }}>&copy; 2021 {process.env.REACT_APP_ENTITY_NAME || ''}</span>
        </div>
    );
}