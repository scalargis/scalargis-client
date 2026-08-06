import React, { useState, useEffect } from 'react';
import { Group, SegmentedControl, Select, Slider, Text } from '@mantine/core';

import { i18n as i18nUtils } from '../../components';

import './style.css';

export default function SliderPanel({
    active,
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

    // Full-width stacked rows: direction as a label above each Select (no more
    // cramped col-1 arrow column), Selects at full width so theme names get the
    // most room, and the % as its own value on the label line so it never gets
    // crushed by the Select (C-19/C-20).
    const firstLabel = compareTool === 1
        ? `◄ ${i18nUtils.translateValue("left", "Esquerda")}`
        : `▲ ${i18nUtils.translateValue("top", "Cima")}`;
    const secondLabel = compareTool === 1
        ? `${i18nUtils.translateValue("right", "Direita")} ►`
        : `▼ ${i18nUtils.translateValue("bottom", "Baixo")}`;

    return (

        <div className='grid p-2' >
            <div className='col-12'>
                <SegmentedControl
                    key={active ? 'active' : 'inactive'}
                    fullWidth
                    value={String(compareTool)}
                    data={compareToolOptions.map(option => ({
                        value: String(option.value),
                        label: toolOptionTemplate(option)
                    }))}
                    onChange={(value) => setCompareTool(Number(value))} />
            </div>

            <div className='col-12'>
                <Group justify="space-between" gap="xs" mb={4} wrap="nowrap">
                    <Text size="sm">{firstLabel}</Text>
                    {compareTool === 2 && selectedLayer ?
                        <Text size="sm" fw={500}>{String(opacitySliderValue.toFixed()) + ' %'}</Text>
                        : null}
                </Group>
                <Select
                    clearable
                    title={selectedLayer?.item_name}
                    value={selectedLayer ? String(selectedLayer.id) : null}
                    data={leftData}
                    onChange={(value) => selectLayer(value != null ? layers.find(l => String(l.id) === value) : null)}
                    placeholder={compareTool === 1 ? i18nUtils.translateValue("selectLeftTheme", "Selecionar tema da esquerda")
                        : i18nUtils.translateValue("selectTopTheme", "Selecionar tema de topo")}
                />
            </div>

            <div className='col-12'>
                <Group justify="space-between" gap="xs" mb={4} wrap="nowrap">
                    <Text size="sm">{secondLabel}</Text>
                    {compareTool === 2 && selectedSliderLayer ?
                        <Text size="sm" fw={500}>{String(100 - opacitySliderValue.toFixed()) + ' %'}</Text>
                        : null}
                </Group>
                <Select
                    clearable
                    title={selectedSliderLayer?.item_name}
                    value={selectedSliderLayer ? String(selectedSliderLayer.id) : null}
                    data={rightData}
                    onChange={(value) => selectSliderLayer(value != null ? layers.find(l => String(l.id) === value) : null)}
                    placeholder={compareTool === 1 ? i18nUtils.translateValue("selectRightTheme", "Selecionar tema da direita") :
                        i18nUtils.translateValue("selectBottomTheme", "Selecionar tema de baixo")}
                />
            </div>

            {compareTool === 2 ?
                <div className='col-12 px-2 pt-2'>
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
