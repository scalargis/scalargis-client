import React, { useState, useEffect } from 'react';
import { ActionIcon, Button, Text } from '@mantine/core';
import { DataGrid } from '@scalargis/ui';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFeature from 'ol/Feature';
import {getCenter as olGetCenter} from 'ol/extent';

import parse from 'html-react-parser';

import { i18n } from '../../components';

import { getFeatureById } from './service';

export default function SearchLayerResults(props) {
  const { core, viewer, auth, actions, dispatch, mainMap, layer, searchConfig, doSearch, results } = props;
  const { publish, subscribe } = props.pubsub ? props.pubsub : {};

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalRecords, setTotalRecords] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  useEffect(() => {
    if (!results && !results.features && !results.features.length > 0) {
      setData([]);
      setColumns([]);
      setSortField(null);
      setSortOrder(null);
      return;
    }

    const new_data = [];
    results.features.forEach((f, idx) => {
      let properties = f.getProperties(); //(({ geometry, ...o }) => o)(f.getProperties()); // remove geometry field
      // The grid keys rows by id_; features without a server id fall back to
      // their absolute result index.
      properties = { id_: f.getId() != null ? f.getId() : `row-${results.startIndex + idx}`, ...properties }
      new_data.push(properties);
    });

    let new_cols = [];
    if (results &&  results.features && results.features.length > 0) {
        new_cols = results.features[0].getKeys().filter(k => k.toLowerCase() !== 'geometry')
    }

    setData(new_data);
    setColumns(new_cols);

    if ((results.startIndex === 0 && results.total < results.maxFeatures) ||  results.total >= results.maxFeatures) {
      setTotalRecords(results.total);
    }
    if (results.sort && Object.keys(results.sort).length > 0) {
      const fieldName = Object.keys(results.sort)[0];
      setSortField(fieldName);
      setSortOrder(results.sort[fieldName] === 'ASC' ? 1 : -1);
    }

  }, [results]);

  // Zoom to layer features
  function zoomLayerFeatures(buffer) {
    let extent = layer.current.getSource().getExtent();
    if (extent) {
      const _buffer_extent = extent[2] - extent[0] > extent[3] - extent[1] ? extent[2] - extent[0] : extent[3] - extent[1];
      const bufferValue = buffer != null ? buffer : _buffer_extent;
      extent = [
        extent[0] - bufferValue,
        extent[1] - bufferValue,
        extent[2] + bufferValue,
        extent[3] + bufferValue
      ];
      dispatch(actions.map_set_extent(olGetCenter(extent), extent));
    }
  }

  const zoomActionTemplate = (rowData) => {
    return (
        <ActionIcon variant="subtle" radius="xl" size="md"
          title="Zoom" aria-label="Zoom"
          onClick={() => {
            layer.current.getSource().clear();
            if (rowData.geometry == null) {
              getFeatureById({cfg: searchConfig, featureId: rowData['id_'], core, viewer, auth}).then(d => {
                if (!d.features || !d.features.length > 0) return;
                const options = {
                  dataProjection: 'EPSG:4326',
                  featureProjection: mainMap.getView().getProjection().getCode()
                }
                const features = new OlFormatGeoJSON(options).readFeatures(d);
                layer.current.getSource().addFeatures(features);
                zoomLayerFeatures(searchConfig?.zoom_buffer);
              });
            } else {
              const geom = rowData.geometry.clone().transform('EPSG:4326',mainMap.getView().getProjection().getCode());
              const feature = new OlFeature({...rowData, geometry: geom});
              feature.setId(rowData.id_);
              layer.current.getSource().addFeature(feature);
              zoomLayerFeatures();
            }
          }}>
          <i className="pi pi-search" aria-hidden="true" />
        </ActionIcon>
    );
  }

  const showPagination = () => {
    let show = (searchConfig.pagination == null || searchConfig.pagination === true);
    if (results && results.startIndex === 0 && results.total <= 1) {
      show = false;
    }
    return show;
  }

  const htmlTemplate = (rowData, field) => {
    let new_value = field.value ? field.value : rowData[field.name];
    const rf = (new_value && new_value.match) ? new_value.match(/[^{}]+(?=})/g) : null;
    if (rf) {
      rf.forEach(fld => {
        new_value = new_value.replace(`{${fld}}`, rowData[fld] || '');
      });
    }
    return <div>{parse(new_value)}</div>;
  }


  const actionTemplate = (rowData, field) => {
    const action = {...field.action};

    if (field.action.data) {
      const new_data = {}
      Object.entries(field.action.data).forEach(([key, value]) => {
        new_data[key] = formatTemplateValue(rowData, value);
      });
      action.data = new_data;
    }

    //Replace label value
    let label = action.icon ? action.label : action.label || 'Abrir';
    label = i18n.translateValue(label);
    label = formatTemplateValue(rowData, label);

    //Replace tooltip value
    let tooltip = action.tooltip;
    tooltip = i18n.translateValue(tooltip);
    tooltip = formatTemplateValue(rowData, tooltip);

    //Replace value
    let new_value = field.value ? field.value : rowData[field.name];
    new_value = formatTemplateValue(rowData, new_value);

    if (action.show_null === true || new_value != null) {

      const data = {...action.data}
      Object.entries(data).forEach(([key, value]) => {
        data[key] = formatTemplateValue(rowData, value);
      });

      return <Button size="xs"
          leftSection={action.icon ? <i className={action.icon} aria-hidden="true" /> : undefined}
          className={action.classname || action.className}
          title={tooltip}
          onClick={(e) => publish(action.type, data)}
        >
          {label}
        </Button>
    }

    return null;

  }

  const valueTemplate = (rowData, field) => {
    let new_value = field.value ? field.value : rowData[field.name];
    const rf = (new_value && new_value.match) ? new_value.match(/[^{}]+(?=})/g) : null;
    if (rf) {
      rf.forEach(fld => {
        new_value = new_value.replace(`{${fld}}`, rowData[fld] || '');
      });
    }
    return new_value;
  }

  const formatTemplateValue = (rowData, value) => {
    let new_value = value;

    const _isPureObject = (input) => {
      return null !== input &&
        typeof input === 'object' &&
        Object.prototype.isPrototypeOf.call(Object.getPrototypeOf(input), Object);
    }

    const _formatValue = (data, value) => {
      let _new_value = value;

      const rf = (_new_value && _new_value.match) ? _new_value.match(/[^{}]+(?=})/g) : null;
      if (rf) {
        if (rf.length === 1) {
          const fld = rf[0];
          if (fld in data) {
            _new_value = _new_value.replace(`{${fld}}`, data[fld] || '');
          }
        } else {
          rf.forEach(fld => {
            _new_value = _new_value.replace(`{${fld}}`, data[fld] || '');
          });
        }
      }
      return _new_value;
    }

    if (_isPureObject(value)) {
      function iter(o) {
        Object.keys(o).forEach(function (k) {
            if (o[k] !== null && typeof o[k] === 'object') {
                iter(o[k]);
                return;
            }
            o[k] = _formatValue(rowData, o[k]);
        });
      }
      iter(new_value);
    } else {
      new_value = _formatValue(rowData, value);
    }
    return new_value;
  }

  const buildColumns = (cfg, columns) => {
    let cols = [];
    if (cfg.fields_list && Object.keys(cfg.fields_list).length > 0) {
      cols = Object.entries(cfg.fields_list).map(([k, f]) => {
        return [k, f.label || k];
      })
    } else {
      cols = columns.map(f => [f, f]);
    }

    return cols.map((f) => {
      const sortable = cfg.fields_sort && cfg.fields_sort.length > 0 && cfg.fields_sort.includes(f[0]);

      const col = { accessor: f[0], title: f[1], sortable };

      if (cfg?.fields_list) {
        const field_cfg = cfg.fields_list[f[0]];

        if (field_cfg) {
          if (field_cfg.style) col.cellsStyle = () => field_cfg.style;

          if (field_cfg.type === 'html') {
            col.render = (rowData) => htmlTemplate(rowData, {...field_cfg, 'name': f[0]});
          } else if (field_cfg.type === 'action') {
            col.render = (rowData) => actionTemplate(rowData, {...field_cfg, 'name': f[0]});
          } else {
            col.render = (rowData) => valueTemplate(rowData, {...field_cfg, 'name': f[0]});
          }
        }
      }

      return col;
    });
  }

  const gridColumns = [
    ...((columns && columns.length > 0) ? [{ accessor: '__zoom__', title: '', width: 40, render: zoomActionTemplate }] : []),
    ...buildColumns(searchConfig, columns)
  ];

  const hasSortableColumns = gridColumns.some(c => c.sortable);

  // Server-driven paging/sorting: mantine-datatable pages are 1-based where
  // Prime's first was a 0-based row offset.
  const paginationProps = showPagination() ? {
    totalRecords,
    page: Math.floor(results.startIndex / results.maxFeatures) + 1,
    onPageChange: (p) => doSearch((p - 1) * results.maxFeatures, results.maxFeatures, results.filter, results.sort),
    recordsPerPage: results.maxFeatures,
    recordsPerPageOptions: [10, 20, 50],
    onRecordsPerPageChange: (size) => doSearch(0, size, results.filter, results.sort),
    recordsPerPageLabel: 'Registos',
    paginationText: ({ from, to, totalRecords: total }) => `${from} - ${to} de ${total}`,
  } : {};

  const sortProps = hasSortableColumns ? {
    sortStatus: { columnAccessor: sortField || '', direction: sortOrder === -1 ? 'desc' : 'asc' },
    onSortStatusChange: (status) => {
      const new_sort = {};
      new_sort[status.columnAccessor] = status.direction === 'asc' ? 'ASC' : 'DESC';
      doSearch(0, results.maxFeatures, results.filter, new_sort);
    },
  } : {};

  return (
    <div className="mt-4 search-layers-results">
      <DataGrid
        idAccessor="id_"
        records={data}
        columns={gridColumns}
        {...paginationProps}
        {...sortProps}
      />
      { searchConfig.pagination === false && totalRecords != null &&
        <Text size="sm" ta="center" mt="xs" c="dimmed">{totalRecords} registos</Text>
      }
    </div>
  )

}
