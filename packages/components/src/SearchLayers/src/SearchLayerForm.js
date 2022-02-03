import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { JsonForms } from '@jsonforms/react';
import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';

import PrimereactVerticalLayoutRenderer, { primereactVerticalLayoutTester } from './renderes/layouts/PrimereactVerticalLayoutRenderer';
import PrimereactHorizontalLayoutRenderer, { primereactHorizontalLayoutTester } from './renderes/layouts/PrimereactHorizontalLayoutRenderer';

import { getDescribeFeatureType, getFeatures } from './service';
import SearchLayerResults from './SearchLayerResults';

let toastEl = null;

const renderers = [
  ...vanillaRenderers,
  //register custom renderers
  { tester: primereactVerticalLayoutTester, renderer: PrimereactVerticalLayoutRenderer },
  { tester: primereactHorizontalLayoutTester, renderer: PrimereactHorizontalLayoutRenderer }
];

export default function SearchLayerForm(props) {
  const {viewer, auth, actions, dispatch, mainMap, Models, layers, layer, 
    searchConfig, schemaConfig, updateLayerSchema, goPanelSearchPrev} = props;
  const { showOnPortal } = Models.Utils;
  
    const {schema={}, uischema={}, geometry_field} = schemaConfig || {};

  const id = searchConfig?.id;

  const [loaded, setLoaded] = useState(false);
  const [errorSchema, setErrorSchema] = useState(null);
  const [formData, setFormData] = useState({});
  const [results, setResults] = useState({});

  useEffect(() => {    
    setErrorSchema(null);

    if (schema && Object.keys(schema).length > 0 && uischema && Object.keys(uischema).length) {
      setLoaded(true);
      return;
    }

    setLoaded(false);

    props.setBlockedPanel(true);

    getDescribeFeatureType({cfg: searchConfig, viewer, auth}).then(data => {
      try {
        updateLayerSchema(id, data);
      } catch (err) {
        return Promise.reject(err);
      }
      setLoaded(true);
    }).catch(error => {      
      console.log(error);
      setErrorSchema({message:'Não foi possível obter informação do tema'});
    }).finally(()=> {
      props.setBlockedPanel(false);
    });
  }, [id]);

  const doSearch = (startIndex=0, maxFeatures, filter, sort) => {
    let start = null;
    let numRecords = null;
  
    if (searchConfig.pagination == null || searchConfig.pagination === true) {
      start = startIndex;
      numRecords = maxFeatures || searchConfig.maxFeatures || 10;
    }

    const cfg = {geometry_field, ...searchConfig};

    props.setBlockedPanel(true);

    getFeatures({cfg, schema, startIndex: start, maxFeatures: numRecords, filter, sort, viewer, auth}).then(data=> {
      const new_results = {...results};
      new_results[id] ={
        filter: filter || {},
        sort: sort || {},
        startIndex, 
        maxFeatures: numRecords, 
        total: data.total, 
        features: data.features        
      };
      if (layer && layer.current) layer.current.getSource().clear();
      setResults(new_results);
    }).catch(error => {
      console.log(error);
      toastEl.show({
        severity: 'error',
        summary: 'Ocorreu um erro',
        detail: 'Não foi possível realizar a pesquisa',
        sticky: true
      });      
    }).finally(()=> props.setBlockedPanel(false));
  }
  
  return (
    <>
      {showOnPortal(<Toast ref={(el) => toastEl = el} />)}

      {goPanelSearchPrev && <div className="p-mt-2">
        <div className="p-grid">
          <div className="p-col p-text-left">
            <Button
                label="Voltar"
                icon="pi pi-chevron-left"
                className="p-button-sm"
                onClick={e => { goPanelSearchPrev(); }}
            />
          </div>
        </div>  
      </div>}

      <div class="p-mt-2">{searchConfig.title}</div>        
      <hr />

      { errorSchema && <React.Fragment>
        <Message
          severity="warn"
          text={errorSchema.message} 
        />
      </React.Fragment> }

      { loaded && <React.Fragment>
        <div class="p-mt-3">
          <JsonForms
            schema={schema}
            uischema={uischema}
            data={formData[id]}
            renderers={renderers}
            cells={vanillaCells}
            onChange={({ data, _errors }) => {
              const new_formdata = {...formData};
              new_formdata[id] = data;
              setFormData(new_formdata);
            }}
          />       
        </div>

        <div className="p-text-center">
          <Button onClick={() => {
            const new_formdata = {...formData};
            new_formdata[id] = {};
            setFormData(new_formdata);
            const new_results = {...results};
            new_results[id] = null;
            setResults(new_results);
            if (layer && layer.current) layer.current.getSource().clear();
            }}
            className="p-mr-2"
            color='primary'>
            Limpar
          </Button>
          <Button onClick={(e) => {
              const getFormData = (schema, formData, template) => {
                if (!formData || ! template) return formData;

                //Get filled form fields
                const formvalues = {};
                Object.entries(formData).forEach(([k, v]) => {
                  const val = (typeof v == 'number' && Number.isNaN(v)) ? null : v + '';
                  if (val !== null && val !== '') {
                    formvalues[k] = v;
                  }
                });             
                
                //Apply expression to filled form fields values
                const fielddata = Object.entries(formvalues).map(([k, v]) => {
                  let final_value = v;
                  if (k in template && template[k].expression) {
                    final_value = template[k].expression.replace('{value}', v);                 
                    Object.entries(formvalues).forEach(([f, z]) => {
                      final_value = final_value.replace('{' + f + '}', z);
                    });
                  }
                  return {[k]: final_value};
                }).reduce((obj, val) => {
                  return Object.assign(obj, val);
                }, {});

                //Apply expression to virtual form fields
                const virtualdata = Object.entries(template).filter(([k, v]) => {
                  //Exclude form fields
                  return !(k in (formData || {})) && !(k in (schema?.properties || {}));
                }).map(([k, v]) => {
                  let final_value = v.expression;
                  Object.entries(formvalues).forEach(([f, z]) => {
                    final_value = final_value.replace('{' + f + '}', z);
                  });                
                  return { [k]: final_value};
                }).reduce((obj, val) => {
                  return Object.assign(obj, val);
                }, {});

                const data = {...virtualdata, ...fielddata};
                return data;
              }
              
              //Combine values of form and virtual fields
              const data = getFormData(schema, formData[id], searchConfig.fields_form);
              doSearch(0, null, data);

          }} color='primary'>
            Pesquisar
          </Button> 
        </div>

        {(results && results[id] && results[id].total === 0) &&
          <div className="p-mt-4" style={{textAlign: 'center'}}>
            <Message
              severity="info"
              text='Pesquisa sem resultados'
            />
          </div>
        }

        {(results && results[id] && results[id].total > 0) &&
          <SearchLayerResults
            viewer={viewer}
            auth={auth}          
            actions={actions}
            dispatch={dispatch}
            mainMap={mainMap}
            layers={layers}
            layer={layer}
            searchConfig={searchConfig}
            results={results[id]}
            doSearch={doSearch}
          />
        }
      </React.Fragment> }  
    </>
  )

}