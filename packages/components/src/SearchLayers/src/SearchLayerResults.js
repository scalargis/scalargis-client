import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFeature from 'ol/Feature';
import {getCenter as olGetCenter} from 'ol/extent';

import { i18n } from '@scalargis/components';

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
    results.features.forEach(f => {
      let properties = f.getProperties(); //(({ geometry, ...o }) => o)(f.getProperties()); // remove geometry field
      properties = { id_: f.getId(), ...properties }
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
  function zoomLayerFeatures() {
    let extent = layer.current.getSource().getExtent();
    if (extent) {
      const bufferValue = 500;
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
        <React.Fragment>
            <Button icon="pi pi-search" className="p-button-rounded p-button-text p-mr-2" 
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
                    zoomLayerFeatures();
                  });
                } else {
                  const geom = rowData.geometry.clone().transform('EPSG:4326',mainMap.getView().getProjection().getCode());
                  const feature = new OlFeature({...rowData, geometry: geom});
                  feature.setId(rowData.id_);
                  layer.current.getSource().addFeature(feature);
                  zoomLayerFeatures();
                }                
              }} />
        </React.Fragment>
    );
  }
  
  const paginatorTemplate = {
    layout: 'RowsPerPageDropdown CurrentPageReport',
    'RowsPerPageDropdown': (options) => {
        const dropdownOptions = [
            { label: 10, value: 10 },
            { label: 20, value: 20 },
            { label: 50, value: 50 }
        ];

        return (
          <>
              <span className="p-mx-1" style={{ color: 'var(--text-color)', userSelect: 'none' }}>Registos: </span>
              <Dropdown value={results.maxFeatures} options={dropdownOptions} onChange={(e) => doSearch(0, e.value, results.filter, results.sort)} />
          </>
        );
    },
    'CurrentPageReport': (options) => {
        return (
            <span style={{ color: 'var(--text-color)', userSelect: 'none', width: '120px', textAlign: 'center' }}>
                {results.startIndex + 1} - {results.startIndex + data.length} de {options.totalRecords}
            </span>
        )
    }
  };

  const totalPaginatorTemplate = {
    layout: 'CurrentPageReport',
    'CurrentPageReport': (options) => {
        return (
            <span style={{ color: 'var(--text-color)', userSelect: 'none', width: '120px', textAlign: 'center' }}>
                {options.totalRecords} registos
            </span>
        )
    }
  };
  
  const showPagination = () => {
    let show = (searchConfig.pagination == null || searchConfig.pagination === true);
    if (results && results.startIndex === 0 && results.total <= 1) {
      show = false;
    }
    return show;
  }

  const getPaginator = () => {
    return {
      paginator: showPagination(),
      paginatorTemplate: searchConfig.pagination === false ? totalPaginatorTemplate : paginatorTemplate
    }
  }

  const htmlTemplate = (rowData, field) => {
    let new_value = field.value ? field.value : rowData[field.name];
    const rf = (new_value && new_value.match) ? new_value.match(/[^{}]+(?=})/g) : null;
    if (rf) {
      rf.forEach(fld => {
        new_value = new_value.replace(`{${fld}}`, rowData[fld] || '');      
      });                 
    }    
    return <div dangerouslySetInnerHTML={{__html: new_value}} />;
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

      let data = {...action.data}
      Object.entries(data).forEach(([key, value]) => {
        data[key] = formatTemplateValue(rowData, value);
      });

      return <Button label={label} icon={action.icon}
          className={action.classname || action.className}
          title={tooltip}
          onClick={(e) => publish(action.type, data)}
        />
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
        Object.getPrototypeOf(input).isPrototypeOf(Object);
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

    return cols.map((f, i) => {
      const sortable = cfg.fields_sort && cfg.fields_sort.length > 0 && cfg.fields_sort.includes(f[0]);

      if (cfg?.fields_list) {
        const field_cfg = cfg.fields_list[f[0]];

        if (field_cfg) {
          if (field_cfg.type === 'html') {
            return <Column key={i+1} field={f[0]} header={f[1]} sortable={sortable}
              style={field_cfg.style}
              body={(rowData) => htmlTemplate(rowData, {...field_cfg, 'name': f[0]})} />
          } else if (field_cfg.type === 'action') {
            return <Column key={i+1} field={f[0]} header={f[1]} sortable={sortable}
              style={field_cfg.style}
              body={(rowData) => actionTemplate(rowData, {...field_cfg, 'name': f[0]})} />
          } else {
            return <Column key={i+1} field={f[0]} header={f[1]} sortable={sortable}
              style={field_cfg.style}
              body={(rowData) => valueTemplate(rowData, {...field_cfg, 'name': f[0]})} />
          }
        }
      }

      return <Column key={i+1} field={f[0]} header={f[1]} sortable={sortable} />

    });
  }

  return (
    <>
      <DataTable value={data} lazy
        {...getPaginator()} 
        first={results.startIndex} 
        rows={results.maxFeatures} totalRecords={totalRecords}
        sortField={sortField} sortOrder={sortOrder}
        onSort={(e) => {
          const new_sort = {};
          new_sort[e.sortField] = e.sortOrder === 1 ? 'ASC' : 'DESC'
          doSearch(0, results.maxFeatures, results.filter, new_sort);
        }}
        paginatorClassName="p-jc-end" className="p-mt-4"> 
        {(columns && columns.length > 0) && <Column key={0} body={zoomActionTemplate} style={{width: '30px'}} />}
        {buildColumns(searchConfig, columns).map(c => c)}
      </DataTable>
      
      { showPagination() &&
        <Paginator first={results.startIndex} rows={results.maxFeatures} totalRecords={totalRecords} pageLinkSize={3} 
          onPageChange={e => {
              doSearch(e.first, results.maxFeatures, results.filter, results.sort);
          }} 
          style={{fontSize: ".8rem"}}></Paginator>
      }
    </>

  )

}