import React, { useState } from 'react';
import { NumberInput, TextInput } from '@mantine/core';
import { DataGrid } from '@scalargis/ui';

import { i18n } from '../../../components';


export default function ResultsTable(props) {

    const { records, fields, filters, onFiltersChange } = props;

    const t = i18n.translateValue;

    const [sortStatus, setSortStatus] = useState(null);

    const showAreaColumn = records.filter(r => r.dimension == 2).length > 0 &&
        (props?.showResultMeasure !== false || props?.showResultPercentage !== false);
    const showLengthColumn = records.filter(r => r.dimension == 1).length > 0 &&
        (props?.showResultMeasure !== false || props?.showResultPercentage !== false);

    const numericValueTemplate = (val) => {
        const precision = 100;
        return val ? Math.round(val * precision) / precision : val;
    };

    const filterValue = (field) => filters?.[field]?.value;

    const setFilterValue = (field, value) => {
        onFiltersChange({ ...(filters || {}), [field]: { value } });
    };

    // The Prime filter semantics restated client-side: text fields filter by
    // contains, the numeric measure columns by greater-than.
    let data = records;
    (fields || []).forEach((item) => {
        const value = filterValue(item.field);
        if (value != null && value !== '') {
            const q = String(value).toLowerCase();
            data = data.filter(r => String(r[item.field] ?? '').toLowerCase().includes(q));
        }
    });
    ['area', 'length', 'percent'].forEach((field) => {
        const value = filterValue(field);
        if (value != null && value !== '') {
            data = data.filter(r => r[field] != null && Number(r[field]) > Number(value));
        }
    });
    if (sortStatus) {
        data = [...data].sort((a, b) => {
            const av = a[sortStatus.columnAccessor];
            const bv = b[sortStatus.columnAccessor];
            if (av == null && bv == null) return 0;
            if (av == null) return -1;
            if (bv == null) return 1;
            if (typeof av === 'number' && typeof bv === 'number') return av - bv;
            return String(av).localeCompare(String(bv));
        });
        if (sortStatus.direction === 'desc') data.reverse();
    }

    const textFilter = (field, title) => ({
        filter: (
            <TextInput
                label={title}
                placeholder={title}
                size="sm"
                value={filterValue(field) || ''}
                onChange={(e) => setFilterValue(field, e.currentTarget.value)}
            />
        ),
        filtering: !!filterValue(field),
    });

    const numericFilter = (field, title) => ({
        filter: (
            <NumberInput
                label={title}
                placeholder={`> ${title}`}
                size="sm"
                hideControls
                value={filterValue(field) != null ? filterValue(field) : ''}
                onChange={(value) => setFilterValue(field, typeof value === 'number' ? value : (value === '' || value == null ? null : Number(value)))}
            />
        ),
        filtering: filterValue(field) != null && filterValue(field) !== '',
    });

    const columns = [
        ...fields.map((item) => {
            const fieldTitle = t(item?.title || item?.alias, item?.title || item?.alias || item?.field);
            return {
                accessor: item.field,
                title: fieldTitle,
                sortable: true,
                ...textFilter(item.field, fieldTitle),
            };
        }),
    ];

    if (showAreaColumn && props?.showResultMeasure) {
        const title = `${t("area", "Área")} (m²)`;
        columns.push({ accessor: 'area', title, sortable: true, render: rowData => numericValueTemplate(rowData.area), ...numericFilter('area', title) });
    }
    if (showLengthColumn && props?.showResultMeasure) {
        const title = `${t("length", "Comprimento")} (m)`;
        columns.push({ accessor: 'length', title, sortable: true, render: rowData => numericValueTemplate(rowData.length), ...numericFilter('length', title) });
    }
    if ((showAreaColumn || showLengthColumn) && props?.showResultPercentage) {
        columns.push({ accessor: 'percent', title: '%', sortable: true, render: rowData => numericValueTemplate(rowData.percent), ...numericFilter('percent', '%') });
    }

    return (
        <DataGrid
            idAccessor={(record) => data.indexOf(record)}
            records={data}
            columns={columns}
            sortStatus={sortStatus || undefined}
            onSortStatusChange={setSortStatus}
        />
    );

}
