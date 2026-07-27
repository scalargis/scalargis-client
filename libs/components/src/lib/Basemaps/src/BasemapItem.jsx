import React from 'react';
import { useTranslation} from "react-i18next";
import { UnstyledButton } from '@mantine/core';

import './style.css'

export default function BasemapItem({ core, viewer, mainMap, layer, selected, setSelected }) {

    const { CLIENT_URL } = core;

    const title = layer.title || '';
    const subtitle = layer.description || '';

    const { t } = useTranslation();

    const img = CLIENT_URL + (layer.thumbnail || 'assets/images/basemaps/terrain.jpg');

    const itemClass = 'mr-2 mb-1 basemaps-control-item' + (selected ? ' active' : '');

    return (
        <div className={itemClass}>
            <div className="basemap-card text-center">
                <UnstyledButton
                    className="basemap-card-header"
                    title={(selected ? t('clickTurnOff', 'Clicar para desligar') : t('clickTurnOn', 'Clicar para ligar') )}
                    aria-label={title}
                    aria-pressed={selected || false}
                    onClick={() => setSelected(selected ? null : layer.id) }
                >
                    <img alt={title} src={img} className={ !selected ? 'disabled' : ''} />
                </UnstyledButton>
                <div className="basemap-card-body">
                    <div className="basemap-card-title">{title}</div>
                    { subtitle ? <div className="basemap-card-subtitle">{subtitle}</div> : null }
                </div>
            </div>
        </div>
    )
}
