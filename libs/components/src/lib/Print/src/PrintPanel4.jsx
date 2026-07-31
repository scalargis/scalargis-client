import React, { useState, useEffect } from 'react';
import { useTranslation} from "react-i18next";
import { Alert, Button, Group, Loader } from '@mantine/core';
import { notify } from '@scalargis/ui';

import './style.css';


export default function PrintPanel4(props) {

  const { core, printDetails, finalPrints, setFinalPrints, fields, geometries, config } = props;
  const { viewer, mainMap, Models } = config;
  const { getScaleForResolution } = Models.MapModel;

  const { t } = useTranslation();

  const [isProcessing, setIsProcessing] = useState(true);
  const [isMergingFiles, setIsMergingFiles] = useState(false);
  const [mergedFile, setMergedFile] = useState(null);

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

    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
    const logged = core.getLoggedUser();
    if (logged) options.headers['X-API-KEY'] = logged.token;

    const url = API_URL + '/app/viewer/'+ viewer.id + '/print/merge';

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
      });
  }

  useEffect(() => {
    // Set fetch options
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: {}
    }

    // Get logged user
    const logged = core.getLoggedUser();
    if (logged) options.headers['X-API-KEY'] = logged.token;

    // Make a shallow copy of the print items
    const newFinalPrints = [...finalPrints];

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

      const opts = {
        ...options,
        body: data
      }

      return fetch(url, opts)
        .then(res => res.json())
        .then(res => {
          // Make a shallow copy of the item we want to mutate
          const item = {...print};
          if (res.Success) {
            // 1. Get print array index
            const index = finalPrints.findIndex(p => p.uuid == print.uuid);

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

          const item = {...print};
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
        notify.warn(printDetails.title || 'Emissão de plantas',
          t("printAllError", "Não foi possível gerar todas as plantas"));
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

      <h3>{printDetails.title}</h3>

      <Alert color="informative" py="xs">
        <Group justify="center" gap="xs" wrap="nowrap">
          <i className="pi pi-info-circle" aria-hidden="true" />
          <span>{ isProcessing ?
            t("generatingPrints", "A gerar as plantas...") :
            t("finishPrinting","Plantas geradas. Pode descarregar as plantas pretendidas.")
          }</span>
        </Group>
      </Alert>

      <div className="mt-4">
        { finalPrints.map( (print, index) => {
          if (print.error) {
            return (
              <div key={print.uuid || index} className="grid">
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
                <div key={print.uuid || index} className="grid">
                  <div className="col-fixed" style={{ width: '30px' }}>
                    <div className="pl-2">
                      { print.processed ? <i className="pi pi-check print-success"></i> : <Loader size="xs" /> }
                    </div>
                  </div>
                  <div className="col">
                      { print.groupTitle ? print.groupTitle + ' - ' + print.title :  print.title }
                  </div>
                </div>
              )
            } else {
              return (
                <div key={print.uuid || index} className="grid">
                  <div className="col-fixed" style={{ width: '30px' }}>
                    <div className="pl-2">
                      { print.processed ? <i className="pi pi-check print-success"></i> : <Loader size="xs" /> }
                    </div>
                  </div>
                  <div className="col-9">
                      { print.groupTitle ? print.groupTitle + ' - ' + print.title :  print.title }
                  </div>
                  <div className="col">
                    { print.processed ?
                      <a href={print.url} target="_blank" title={t("openPrint", "Abrir planta")}
                        style={ { textDecoration: "none", color: "#2196f3"} } rel="noreferrer">
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
          <a href={mergedFile.url} target="_blank" style={ { textDecoration: "none", color: "#2196f3"} } rel="noreferrer">
            <i className="pi pi-external-link pl-2"></i> {t("openAllPrintsPDF", "Abrir PDF com todas as plantas")}
          </a>
        </div> :
        null
      }

      { !isProcessing && !mergedFile && getFinalPrintsTotal() > 1 ?
        <Group justify="center" mt="md">
          <Button
            loading={isMergingFiles}
            onClick={e => { mergePrintFiles(); }}
            >
            {t("createAllPrintsPDF", "Criar PDF com todas as plantas")}
          </Button>
        </Group> :
        null
      }

      <Group justify="flex-start" mt="md">
        <Button
            size="xs"
            leftSection={<i className="pi pi-chevron-left" aria-hidden="true" />}
            onClick={e => { goPanelPrintPrev(); }}
        >
          {t("back", "Voltar")}
        </Button>
      </Group>

    </div>
  )

}
