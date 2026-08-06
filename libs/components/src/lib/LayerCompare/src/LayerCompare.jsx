import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Slider } from '@mantine/core';

import SliderPanel from './SliderPanel'
import SliderLayersMapControl from './SliderLayersMapControl';

export default function LayerCompare({
    active,
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


    function setSlider(value) {
        set_slider(value)
        sliderValue.current = value
        mainMap.render()
    }

    const [map, setMap] = useState(null);
    useEffect(() => {
        setMap(document.getElementById("map"));
    }, []);

    const slider_el =
        <div>
            <Slider
                step={0.1}
                className='map-slider'
                label={null}
                value={slider}
                onChange={(value) => setSlider(value)}
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
            {active && map && compareTool === 1 && sliderIsActive && config?.showMapSelectControls !== false ? ReactDOM.createPortal(slider_map_controls, map) : null}
            {active && map && compareTool === 1 && (selectedLayer || selectedSliderLayer) && sliderIsActive ? ReactDOM.createPortal(slider_el, map) : null}


            {sliderIsActive ?
                // <div className='card'> // FOR ptceu ui
                    <SliderPanel
                        active={active}
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