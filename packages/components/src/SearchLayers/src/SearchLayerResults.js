import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import OlFormatGeoJSON from 'ol/format/GeoJSON';
import OlFeature from 'ol/Feature';
import {getCenter as olGetCenter} from 'ol/extent';
import { getFeatureById } from './service';

export default function SearchLayerResults(props) {

  const {viewer, auth, actions, dispatch, mainMap, layer, searchConfig, doSearch, results} = props;

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
                  getFeatureById({cfg: searchConfig, featureId: rowData['id_'], viewer, auth}).then(d => {                   
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
      if (cfg.fields_sort && cfg.fields_sort.length > 0 && cfg.fields_sort.includes(f[0])) {
        return <Column key={i+1} field={f[0]} header={f[1]} sortable />
      } else {
        return <Column key={i+1} field={f[0]} header={f[1]} />
      }
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