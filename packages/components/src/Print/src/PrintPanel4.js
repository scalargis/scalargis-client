import React, { useState, useEffect, useRef } from 'react';
import { useTranslation} from "react-i18next";
import Cookies from 'universal-cookie';
import { Button } from 'primereact/button'
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';

import './style.css'


export default function PrintPanel4(props) {

  const { core, control, printGroup, printLayer, printDetails, finalPrints, setFinalPrints, fields, geometries, config, actions } = props;
  const { viewer, mainMap, dispatch, Models } = config;
  const { getScaleForResolution } = Models.MapModel;
  const { showOnPortal } = Models.Utils;

  const { t } = useTranslation();

  const [isProcessing, setIsProcessing] = useState(true);
  const [isMergingFiles, setIsMergingFiles] = useState(false);
  const [mergedFile, setMergedFile] = useState(null);

  const toast = useRef(null);

  const API_URL = core.API_URL;

  function goPanelPrintPrev() {
    setFinalPrints([]);
    props.changeActivePanel('p3');
  }

  function getFinalPrintsTotal() {
    const total = finalPrints.map(p => p.error ? 0 : 1).reduce((sum, val) => sum + val);
    return total;
  }

  function mergePrintFiles(prints) {
    const files = [];

    if (prints) {
      prints.forEach(print => {
        if (print.filename) {
          files.push(print.filename);
        }
      });
    } else {
      finalPrints.forEach(print => {
        if (print.filename) {
          files.push(print.filename);
        }
      });
    }

    const record = { 
      viewerId: viewer.id,
      files
    }

    let options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(record)
    }
    
    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    let url = API_URL + '/app/viewer/'+ viewer.id + '/print/merge';

    setIsMergingFiles(true);

    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        setIsMergingFiles(false);               

        if (res.Success) {
          setMergedFile({ filename: res.Data.filename, url: res.Data.url });
        } else {
          throw(t("errorCreatingFile", "Ocorreu um erro ao gerar o ficheiro"));
        }
      }).catch(error => {
        setIsMergingFiles(false);
        setMergedFile(null);
        /*
        toastEl.show({
          severity: 'error',
          summary: 'Ocorreu um erro inesperado',
          detail: "Não foi possível obter a informação das plantas.",
          sticky: false
        });
        */
      });
  }

  useEffect(() => {
    // Set fetch options
    let options = {
      headers: {
        'Accept': 'application/json',       
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: {}
    }

    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    // Make a shallow copy of the print items
    let newFinalPrints = [...finalPrints];

    const promises = finalPrints.map(async (print) => {

      const url = API_URL + '/app/viewer/' + viewer.id + '/print/' + print.code + '/generate';

      const scale = getScaleForResolution(mainMap.getView().getResolution(), 'm');      

      const record = {
        ...printDetails.userFormData,
        viewerId: viewer.id,
        printId: print.id, 
        groupId: print.groupId,
        srid: print.srid || 3857,
        layout: 'A4|Portrait',
        scale: scale, 
        extentWKT: ''
      }

      if (printDetails.userFormData) {
        record['formFields'] = JSON.stringify(printDetails.userFormData);
      }

      if (fields.layout) {
        record['layout'] = fields.layout.format + '|' + fields.layout.orientation;
      }      

      const outProj = print.srid ? 'EPSG:' + print.srid : mainMap.getView().getProjection().getCode();
      
      const extent = Models.MapModel.transformExtent(mainMap.getView().getProjection().getCode(), outProj, mainMap.getView().calculateExtent(mainMap.getSize()));
      if (extent) {
        record.extentWKT = Models.MapModel.getWKTFromGeometry(Models.MapModel.getPolygonFromExtent(extent));
      }

      const geomWKT = [];
      if (geometries && geometries.length > 0) {
        geometries.forEach(g => {
          geomWKT.push(Models.MapModel.getWKTFromGeometry(g.clone().transform(mainMap.getView().getProjection().getCode(), outProj)));
        });
      }

      let data = Object.keys(record).map(key => key + '=' + record[key]).join('&');

      if (geomWKT && geomWKT.length > 0) {
        data += '&' + geomWKT.map(wkt => 'geomWKT[]=' + wkt).join('&');
      }

      let opts = {
        ...options,
        body: data
      }     

      return fetch(url, opts)
        .then(res => res.json())
        .then(res => {
          // Make a shallow copy of the item we want to mutate
          let item = {...print};
          if (res.Success) {            
            // 1. Get print array index
            const index = finalPrints.findIndex(p => p.uuid == print.uuid);
            
            //DEBUG
            //if (index > 2) throw(res.Message || 'Ocorreu um erro ao gerar a planta');

            // 2. Replace the property we're intested in
            item.processed = true;
            item.processing = false;
            item.error = false;
            item.filename = res.Data.filename;
            item.url = res.Data.url;            
            // 3. Put it back into our array.
            newFinalPrints[index] = item;
            // 4. Set the state to our new copy        
            setTimeout(function(){ setFinalPrints(newFinalPrints); }, 500);
          } else {
            throw(res.Message || t("errorPrinting", "Ocorreu um erro ao gerar a planta"));
          }
          return {...item};
        }).catch(error => {
          const index = finalPrints.findIndex(p => p.uuid == print.uuid);
          
          let item = {...print};
          item.processed = false;
          item.processing = false;
          item.error = t("printError", "Não foi possível gerar a planta");

          newFinalPrints[index] = item;          
          setTimeout(function(){ setFinalPrints(newFinalPrints); }, 500);
          
          return {...item};
        });
    });

    Promise.all(promises).then(res => {
      let hasInvalidPrints = false;
      res.forEach(print => {
        if (print.error) {
          hasInvalidPrints = true;
        }
      });

      if (hasInvalidPrints) {
        toast.current.show({ severity: 'warn', summary: printDetails.title || 'Emissão de plantas', 
          detail: t("printAllError", "Não foi possível gerar todas as plantas"), life: 3000 });
      }

      setFinalPrints([...res]);
      setIsProcessing(false);      
      if (printDetails.merge_prints) {
        setTimeout(mergePrintFiles([...res]), 1000);
      }
    });

  }, []);  

  return (
    <div className="print-panel4">

      {showOnPortal(<Toast ref={toast} position="top-right" />)}

      <h3>{printDetails.title}</h3>

      <div className="p-fluid">
        { isProcessing ?    
        <Message severity="info" text={t("generatingPrints", "A gerar as plantas...")} /> :
        <Message severity="info" text={t("finishPrinting","Plantas geradas. Pode descarregar as plantas pretendidas.")} />
        }
      </div>      

      <div className="mt-4">
        { finalPrints.map( print => {
          if (print.error) {
            return (
              <div className="grid">
                <div className="col-fixed" style={{ width: '30px' }}>
                  <div className="pl-2">
                    <i className='pi pi-times-circle print-error'></i>
                  </div>
                </div>                
                <div className="col-9">
                  { print.groupTitle ? print.groupTitle + ' - ' + print.title :  print.title }
                </div>
                <div className="col">
                  <i className="pi pi-external-link pl-2"></i>
                </div>
              </div>
            )
          } else {
            if (printDetails.merge_prints) {
              return (
                <div className="grid">
                  <div className="col-fixed" style={{ width: '30px' }}>
                    <div className="pl-2">
                      <i className={print.processed ? 'pi pi-check print-success' : 'pi pi-spin pi-spinner'}></i>
                    </div>
                  </div>
                  <div className="col">
                      { print.groupTitle ? print.groupTitle + ' - ' + print.title :  print.title }
                  </div>               
                </div>
              )
            } else {
              return (
                <div className="grid">
                  <div className="col-fixed" style={{ width: '30px' }}>
                    <div className="pl-2">
                      <i className={print.processed ? 'pi pi-check print-success' : 'pi pi-spin pi-spinner'}></i>
                    </div>
                  </div>
                  <div className="col-9">
                      { print.groupTitle ? print.groupTitle + ' - ' + print.title :  print.title }
                  </div>
                  <div className="col">
                    { print.processed ?
                      <a href={print.url} target="_blank" title={t("openPrint", "Abrir planta")}
                        style={ { textDecoration: "none", color: "#2196f3"} }>
                        <i className="pi pi-external-link pl-2"></i>
                      </a> : null
                    }
                  </div>                
                </div>
              )
            }
          }
        }) }
      </div>

      { mergedFile ?
        <div className="card text-center">
          <a href={mergedFile.url} target="_blank" style={ { textDecoration: "none", color: "#2196f3"} }>
            <i className="pi pi-external-link pl-2"></i> {t("openAllPrintsPDF", "Abrir PDF com todas as plantas")}
          </a>          
        </div> :
        null
      }

      { !isProcessing && !mergedFile && getFinalPrintsTotal() > 1 ?
        <div className="card text-center">
          <Button label={t("createAllPrintsPDF", "Criar PDF com todas as plantas")}
            icon={ isMergingFiles ? 'pi pi-spin pi-spinner' : '' } 
            className="p-button"
            onClick={e => { mergePrintFiles(); }}
            />
        </div> :
        null
      }

      <div className="card">
        <div className="grid">
          <div className="col text-left">
            <Button
                label={t("back", "Voltar")}
                icon="pi pi-chevron-left"
                className="p-button-sm"
                onClick={e => { goPanelPrintPrev(); }}
            />
          </div>
        </div>  
      </div> 

    </div>
  )

}