import React, { useState, useEffect } from 'react';
import { Button, Checkbox, Group, Menu } from '@mantine/core';
import { DataGrid, notify } from '@scalargis/ui';
import OlWKT from "ol/format/WKT";
import OlFeature from 'ol/Feature';

import { i18n } from '../../components';

import ResultsTablesTabs from './components/ResultsTablesTabs';


export default function IntersectResults(props) {

    const {viewer, core, Models, actions, dispatch, mainMap, componentId, intersectConfig, intersectLayer, searchParams, results, groupResults } = props;

    const { viewer_add_dialog_window, viewer_update_dialog_window } = actions;

    const [showGeometry, setShowGeometry] = useState(false);
    const [items, setItems] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [selectAll, setSelectAll] = useState({});
    const [selectedRows, setSelectedRows] = useState({});
    const [downloadingFile, setDownloadingFile] = useState(false);
    const [downloadingFormat, setDownloadingFormat] = useState(false);

    const t = i18n.translateValue;

    const fileFormats = {
        "xls": {"icon": "pi-file-excel", label: "Excel"},
        "csv": {"icon": "pi-file", label: "CSV"},
        "pdf": {"icon": "pi-file-pdf", label: "PDF"},
        "gpkg": {"icon": "pi-file", label: "GeoPackage"}
    }
    const exportFormats = intersectConfig?.exportFormats?.length ? intersectConfig.exportFormats.map(f => f.toLowerCase()) : ['xls', 'csv', 'pdf', 'gpkg'];

    const showResultMeasure = intersectConfig?.showResultMeasure !=null ? intersectConfig?.showResultMeasure : true;
    const showResultPercentage = intersectConfig?.showResultPercentage != null ? intersectConfig?.showResultPercentage : true;

    const showTablesButton = !!intersectConfig?.showTables;


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
                        const center = [extent[0] + (extent[2] - extent[0])/2, extent[1] + (extent[3] - extent[1])/2];
                        dispatch(actions.map_set_extent(center, extent));
                    }
                }
            }
        }

        mainMap.getView().changed();
    }

    const exportResults = (format) => {
        let url = '/spatial_toolbox/api/intersect';
        if (intersectConfig?.apiUrl) {
            url = intersectConfig.apiUrl;
        }
        if (intersectConfig?.export?.[format]?.apiUrl) {
            url = intersectConfig.export[format].apiUrl;
        }

        const export_srid = intersectConfig?.export_crs || viewer?.config_json?.export_crs || viewer?.config_json?.display_crs;

        const query = new URLSearchParams({...searchParams, format, export_srid: export_srid, viewerId: viewer.id});

        url = `${url}?${query.toString()}`;

        const headers = new Headers({});
        const fetchBlob = core.services.data.fetchAll;

        setDownloadingFile(true);
        setDownloadingFormat(format);

        fetchBlob(url,{headers}).then(result => {
            setDownloadingFormat(null);
            const blob = result instanceof ArrayBuffer ? new Blob([result]) : result;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `intersecao_resultados.${format == "csv" ? "zip" : format}`
            document.body.appendChild(a);
            a.click();
            a.remove();

            notify.success(t("information", "Informação"), `${t("successFileGenerateMsg", "O ficheiro foi gerado com sucesso")}.`);
        })
        .catch(e => {
            notify.warn(t("error", "Error"), `${t("errorFileGenerateMsg", "Ocorreu um erro ao gerar o ficheiro")}.`);
        })
        .finally(d => {
            setDownloadingFile(false);
            setDownloadingFormat(null);
        });
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

        setDownloadingFile(false);
        setDownloadingFormat(null);
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
                const geom = options ? format.readGeometry(wkt, options) : format.readGeometry(wkt);

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
                    const geom = options ? format.readGeometry(wkt, options) : format.readGeometry(wkt);

                    const feature = new OlFeature({...rec, _layerKey: key, _componentId: componentId, _type: 'results', geometry: geom});
                    intersectLayer.current.getSource().addFeature(feature);
                }
            });
        }

        mainMap.getView().changed();

    }, [selectedRows]);

    const expandAll = () => {
        setExpandedKeys(items.map((p) => p.key));
    };

    const collapseAll = () => {
        setExpandedKeys([]);
    };

    const showTable = () => {
        const key = `${componentId}-table`;

        let header = intersectConfig.header;
        header = i18n.translateValue(header, header);
        header = props?.title && header ? `${props?.title} - ${header}` : props?.title || header || "Interseção de Temas";

        if (viewer?.dialogWindows?.length > 0) {
            const dw = viewer.dialogWindows.find(w => w.key === key);
            if (dw) {
                const config = {
                    ...dw.config,
                    header: header,
                    className: 'sg-intersect-layers-results-table-dialog'
                }

                const childKey = new Date().getTime();
                const child = <ResultsTablesTabs
                    groups={results?.groups || []}
                    layers={results?.layers || []}
                    showResultMeasure={showResultMeasure}
                    showResultPercentage={showResultPercentage}
                    />

                dispatch(viewer_update_dialog_window({config: config, child: child, visible: true }));
                return;
            }
        }

        const data = {};

        const config = Object.assign({}, data?.dialogOptions);
        config.key = key;
        config.header = header;
        config.maximizable = true;
        config.style={ width: '75vw', height: '75vh' };
        config.className ='sg-intersect-layers-results-table-dialog'

        const childKey = new Date().getTime();
        const child = <ResultsTablesTabs
            groups={results?.groups || []}
            layers={results?.layers || []}
            showResultMeasure={showResultMeasure}
            showResultPercentage={showResultPercentage}
            />;

        dispatch(viewer_add_dialog_window({config, child, onClose: data?.onClose}));
    }

    const onSelectionChange = (records, data) => {
        const _selectedRows = {...selectedRows}
        _selectedRows[data.key] = records;
        setSelectedRows(_selectedRows);

        const _selectAll = {...selectAll}
        _selectAll[data.key] = _selectedRows[data.key].length === data.results.length;
        setSelectAll(_selectAll);
    };

    const onSelectAllChange = (checked, data) => {
        const _selectAll = {...selectAll}
        _selectAll[data.key] = checked;
        setSelectAll(_selectAll);

        const _selectedRows = {...selectedRows}
        if (checked) {
            _selectedRows[data.key] = [...data.results];
        } else {
            _selectedRows[data.key] = [];
        }
        setSelectedRows(_selectedRows);
    };

    const recordBodyTemplate = (rowData, layerKey, cfg) => {
        const precision = cfg?.precision || 100;

        const fields = rowData?.fields || cfg?.fields || [];

        const showAreaTable = rowData?.dimension == 2 &&
            (intersectConfig?.showResultMeasure !== false || intersectConfig?.showResultPercentage !== false);

        const showLengthTable = rowData?.dimension == 1 &&
            (intersectConfig?.showResultMeasure !== false || intersectConfig?.showResultPercentage !== false);

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
                            { showResultMeasure !== false ? <th>{`${t("area", "Área")} (m²)`}</th> : null }
                            { showResultPercentage !== false ? <th>%</th> : null }
                        </tr>
                        <tr>
                        { showResultMeasure !== false ?
                            <td>{rowData.area != null ? (Math.round(rowData.area  * precision)  / precision) : rowData.area}</td>
                            : null }
                        { showResultPercentage !== false ?
                            <td>{rowData.percent != null ? (Math.round(rowData.percent * precision)  / precision) : rowData.percent}</td>
                            : null }
                        </tr>
                    </table>
                </div>
                }
                { showLengthTable &&
                <div className='flex'>
                    <table className='sg-intersect-results-table-area'>
                        <tr>
                            { showResultMeasure !== false ? <th>{`${t("length", "Comprimento")} (m)`}</th> : null }
                            { showResultPercentage !== false ? <th>%</th> : null }
                        </tr>
                        <tr>
                        { showResultMeasure !== false ?
                            <td>{rowData.length != null ? (Math.round(rowData.length  * precision)  / precision) : rowData.length}</td>
                            : null }
                        { showResultPercentage !== false ?
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
                title = t(_group.title || title, _group.title || title);
            }
        }
        return <label className='font-bold'>{title}</label>;
    };

    const rowExpansionTemplate = (data) => {
        let header = null;
        if (data?.results?.length > 1) {
            header = (
                <Group justify="flex-end" gap="xs" className="mt-2 mr-2 font-normal">
                    <Checkbox
                        name="selectAll"
                        label={t("showAll", "Ver todos")}
                        onChange={(e) => onSelectAllChange(e.currentTarget.checked, data)}
                        checked={selectAll[data.key] || false}
                    />
                </Group>
            );
        }

        if (intersectConfig?.showResultGeometries === false) {
            return (
                <DataGrid
                    idAccessor="key"
                    records={data.results}
                    noHeader
                    className='sg-intersect-results-table'
                    columns={[
                        { accessor: 'record', render: (rowData) => recordBodyTemplate(rowData, data.key, { fields: data?.fields}) },
                    ]}
                />
            );
        }

        return (
            <>
                {header}
                <DataGrid
                    idAccessor="key"
                    records={data.results}
                    noHeader
                    className='sg-intersect-results-table'
                    selectedRecords={selectedRows[data.key] || []}
                    onSelectedRecordsChange={(records) => onSelectionChange(records, data)}
                    columns={[
                        { accessor: 'record', render: (rowData) => recordBodyTemplate(rowData, data.key, {...data}) },
                    ]}
                />
            </>
        );

    };

    const exportToolbar = exportFormats?.length > 3 ? (
        <Menu>
            <Menu.Target>
                <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    leftSection={<i className="pi pi-upload" aria-hidden="true" />}
                    rightSection={<i className="pi pi-chevron-down" aria-hidden="true" />}
                    disabled={downloadingFile}
                    loading={downloadingFile}
                >
                    {t("export", "Exportar")}
                </Button>
            </Menu.Target>
            <Menu.Dropdown>
                {exportFormats.map((format) => (
                    <Menu.Item
                        key={format}
                        leftSection={<i className={`pi ${ fileFormats?.[format]?.icon ? fileFormats[format].icon : "pi-file" }`} aria-hidden="true" />}
                        onClick={() => exportResults(format)}
                    >
                        {fileFormats?.[format]?.label || format.toUpperCase()}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    ) : (
        <React.Fragment>
            {
                exportFormats.map((format, index) => {
                    return (
                        <Button
                            key={index}
                            type="button"
                            size="xs"
                            variant="default"
                            leftSection={<i className={`pi ${ fileFormats?.[format]?.icon ? fileFormats[format].icon : "pi-file" }`} aria-hidden="true" />}
                            disabled={downloadingFile}
                            loading={downloadingFile && downloadingFormat == format}
                            onClick={() =>  {
                                exportResults(format);
                            }
                        }>
                            {format.toUpperCase()}
                        </Button>
                    );
                })
            }
        </React.Fragment>
    );

    const header = (
        <div className="flex justify-content-between flex-wrap">
            { showTablesButton && <div className="flex flex-wrap justify-content-end gap-2 my-1">
                <Button type="button" size="xs" variant="subtle" leftSection={<i className="pi pi-table" aria-hidden="true" />} onClick={showTable}>{t("tables", "Tabelas")}</Button>
            </div> }
            <div className="flex flex-wrap justify-content-end gap-2 my-1">
                <Button type="button" size="xs" variant="subtle" leftSection={<i className="pi pi-plus" aria-hidden="true" />} onClick={expandAll}>{t("expand", "Expandir")}</Button>
                <Button type="button" size="xs" variant="subtle" leftSection={<i className="pi pi-minus" aria-hidden="true" />} onClick={collapseAll}>{t("collapse", "Recolher")}</Button>
            </div>
        </div>
    )

    return (
        <div className="mt-4">
            <h3>{t("results", "Resultados")}</h3>

            { intersectConfig?.showExport !== false ?
                <Group justify="center" gap="xs" wrap="wrap" className="sg-intersect-export my-2">{exportToolbar}</Group> : null }

            <div className="text-right mb-2">

            </div>

            <div className="flex align-items-center my-3">
                <Checkbox
                    name="showGeometry"
                    label={t("showIntersectionGeometry", "Ver Geometria da Confrontação")}
                    onChange={(e) => setShowGeometry(e.currentTarget.checked)}
                    checked={showGeometry}
                />
            </div>

            <div className="mt-2">
                {header}
                <DataGrid
                    idAccessor="key"
                    records={items}
                    noHeader
                    className='sg-intersect-results-table'
                    columns={[
                        {
                            accessor: 'expander',
                            width: '1rem',
                            render: (rowData) => (rowData?.results?.length > 0 ?
                                <i className={expandedKeys.includes(rowData.key) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'} aria-hidden="true" /> : null),
                        },
                        { accessor: 'title', render: itemBodyTemplate },
                    ]}
                    rowExpansion={{
                        allowMultiple: true,
                        expanded: { recordIds: expandedKeys, onRecordIdsChange: setExpandedKeys },
                        content: ({ record }) => rowExpansionTemplate(record),
                    }}
                />
            </div>

        </div>
    )
}
