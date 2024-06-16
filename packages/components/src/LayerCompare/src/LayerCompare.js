import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Slider } from 'primereact/slider'

import SliderPanel from './SliderPanel'
import SliderLayersMapControl from './SliderLayersMapControl.js';

export default function LayerCompare({
    layers, actions, config,
    selectedLayer, setSelectedLayer,
    selectedSliderLayer, setSelectedSliderLayer,
    layersRefs, sliderValue,
    compareToolOptions, compareTool, setCompareTool,
    opacitySliderValue, setOpacitySliderValue

}) {

    const { mainMap } = config;

    const [sliderIsActive, toggleSliderIsActive] = useState(true)
    const [slider, set_slider] = useState(50);
    sliderValue.current = slider
    const [layoutOption, setLayoutOption] = useState('vertical')


    function setSlider(value) {
        set_slider(value)
        sliderValue.current = value
        mainMap.render()
    }

    const map = document.getElementById("map");

    const slider_el =
        <div>
            <Slider
                step={0.1}
                className='map-slider'
                value={slider}
                onChange={(e) => setSlider(e.value)}
                orientation={layoutOption === 'vertical' ? 'horizontal' : 'vertical'}
            />
        </div>

    const slider_map_controls =
        <SliderLayersMapControl
            sliderValue={slider}
            layers={layers}
            selectedLayer={selectedLayer}
            setSelectedLayer={setSelectedLayer}
            selectedSliderLayer={selectedSliderLayer}
            setSelectedSliderLayer={setSelectedSliderLayer}
            actions={actions}
            config={config}
            sliderIsActive={sliderIsActive} />



    return (
        <div style={{ height: '100%' }}>
            {compareTool === 1 && sliderIsActive && config?.showMapSelectControls !== false ? ReactDOM.createPortal(slider_map_controls, map) : null}
            {compareTool === 1 && (selectedLayer || selectedSliderLayer) && sliderIsActive ? ReactDOM.createPortal(slider_el, map) : null}


            {sliderIsActive ?
                // <div className='card'> // FOR ptceu ui
                    <SliderPanel
                        layers={layers}
                        selectedLayer={selectedLayer}
                        setSelectedLayer={setSelectedLayer}
                        selectedSliderLayer={selectedSliderLayer}
                        setSelectedSliderLayer={setSelectedSliderLayer}
                        compareToolOptions={compareToolOptions}
                        compareTool={compareTool}
                        setCompareTool={setCompareTool}
                        opacitySliderValue={opacitySliderValue}
                        setOpacitySliderValue={setOpacitySliderValue}
                    />
                // </div>
                : null}

        </div>
    )
}