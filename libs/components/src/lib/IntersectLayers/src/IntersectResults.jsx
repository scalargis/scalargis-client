import React, { useState, useEffect } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import OlWKT from "ol/format/WKT";
import OlFeature from 'ol/Feature';

import { i18n } from '@scalargis/components';


export default function IntersectForm(props) {

    const { actions, dispatch, mainMap, componentId, intersectConfig, intersectLayer, searchParams, results, groupResults } = props;

    const [showGeometry, setShowGeometry] = useState(false);
    const [items, setItems] = useState([]);
    const [expandedRows, setExpandedRows] = useState(null);
    const [selectAll, setSelectAll] = useState({});
    const [selectedRows, setSelectedRows] = useState({});

    const t = i18n.translateValue;

    const fileFormats = {
        "xls": {"icon": "pi-file-excel"},
        "csv": {"icon": "pi-file"},
        "pdf": {"icon": "pi-file-pdf"}
    }
    const exportFormats = intersectConfig?.exportFormats?.length ? intersectConfig.exportFormats.map(f => f.toLowerCase()) : ['xls', 'csv', 'pdf'];

    const groupResultsData = (results) => {
        const groups = {};
        results?.layers?.forEach((l, index) => {
            const group = l.group;
            if (!groups[l.group]) {
                groups[l.group] = {
                    key: String(index),
                    group: group,
                    title: group,
                    results: []
                }
            }
            const results = l.results || [];
            results.forEach((r, index) => {
                groups[group].results.push(
                    {
                        key: String(index),
                        fields: l.fields,
                        ...r
                    }
                )
            });
        });
        return Object.keys(groups).map((key) => groups[key]);
    }

    const selectFeature = (rowData, layerKey) => {

        if (!intersectLayer?.current) return;

        let feature;
        intersectLayer.current.getSource().getFeatures().forEach((f) => {
            f.set('_selected', false);
            if (f.get('_componentId') == componentId && f.get('_type') == 'results' && f.get('_layerKey') == layerKey) {
                if (f.get('key') == rowData.key) {
                    feature = f;
                }
            }
        });

        if (feature) {
            if (intersectConfig?.highlightFeatures !== false) {
                feature.set('_selected', true);
            }
            if (intersectConfig?.zoomToFeatures !== false) {
                const geom = feature.getGeometry();
                if (geom) {
                    let extent = geom.getExtent();
                    if (extent) {
                        extent = [extent[0] - 250, extent[1] - 250, extent[2] + 250, extent[3] + 250];
                        let center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2];
                        dispatch(actions.map_set_extent(center, extent));
                    }
                }
            }
        }

        mainMap.getView().changed();
    }

    useEffect(() => {

        let new_data = [];

        if (groupResults) {
            new_data = groupResultsData(results);
        } else {
            new_data = results?.layers?.map( (l, index) => {
                return {
                    key: String(index),
                    ...l
                }
            });
        }
        setItems(new_data);

        setSelectedRows({});
        setSelectAll({});
        setShowGeometry(false);
    }, [results, groupResults]);

    useEffect(() => {
        if (!items?.length) return;
        expandAll();
    }, [items]);

    useEffect(() => {
        if (!mainMap) return;
        if (!intersectLayer.current) return;

        intersectLayer.current.getSource().getFeatures().forEach((f) => {
            if (f.get('_type') === 'output') {
                intersectLayer.current.getSource().removeFeature(f);
            }
        });

        if (showGeometry && results?.output_geom) {
            const geomEWKT = results?.output_geom;
            if (!geomEWKT) return;
            const srid = geomEWKT.split(';')[0].split('=')[1];
            const wkt = geomEWKT.split(';')[1];
            if (geomEWKT) {
                const format = new OlWKT();
                const options = {
                    dataProjection: `EPSG:${srid}`,
                    featureProjection: mainMap.getView().getProjection().getCode()
                }
                let geom = options ? format.readGeometry(wkt, options) : format.readGeometry(wkt);

                const feature = new OlFeature({_componentId: componentId, _type: 'output', geometry: geom});
                intersectLayer.current.getSource().addFeature(feature);
            }
        }

        mainMap.getView().changed();

    }, [showGeometry]);

    useEffect(() => {
        if (!intersectLayer.current) return;

        intersectLayer.current.getSource().getFeatures().forEach((f) => {
            if (f.get('_componentId') == componentId && f.get('_type') == 'results') {
                intersectLayer.current.getSource().removeFeature(f);
            }
        });

        for (const [key, recs] of Object.entries(selectedRows)) {
            recs.forEach((rec) => {
                const geomEWKT = rec?.geom;
                if (!geomEWKT) return;
                const srid = geomEWKT.split(';')[0].split('=')[1];
                const wkt = geomEWKT.split(';')[1];
                if (geomEWKT) {
                    const format = new OlWKT();
                    const options = {
                        dataProjection: `EPSG:${srid}`,
                        featureProjection: mainMap.getView().getProjection().getCode()
                    }
                    let geom = options ? format.readGeometry(wkt, options) : format.readGeometry(wkt);

                    const feature = new OlFeature({...rec, _layerKey: key, _componentId: componentId, _type: 'results', geometry: geom});
                    intersectLayer.current.getSource().addFeature(feature);
                }
            });
        }

        mainMap.getView().changed();

    }, [selectedRows]);

    const expandAll = () => {
        let _expandedRows = {};
        items.forEach((p) => (_expandedRows[`${p.key}`] = true));
        setExpandedRows(_expandedRows);
    };

    const collapseAll = () => {
        setExpandedRows(null);
    };

    const allowExpansion = (rowData) => {
        return rowData.results.length > 0;
    };

    const onSelectionChange = (event, data) => {
        const _selectedRows = {...selectedRows}
        _selectedRows[data.key] = event.value;
        setSelectedRows(_selectedRows);

        const _selectAll = {...selectAll}
        _selectAll[data.key] = _selectedRows[data.key].length === data.results.length;
        setSelectAll(_selectAll);
    };

    const onSelectAllChange = (event, data) => {
        const _selectAll = {...selectAll}
        _selectAll[data.key] = event.checked;
        setSelectAll(_selectAll);

        const _selectedRows = {...selectedRows}
        if (event.checked) {
            _selectedRows[data.key] = [...data.results];
        } else {
            _selectedRows[data.key] = [];
        }
        setSelectedRows(_selectedRows);
    };

    const recordBodyTemplate = (rowData, layerKey, cfg) => {
        const precision = cfg?.precision || 100;

        const fields = rowData?.fields || cfg?.fields || [];

        const showAreaTable = (rowData?.geom + '').toUpperCase().indexOf('POLYGON') > -1 && 
            (intersectConfig?.showResultArea !== false || intersectConfig?.showResultPercentage !== false);

        return (
            <>
                <table onClick={ (e) => selectFeature(rowData, layerKey) } className='sg-intersect-results-table sg-intersect-results-table-record'>
                    { fields?.length ? fields.map( (col, index) => {
                        const _title = col?.title ? t(col.title, col.title) : col.alias
                        return (
                            <tr key={index}>
                                <td><span className='font-bold'>{`${_title}: `}</span>{rowData[col.field]}</td>
                            </tr>
                        )
                    }) : null }
                </table>
                { showAreaTable &&
                <div className='flex'>
                    <table className='sg-intersect-results-table-area'>
                        <tr>
                            { intersectConfig?.showResultArea !== false ? <th>Área (m²)</th> : null }
                            { intersectConfig?.showResultPercentage !== false ? <th>%</th> : null }
                        </tr>
                        <tr>
                        { intersectConfig?.showResultArea !== false ? 
                            <td>{rowData.area != null ? (Math.round(rowData.area  * precision)  / precision) : rowData.area}</td> 
                            : null }
                        { intersectConfig?.showResultPercentage !== false ?
                            <td>{rowData.percent != null ? (Math.round(rowData.percent * precision)  / precision) : rowData.percent}</td>
                            : null }
                        </tr>
                    </table>
                </div>
                }
            </>
        )
    };

    const itemBodyTemplate = (rowData) => {
        let title = rowData?.title || rowData?.group;
        if (results?.groups?.length) {
            const _group = results.groups.find((g) => g.name === rowData?.group);
            if (_group?.title) {
                //title = t(_group.title, title);
                title = t(_group.title || title, _group.title || title);
            }
        }
        return <label className='font-bold'>{title}</label>;
    };

    const rowExpansionTemplate = (data) => {
        let header = null;
        if (data?.results?.length > 1) {
            header = (
                <div className="flex justify-content-end mt-2 mr-2 font-normal">
                    <Checkbox name="selectAll" onChange={(e) => onSelectAllChange(e, data)} checked={selectAll[data.key]} />
                    <label htmlFor="selectAll" className="ml-1">{t("showAll", "Ver todos")}</label>
                </div>
            );
        }

        if (intersectConfig?.showResultGeometries === false) {
            return (
                <DataTable value={data.results} className='sg-intersect-results-table'>
                    <Column header="Ver todos" body={(rowData) => recordBodyTemplate(rowData, data.key, { fields: data?.fields})} headerStyle={{ display: 'none' }}></Column>
                </DataTable>
            );
        }

        return (
            <DataTable value={data.results} selection={selectedRows[data.key]}
                selectionMode="checkbox"
                onSelectionChange={(event) => onSelectionChange(event, data)}
                header={header}
                className='sg-intersect-results-table'>
                <Column selectionMode="multiple" headerStyle={{ width: '1rem', display: 'none' }} />
                <Column header="Ver todos" body={(rowData) => recordBodyTemplate(rowData, data.key, {...data})} headerStyle={{ display: 'none' }}></Column>
            </DataTable>
        );

    };

    const exportToolbar = (
        <React.Fragment>
            { 
                exportFormats.map((format, index) => {
                    return (
                        <Button key={index} icon={`pi ${ fileFormats?.[format]?.icon ? fileFormats[format].icon : "p-file" }`} className="mr-2" label={format.toUpperCase()} link
                            onClick={() =>  {
                                let url = '/spatial_toolbox/api/intersect';
                                if (intersectConfig?.apiUrl) {
                                    url = intersectConfig.apiUrl;
                                }
                                if (intersectConfig?.export?.[format]?.apiUrl) {
                                    url = intersectConfig.export[format].apiUrl;
                                }
                                const query = new URLSearchParams({...searchParams, format});
                                window.open(`${url}?${query.toString()}`, '_blank')
                            }
                        }/>
                    );
                })
            }
        </React.Fragment>
    );

    const header = (
        <div className="flex flex-wrap justify-content-end gap-2 m-1">
            <Button icon="pi pi-plus" label={t("expand", "Expandir")} onClick={expandAll} text size="small" />
            <Button icon="pi pi-minus" label={t("collapse", "Recolher")} onClick={collapseAll} text size="small" />
        </div>
    )

    return (
        <div className="mt-4">
            <h3>{t("results", "Resultados")}</h3>

            { intersectConfig?.showExport !== false ? <Toolbar start={exportToolbar} /> : null }

            <div className="flex align-items-center my-3">
                <Checkbox name="showGeometry" value={showGeometry} onChange={(e) => setShowGeometry(!e.value)} checked={showGeometry} />
                <label htmlFor="showGeometry" className="ml-2">{t("showIntersectionGeometry", "Ver Geometria da Confrontação")}</label>
            </div>

            <div className="mt-2">
                <DataTable value={items} expandedRows={expandedRows} onRowToggle={(e) => setExpandedRows(e.data)}
                        rowExpansionTemplate={rowExpansionTemplate}
                        dataKey="key" header={header} className='sg-intersect-results-table' showHeaders={false} >
                    <Column expander={allowExpansion} style={{ width: '1rem' }} />
                    <Column body={itemBodyTemplate} />
                </DataTable>
            </div>

        </div>
    )
}