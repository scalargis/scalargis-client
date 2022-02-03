import React, { Component } from 'react';
import { Button } from 'primereact/button';

export class AppFooter extends Component {

    render() {
        return  (
            <div className="layout-footer">
                <div className="footer-right">
                    <Button icon="pi pi-bars" iconPos="right" className="p-button-text p-button-plain" />
                </div>
                <span className="footer-text" style={{'marginRight': '5px'}}>&copy; 2021 Direção-Geral do Território</span>
            </div>
        );
    }
}