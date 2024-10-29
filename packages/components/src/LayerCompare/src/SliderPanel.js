import React, { useState, useEffect } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { SelectButton } from 'primereact/selectbutton';
import { Slider } from 'primereact/slider'
import { Chip } from 'primereact/chip';

import { i18n as i18nUtils } from '@scalargis/components';

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
            <div className='p-px-1'>
                <span>{option.name}</span>
                <i className={option.icon} style={{ margin: '2px' }}></i>
            </div>

        );
    }

    return (

        <div className='grid p-2' >
            <div className='col-12'>
                <SelectButton
                    unselectable={false}
                    value={compareTool}
                    options={compareToolOptions}
                    optionLabel="name"
                    itemTemplate={toolOptionTemplate}
                    onChange={(e) => setCompareTool(e.value)} />
            </div>

            <div className='grid col-12'>
                <div className='col-1 pt-3'>
                    {compareTool === 1 ?
                        <i className="pi pi-arrow-left" ></i>
                        :
                        <i className="pi pi-arrow-up" ></i>
                    }
                </div>
                <div className={compareTool === 1 ? 'col-11 flex justify-content-end' : 'col-11 flex justify-content-start'}>
                    <Dropdown
                        showClear={true}
                        value={selectedLayer}
                        options={layers}
                        optionLabel="item_name"
                        optionDisabled={e => (e.id === selectedSliderLayer?.id ? true : false)}
                        onChange={(e) => selectLayer(e.value)}
                        placeholder={compareTool === 1 ? i18nUtils.translateValue("selectLeftTheme", "Selecionar tema da esquerda") 
                            : i18nUtils.translateValue("selectTopTheme", "Selecionar tema de topo")}
                    />
                    { compareTool === 2 && selectedLayer ?
                        <Chip label={String(opacitySliderValue.toFixed()) + ' %'} className="p-ml-2"></Chip>
                        : null }
                </div>

                {compareTool === 2 ?
                    <div className='col-1 pt-3'>
                        < i className="pi pi-arrow-down" ></i>
                    </div>
                    : null}
                <div className={compareTool === 1 ? 'col-11 flex justify-content-end' : 'col-11 flex justify-content-start'}>
                    <Dropdown
                        showClear={true}
                        value={selectedSliderLayer}
                        options={layers}
                        optionDisabled={e => (e.id === selectedLayer?.id ? true : false)}
                        onChange={(e) => selectSliderLayer(e.value)}
                        optionLabel="item_name"
                        placeholder={compareTool === 1 ? i18nUtils.translateValue("selectRightTheme", "Selecionar tema da direita") : 
                            i18nUtils.translateValue("selectBottomTheme", "Selecionar tema de baixo")}
                    />
                    {compareTool === 2 && selectedSliderLayer ?
                        <Chip label={String(100 - opacitySliderValue.toFixed()) + ' %'} className="p-ml-2"></Chip>
                        : null}
                </div>

                {compareTool === 1 ?
                    <div className='col-1 pt-3'>
                        <i className="pi pi-arrow-right" ></i>
                    </div>
                    : null}
            </div>

            {compareTool === 2 ?
                <div className='col-12 p-4'>
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

