import React, { useEffect, useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { FilterMatchMode } from 'primereact/api';
import { MultiSelect } from 'primereact/multiselect';
import { Toolbar } from 'primereact/toolbar';

import { i18n } from '../../../components';

import ResultsTable from './ResultsTable';


export default function ResultsTablesTabs(props) {

    const { groups, layers } = props;

    const [groupsOptions, setGroupsOptions] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [filters, setFilters ] = useState([]);

    const t = i18n.translateValue;


    useEffect(() => {
        const validGroups = layers.filter((layer) => layer?.results?.length > 0).map((layer) => layer.group);
        const _groups = groups.filter(item => validGroups.includes(item.name)).map(item => {
            const label = t(item.title, item.title || item.name);
            return { name: label, code: item.name }
        });
        setGroupsOptions(_groups);
        setSelectedGroups([..._groups]);
    }, []);

    useEffect(() => {
        const _filters = [];
        layers?.forEach((layer, index) => {
            const fields = layer?.fields || [];

            const _tableFilters = {}
            
            fields.forEach((item) => {
                _tableFilters[item.field] = { value: null, matchMode: FilterMatchMode.CONTAINS };
            });
            _tableFilters["area"] = { value: null, matchMode: FilterMatchMode.GREATER_THAN };
            _tableFilters["percent"] = { value: null, matchMode: FilterMatchMode.GREATER_THAN };

            _filters.push(_tableFilters);
        });
        setFilters(_filters);
    }, []);

    const _layers = layers.filter((layer) => selectedGroups?.length ? selectedGroups.some((group) => group.code === layer.group) : true);

    const startContent = (
        <>
            <label className='pr-2'>{t('groups', 'Grupos')}:</label>
            <MultiSelect value={selectedGroups} onChange={(e) => setSelectedGroups(e.value)} options={groupsOptions} optionLabel="name" 
                placeholder="Select Groups" className="w-full md:w-20rem" />
         </>
    ); 

    return (
        <>

            <Toolbar start={startContent} className='mb-2' />

            <TabView>
                { _layers.map((layer, index) => {
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

                    const layerTitle = t(layer?.title, layer?.title);

                    return (
                        <TabPanel header={layerTitle} key={index}>

                            <div className='text-lg text-gray-600 mt-1 mb-3'>{`${t('group', 'Grupo')}: ${groupTitle}`}</div>

                            <ResultsTable records={records} fields={fields} filters={tableFilters}
                                showResultMeasure={props?.showResultMeasure}
                                showResultPercentage={props?.showResultPercentage}
                                onFiltersChange={onTableFiltersChange}  />
                        </TabPanel>
                    );
                })}
            </TabView>
        </>
    );

}