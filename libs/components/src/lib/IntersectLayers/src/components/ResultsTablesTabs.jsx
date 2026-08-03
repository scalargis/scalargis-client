import React, { useEffect, useState } from 'react';
import { Group, MultiSelect, Tabs } from '@mantine/core';
import { TabPanel } from '@scalargis/ui';

import { i18n } from '../../../components';

import ResultsTable from './ResultsTable';


export default function ResultsTablesTabs(props) {

    const { groups, layers } = props;

    const [groupsOptions, setGroupsOptions] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [filters, setFilters ] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    const t = i18n.translateValue;


    useEffect(() => {
        const validGroups = layers.filter((layer) => layer?.results?.length > 0).map((layer) => layer.group);
        const _groups = groups.filter(item => validGroups.includes(item.name)).map(item => {
            const label = t(item.title, item.title || item.name);
            return { name: label, code: item.name }
        });
        setGroupsOptions(_groups);
        setSelectedGroups(_groups.map(g => g.code));
    }, []);

    useEffect(() => {
        const _filters = [];
        layers?.forEach((layer, index) => {
            const fields = layer?.fields || [];

            const _tableFilters = {}

            fields.forEach((item) => {
                _tableFilters[item.field] = { value: null };
            });
            _tableFilters["area"] = { value: null };
            _tableFilters["percent"] = { value: null };

            _filters.push(_tableFilters);
        });
        setFilters(_filters);
    }, []);

    const _layers = layers.filter((layer) => selectedGroups?.length ? selectedGroups.includes(layer.group) : true);

    // Tabs are keyed by the layer's index in the ORIGINAL array, so the
    // active tab survives the groups filter narrowing the visible set.
    const tabKeys = _layers.map((layer) => String(layers.findIndex(elem => elem === layer)));
    const currentTab = activeTab != null && tabKeys.includes(activeTab) ? activeTab : (tabKeys[0] ?? null);

    return (
        <>

            <Group className='sg-intersect-toolbar mb-2'>
                <label className='pr-2'>{t('groups', 'Grupos')}:</label>
                <MultiSelect
                    value={selectedGroups}
                    onChange={(value) => setSelectedGroups(value)}
                    data={groupsOptions.map(g => ({ value: g.code, label: g.name }))}
                    placeholder="Select Groups"
                    className="w-full md:w-20rem"
                />
            </Group>

            <Tabs value={currentTab} onChange={setActiveTab}>
                <Tabs.List>
                    { _layers.map((layer) => {
                        const layerIndex = layers.findIndex(elem => elem === layer) || 0;
                        return (
                            <Tabs.Tab key={layerIndex} value={String(layerIndex)}>
                                {t(layer?.title, layer?.title)}
                            </Tabs.Tab>
                        );
                    })}
                </Tabs.List>

                { _layers.map((layer) => {
                    // Get the index of the layer in the original layers array
                    const layerIndex = layers.findIndex(elem => elem === layer) || 0;

                    const records = layer?.results || [];
                    const fields = layer?.fields || [];

                    let tableFilters;
                    if (filters?.length) {
                        tableFilters = filters[layerIndex];
                    }

                    const onTableFiltersChange = newFilters => {
                        const _filters = [...filters];
                        _filters[layerIndex] = newFilters;
                        setFilters(_filters);
                    }

                    const group = groups.find((item) => item.name === layer.group);
                    const groupTitle = t(group?.title, group?.title || layer.group);

                    return (
                        <TabPanel key={layerIndex} active={currentTab === String(layerIndex)} mount="unmount">

                            <div className='text-lg text-gray-600 mt-1 mb-3'>{`${t('group', 'Grupo')}: ${groupTitle}`}</div>

                            <ResultsTable records={records} fields={fields} filters={tableFilters}
                                showResultMeasure={props?.showResultMeasure}
                                showResultPercentage={props?.showResultPercentage}
                                onFiltersChange={onTableFiltersChange}  />
                        </TabPanel>
                    );
                })}
            </Tabs>
        </>
    );

}
