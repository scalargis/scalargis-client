import React from 'react';
import { Select } from '@mantine/core';

import { i18n as i18nUtils } from '../../components';

import './style.css';

export default function SliderLayersMapControl({
    layers,
    selectedLayer, setSelectedLayer,
    selectedSliderLayer, setSelectedSliderLayer,
    sliderValue,
    leftPlaceholder, rightPlaceholder }) {


    function selectLayer(layer) {
        setSelectedLayer(layer)
    }

    function selectSliderLayer(layer) {
        setSelectedSliderLayer(layer)
    }


    return (

        <div
            className='map-slider-layers-control'
            style={{width: '100%',  left: sliderValue + '%' }}
        >

            <div className='grid' >
                <div className='col'
                    style={{ display: "flex", justifyContent: "right", alignItems: "center" }}>
                    <Select
                        clearable
                        w={260}
                        title={selectedLayer?.item_name}
                        value={selectedLayer ? String(selectedLayer.id) : null}
                        data={layers.map(l => ({
                            value: String(l.id),
                            label: l.item_name,
                            disabled: l.id === selectedSliderLayer?.id
                        }))}
                        onChange={(value) => selectLayer(value != null ? layers.find(l => String(l.id) === value) : null)}
                        placeholder={leftPlaceholder ?? `<- ${i18nUtils.translateValue("selectLeftTheme", "Selecionar tema da esquerda")}`}
                    />
                </div>
                <div className='col'
                    style={{ display: "flex", justifyContent: "left", alignItems: "center" }}>
                    <Select
                        clearable
                        w={260}
                        title={selectedSliderLayer?.item_name}
                        value={selectedSliderLayer ? String(selectedSliderLayer.id) : null}
                        data={layers.map(l => ({
                            value: String(l.id),
                            label: l.item_name,
                            disabled: l.id === selectedLayer?.id
                        }))}
                        onChange={(value) => selectSliderLayer(value != null ? layers.find(l => String(l.id) === value) : null)}
                        placeholder={rightPlaceholder ?? `${i18nUtils.translateValue("selectRightTheme", "Selecionar tema da direita")} ->`}
                    />
                </div>

            </div>


        </div>

    );
}
