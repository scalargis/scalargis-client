import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { SelectButton } from 'primereact/selectbutton';
import { Slider } from 'primereact/slider'
import { Badge } from 'primereact/badge';
import { Chip } from 'primereact/chip';

import './style.css';

export default function SliderPanel({
    layers,
    selectedLayer, setSelectedLayer,
    selectedSliderLayer, setSelectedSliderLayer,
    compareToolOptions, compareTool, setCompareTool,
    opacitySliderValue, setOpacitySliderValue

}) {


    function selectLayer(layer) {
        setSelectedLayer(layer)
    }

    function selectSliderLayer(layer) {
        setSelectedSliderLayer(layer)
    }

    const toolOptionTemplate = (option) => {
        return (
            <div className='p-px-3'>
                <span>{option.name}</span>
                <i className={option.icon} style={{ margin: '2px' }}></i>
            </div>

        );
    }

    return (

        <div className='p-grid' >
            <div className='p-col-12'>
                <SelectButton
                    unselectable={false}
                    value={compareTool}
                    options={compareToolOptions}
                    optionLabel="name"
                    itemTemplate={toolOptionTemplate}
                    onChange={(e) => setCompareTool(e.value)} />
            </div>

            <div className={compareTool === 1 ? 'p-col-6' : 'p-col-12'}
                style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
            >
                <Dropdown
                    showClear={true}
                    value={selectedLayer}
                    options={layers}
                    optionLabel="item_name"
                    optionDisabled={e => (e.id === selectedSliderLayer?.id ? true : false)}
                    onChange={(e) => selectLayer(e.value)}
                    placeholder={compareTool === 1 ? 'Select left map' : 'Select top map'}
                />
                {compareTool === 2 && selectedLayer ?
                    <Chip label={String(opacitySliderValue.toFixed()) + ' %'} className="p-ml-2"></Chip>
                    : null}
            </div>

            <div className={compareTool === 1 ? 'p-col-6' : 'p-col-12'}
                style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
            >
                <Dropdown
                    showClear={true}
                    value={selectedSliderLayer}
                    options={layers}
                    optionDisabled={e => (e.id === selectedLayer?.id ? true : false)}
                    onChange={(e) => selectSliderLayer(e.value)}
                    optionLabel="item_name"
                    placeholder={compareTool === 1 ? 'Select right map' : 'Select bottom map'}
                />
                {compareTool === 2 && selectedSliderLayer ?
                    <Chip label={String(100 - opacitySliderValue.toFixed()) + ' %'} className="p-ml-2"></Chip>
                    : null}


            </div>

            {compareTool === 2 ?
                <div className='p-col-12 p-p-4'>
                    <Slider
                        step={0.1}
                        value={opacitySliderValue}
                        onChange={(e) => setOpacitySliderValue(e.value)}
                        disabled={!selectedLayer && !selectedSliderLayer}
                        orientation='horizontal'
                    />
                </div>
                : null}




        </div>

    );
}

