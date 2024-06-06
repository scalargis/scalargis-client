import React, { useRef } from 'react';
import { Dropdown } from 'primereact/dropdown';

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

            <div className='p-grid' >
                <div className='p-col'
                    style={{ display: "flex", justifyContent: "right", alignItems: "center" }}>
                    <Dropdown
                        value={selectedLayer}
                        options={layers}
                        optionDisabled={e => (e.id === selectedSliderLayer?.id ? true : false)}
                        onChange={(e) => selectLayer(e.value)}
                        optionLabel="item_name"
                        placeholder="Selecionar o tema esquerdo"
                        showClear={true}
                    />
                </div>
                <div className='p-col'
                    style={{ display: "flex", justifyContent: "left", alignItems: "center" }}>
                    <Dropdown
                        value={selectedSliderLayer}
                        options={layers}
                        optionDisabled={e => (e.id === selectedLayer?.id ? true : false)}
                        onChange={(e) => selectSliderLayer(e.value)}
                        optionLabel="item_name"
                        placeholder="Selecionar o tema direito"
                        showClear={true}
                    />
                </div>

            </div>


        </div>

    );
}

