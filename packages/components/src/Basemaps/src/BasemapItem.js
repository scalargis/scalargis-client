import React, { useEffect, useState } from 'react'
import { Card } from 'primereact/card';

import './style.css'

export default function BasemapItem({ core, viewer, mainMap, layer, selected, setSelected }) {

    const { CLIENT_URL } = core;

    const title = layer.title || '';
    const subtitle = layer.description || '';

    const img = CLIENT_URL + (layer.thumbnail || 'assets/images/basemaps/terrain.jpg');

    const header = <img alt="Card" src={img} className={ !selected ? 'disabled' : ''}
                        title={(selected ? 'Clicar para desligar' : 'Clicar para ligar' )}
                        onClick={() => setSelected(selected ? null : layer.id) } />

    const itemClass = 'p-mr-2 p-mb-1 basemaps-control-item' + (selected ? ' active' : '');

    return (
        <div className={itemClass}>
            <Card className="p-text-center" title={title} subTitle={subtitle} header={header}></Card>                        
        </div>
    )
}