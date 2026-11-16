import React, { useState, useEffect } from 'react';
import { useTranslation} from "react-i18next";
import { Alert, Button, Group, Loader } from '@mantine/core';
import { notify, IconInfoCircle, IconXCircle, IconCheck, IconExternalLink, IconChevronLeft } from '@scalargis/ui';

import { runJob } from '../../utils/jobs';
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
    const total = finalPrints.map(p => p.error ? 0 : 1).reduce((sum, val) => sum + val, 0);
    return total;
  }

  function mergePrintFiles(prints, signal) {
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
      body: JSON.stringify(record),
      signal
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
        if (signal?.aborted) return;
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

    const controller = new AbortController();
    const { signal } = controller;
    let mergeTimer = null;

    const newFinalPrints = [...finalPrints];

    const settle = (index, item) => {
      if (signal.aborted) return item;
      newFinalPrints[index] = item;
      setFinalPrints([...newFinalPrints]);
      return item;
    };

    const promises = finalPrints.map(async (print, index) => {

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

      return runJob(url + '/job', API_URL + '/jobs', opts, { fallbackUrl: url, signal })
        .then(res => {
          if (!res.Success) {
            throw(res.Message || t("errorPrinting", "Ocorreu um erro ao gerar a planta"));
          }
          return settle(index, {
            ...print,
            processed: true,
            processing: false,
            error: false,
            filename: res.Data.filename,
            url: res.Data.url
          });
        }).catch(error => settle(index, {
          ...print,
          processed: false,
          processing: false,
          error: t("printError", "Não foi possível gerar a planta")
        }));
    });

    Promise.all(promises).then(res => {
      if (signal.aborted) return;

      let hasInvalidPrints = false;
      res.forEach(print => {
        if (print.error) {
          hasInvalidPrints = true;
        }
      });

      if (hasInvalidPrints) {
        notify.warn(printDetails.title || t("printTitle", "Emissão de plantas"),
          t("printAllError", "Não foi possível gerar todas as plantas"));
      }

      setFinalPrints([...res]);
      setIsProcessing(false);
      if (printDetails.merge_prints) {
        mergeTimer = setTimeout(() => mergePrintFiles([...res], signal), 1000);
      }
    });

    return () => {
      controller.abort();
      clearTimeout(mergeTimer);
    };
  }, []);

  return (
    <div className="print-panel4">

      <h3>{printDetails.title}</h3>

      <Alert color="informative" py="xs">
        <Group justify="center" gap="xs" wrap="nowrap">
          <IconInfoCircle />
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
                    <IconXCircle className="print-error" />
                  </div>
                </div>
                <div className="col-9">
                  { print.groupTitle ? print.groupTitle + ' - ' + print.title :  print.title }
                </div>
                <div className="col">
                  <IconExternalLink className="pl-2" />
                </div>
              </div>
            )
          } else {
            if (printDetails.merge_prints) {
              return (
                <div key={print.uuid || index} className="grid">
                  <div className="col-fixed" style={{ width: '30px' }}>
                    <div className="pl-2">
                      { print.processed ? <IconCheck className="print-success" /> : <Loader size="xs" /> }
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
                      { print.processed ? <IconCheck className="print-success" /> : <Loader size="xs" /> }
                    </div>
                  </div>
                  <div className="col-9">
                      { print.groupTitle ? print.groupTitle + ' - ' + print.title :  print.title }
                  </div>
                  <div className="col">
                    { print.processed ?
                      <a href={print.url} target="_blank" title={t("openPrint", "Abrir planta")}
                        style={ { textDecoration: "none", color: "var(--mantine-color-primary-filled)"} } rel="noreferrer">
                        <IconExternalLink className="pl-2" />
                      </a> : null
                    }
                  </div>
                </div>
              )
            }
          }
        }) }
      </div>

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

      <Group justify="space-between" mt="md">
        <Button
            size="xs"
            leftSection={<IconChevronLeft />}
            onClick={e => { goPanelPrintPrev(); }}
        >
          {t("back", "Voltar")}
        </Button>
        { mergedFile ?
          <Button
            component="a"
            href={mergedFile.url}
            target="_blank"
            rel="noreferrer"
            variant="light"
            size="xs"
            leftSection={<IconExternalLink />}
            title={t("openAllPrintsPDF", "Abrir PDF com todas as plantas")}
          >
            {t("openPdf", "Abrir PDF")}
          </Button> : null
        }
      </Group>

    </div>
  )

}
