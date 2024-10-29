import React, { useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';

import { i18n as i18nUtils } from '@scalargis/components';

import './style.css';

export default function SliderLayersMapControl({
    layers,
    selectedLayer, setSelectedLayer,
    selectedSliderLayer, setSelectedSliderLayer,
    sliderValue }) {


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
                    <Dropdown
                        value={selectedLayer}
                        options={layers}
                        optionDisabled={e => (e.id === selectedSliderLayer?.id ? true : false)}
                        onChange={(e) => selectLayer(e.value)}
                        optionLabel="item_name"
                        placeholder={`<- ${i18nUtils.translateValue("selectLeftTheme", "Selecionar tema da esquerda")}`}
                        showClear={true}
                    />
                </div>
                <div className='col'
                    style={{ display: "flex", justifyContent: "left", alignItems: "center" }}>
                    <Dropdown
                        value={selectedSliderLayer}
                        options={layers}
                        optionDisabled={e => (e.id === selectedLayer?.id ? true : false)}
                        onChange={(e) => selectSliderLayer(e.value)}
                        optionLabel="item_name"
                        placeholder={`${i18nUtils.translateValue("selectRightTheme", "Selecionar tema da direita")} ->`}
                        showClear={true}
                    />
                </div>

            </div>


        </div>

    );
}

