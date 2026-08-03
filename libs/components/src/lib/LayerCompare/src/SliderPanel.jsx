import React, { useState, useEffect } from 'react';
import { Badge, SegmentedControl, Select, Slider } from '@mantine/core';

import { i18n as i18nUtils } from '../../components';

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
            <div className='px-1'>
                <span>{option.name}</span>
                <i className={option.icon} style={{ margin: '2px' }}></i>
            </div>

        );
    }

    // Selects hold the layer objects in state; the controls speak string ids
    // at the boundary (wave-1 rule). The option picked on the other side is
    // disabled, like Prime's optionDisabled did.
    const leftData = layers.map(l => ({
        value: String(l.id),
        label: l.item_name,
        disabled: l.id === selectedSliderLayer?.id
    }));
    const rightData = layers.map(l => ({
        value: String(l.id),
        label: l.item_name,
        disabled: l.id === selectedLayer?.id
    }));

    return (

        <div className='grid p-2' >
            <div className='col-12'>
                <SegmentedControl
                    value={String(compareTool)}
                    data={compareToolOptions.map(option => ({
                        value: String(option.value),
                        label: toolOptionTemplate(option)
                    }))}
                    onChange={(value) => setCompareTool(Number(value))} />
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
                    <Select
                        clearable
                        value={selectedLayer ? String(selectedLayer.id) : null}
                        data={leftData}
                        onChange={(value) => selectLayer(value != null ? layers.find(l => String(l.id) === value) : null)}
                        placeholder={compareTool === 1 ? i18nUtils.translateValue("selectLeftTheme", "Selecionar tema da esquerda")
                            : i18nUtils.translateValue("selectTopTheme", "Selecionar tema de topo")}
                    />
                    { compareTool === 2 && selectedLayer ?
                        <Badge variant="light" className="ml-2">{String(opacitySliderValue.toFixed()) + ' %'}</Badge>
                        : null }
                </div>

                {compareTool === 2 ?
                    <div className='col-1 pt-3'>
                        < i className="pi pi-arrow-down" ></i>
                    </div>
                    : null}
                <div className={compareTool === 1 ? 'col-11 flex justify-content-end' : 'col-11 flex justify-content-start'}>
                    <Select
                        clearable
                        value={selectedSliderLayer ? String(selectedSliderLayer.id) : null}
                        data={rightData}
                        onChange={(value) => selectSliderLayer(value != null ? layers.find(l => String(l.id) === value) : null)}
                        placeholder={compareTool === 1 ? i18nUtils.translateValue("selectRightTheme", "Selecionar tema da direita") :
                            i18nUtils.translateValue("selectBottomTheme", "Selecionar tema de baixo")}
                    />
                    {compareTool === 2 && selectedSliderLayer ?
                        <Badge variant="light" className="ml-2">{String(100 - opacitySliderValue.toFixed()) + ' %'}</Badge>
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
                        size="sm"
                        label={null}
                        value={opacitySliderValue}
                        onChange={(value) => setOpacitySliderValue(value)}
                        disabled={!selectedLayer && !selectedSliderLayer}
                    />
                </div>
                : null}

        </div>

    );
}
