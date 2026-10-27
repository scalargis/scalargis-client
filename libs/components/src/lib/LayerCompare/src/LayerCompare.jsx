import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Slider } from '@mantine/core';

import SliderPanel from './SliderPanel'
import SliderLayersMapControl from './SliderLayersMapControl';

export default function LayerCompare({
    active,
    layers, actions, config,
    selectedLayer, setSelectedLayer,
    selectedSliderLayer, setSelectedSliderLayer,
    sliderValue, setSliderValue,
    compareToolOptions, compareTool, setCompareTool,
    opacitySliderValue, setOpacitySliderValue

}) {

    const [sliderIsActive, toggleSliderIsActive] = useState(true)

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
                value={sliderValue}
                onChange={(value) => setSliderValue(value)}
            />
        </div>

    const slider_map_controls =
        <SliderLayersMapControl
            sliderValue={sliderValue}
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
                : null}

        </div>
    )
}