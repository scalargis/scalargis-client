import React,{ useContext } from 'react';
import { Box } from '@mantine/core';

export const AppFooter = () => {
    
    return (
        <div className="layout-footer">
            <Box component="span" ml="xs" className="footer-text">&copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_ENTITY_NAME || ''}</Box>
        </div>
    );
}