import React, { useState, useEffect, useMemo } from 'react';
import { FigTreeEvaluator } from 'fig-tree-evaluator';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';

import {
  i18n,
  JsonForm,
  JsonFormContext, 
  JsonFormDefaultRenderers,
  JsonFormValidationMode
} from '@scalargis/components';

import { getFeatures } from './service';
import SearchLayerResults from './SearchLayerResults';


let toastEl = null;

const fig = new FigTreeEvaluator({ evaluateFullObject: true });


export default function SearchLayerForm(props) {
  const {core, viewer, auth, actions, pubsub, dispatch, mainMap, Models, layers, layer, 
    searchConfig, schemaConfig, goPanelSearchPrev} = props;
  const { showOnPortal } = Models.Utils;
  
  const {schema={}, uischema={}, geometry_field} = schemaConfig || {};

  const id = searchConfig?.id;

  const searchTitle = searchConfig?.title ? i18n.translateValue(searchConfig.title, searchConfig?.title) : "";
  
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [results, setResults] = useState({});

  const validationMode = JsonFormValidationMode[searchConfig?.validationMode];

  const doSearch = (startIndex=0, maxFeatures, filter, sort) => {
    let start = null;
    let numRecords = null;
  
    if (searchConfig.pagination == null || searchConfig.pagination === true) {
      start = startIndex;
      numRecords = maxFeatures || searchConfig.maxFeatures || 10;
    }

    const cfg = {geometry_field, ...searchConfig};

    props.setBlockedPanel(true);

    getFeatures({core, cfg, schema, startIndex: start, maxFeatures: numRecords, filter, sort, viewer, auth}).then(data=> {
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

      <div className="p-mt-2">{searchTitle}</div>
      <hr />

      { props?.errorSchema && <React.Fragment>
        <Message
          severity="warn"
          text={props?.errorSchema.message} 
        />
      </React.Fragment> }

      <React.Fragment>
        <div className="p-mt-3">
          <JsonFormContext.Provider value={{utils: Models.Utils}}>
            <JsonForm
              schema={schema}
              uischema={uischema}
              data={id ? formData[id] || {} : {} }
              renderers={JsonFormDefaultRenderers}
              //cells={vanillaCells}
              onChange={({ data, errors }) => {
                const _formdata = {...formData};
                _formdata[id] = data;
                setFormData(_formdata);

                const _formerrors = {...formErrors}
                _formerrors[id] = errors;
                setFormErrors(_formerrors);
              }}
              validationMode={validationMode}
              //locale={locale}
              //translations={translations}
              //i18n={{locale: locale, translate: translation}}
            />
          </JsonFormContext.Provider>
        </div>

        <div className="p-text-center">
          <Button onClick={() => {
              const _formdata = {...formData};
              _formdata[id] = {};
              setFormData(_formdata);

              const _formerrors = {...formErrors};
              _formerrors[id] = {};
              setFormErrors(_formerrors);

              const _results = {...results};
              _results[id] = null;
              setResults(_results);

              if (layer && layer.current) layer.current.getSource().clear();
            }}
            className="p-mr-2"
            color='primary'>
            Limpar
          </Button>
          <Button onClick={async (e) => {
              if (formErrors[id]?.length) return;

              const getFormData = async (schema, formData, config) => {
                let _formData = {...formData};
                if (config?.transformer) {
                  const result = await fig.evaluate(config?.transformer, {data: _formData});
                  _formData = result;
                }

                if (config?.fields_exclude_query?.length) {
                  const tmpFields = {};
                  Object.keys(finalFormData).forEach(k => {
                    if (!config.fields_exclude_query.includes(k)) {
                      tmpFields[k] = finalFormData[k];
                    }
                  });
                  _formData = {...tmpFields}
                }

                const template = config?.fields_form;

                if (!_formData || !template) return _formData;

                //Get filled form fields
                const formvalues = {};
                Object.entries(_formData).forEach(([k, v]) => {
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
                  return !(k in (_formData || {})) && !(k in (schema?.properties || {}));
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
              const data = await getFormData(schema, formData[id], searchConfig);

              //Set default sort field
              let sort;
              if (searchConfig?.fields_sort?.length) {
                sort = {}
                sort[searchConfig.fields_sort[0]] = 'ASC';
              }

              doSearch(0, null, data, sort);

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
            core={core}
            viewer={viewer}
            auth={auth}          
            actions={actions}
            Models={Models}
            pubsub={pubsub}
            dispatch={dispatch}
            mainMap={mainMap}
            layers={layers}
            layer={layer}
            searchConfig={searchConfig}
            results={results[id]}
            doSearch={doSearch}
          />
        }
      </React.Fragment> 
    </>
  )

}