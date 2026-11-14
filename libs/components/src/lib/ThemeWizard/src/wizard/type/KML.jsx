import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { FileUpload } from 'primereact/fileupload';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import {parseString} from 'xml2js';

import { I18N_NAMESPACE } from './../../i18n/index';
import { uploadVectorFile } from '../upload';


export default function KML(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    const { editField } = props;
    editField('crs', 4326);
  }, []);

  const loadKMLFile = (e) => uploadVectorFile(props, t, e.files[0], 'kml', t("errorProcessingKMLFile", "Ocorreu um erro ao processar o ficheiro KML."))
    .catch(error => props.setError(error.message));

  const changeURL = (value) => {
    props.patchData({ url: value.trim() });
  }

  const loadFromUserURL = () => {
    const { core, data, setSelected, setError, cookies, setLoading, patchData, beginLoad, Models } = props;
    const { isUrlAppOrigin, rememberUrl } = Models.Utils;
    const sourceUrl = data.url || '';
    const crs = data.crs;
    const invalidResponse = t("invalidResponse", "Não foi possível obter uma resposta válida.");

    if (!sourceUrl.trim()) return;

    const url = isUrlAppOrigin(sourceUrl) ? sourceUrl : core.MAP_PROXY_URL + encodeURIComponent(sourceUrl);
    const isCurrent = beginLoad();
    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(invalidResponse);
        return res.text();
      })
      .then(text => new Promise((resolve, reject) => {
        parseString(text, (err, kml) => {
          if (err) return reject(err);
          const dataitems = Models.OWSModel.convertKML2Themes(kml, sourceUrl, text, crs);
          if (!dataitems || !dataitems.length) return reject(new Error(invalidResponse));
          resolve(dataitems);
        });
      }))
      .then(dataitems => {
        if (!isCurrent()) return;
        patchData({ dataitems });
        if (cookies) rememberUrl(cookies, 'kml', sourceUrl);
      })
      .catch(error => {
        if (!isCurrent()) return;
        patchData({ dataitems: [] });
        setSelected({});
        setError(''+error);
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }

  /**
   * Render KML wizard
   */
  const render = () => {
    const { viewer, loading, data } = props;
    return (
      <div>

          <TabView>
            <TabPanel header={t("file", "Ficheiro")}>
              <div className="field">
                <label>{t("kmlFormatInfo", "Ficheiro - KML/KMZ")}</label>
                <FileUpload 
                  name="upload"
                  accept=".kml,.kmz"
                  maxFileSize={props.maxFileSize * 1024}
                  customUpload 
                  uploadHandler={loadKMLFile}
                  disabled={loading}
                  url="./upload"
                  chooseLabel={t("choose", "Escolher")}
                  uploadLabel={t("load", "Carregar")}
                  cancelLabel={t("cancel", "Cancelar")} 
                  invalidFileSizeMessageDetail=""
                  invalidFileSizeMessageSummary={t("maxFileSizeError", "O ficheiro não pode ter mais de {{size}} MB", {size: (Math.round((props.maxFileSize/1024) * 100) / 100)})}
                />
                { (props.maxFileSize && props.maxFileSize > 0) ?
                <small id="upload-help" className="p-warn">{t("maxFileSizeInfo", "Dimensão máxima do ficheiro: {{size}} MB",  {size: (Math.round((props.maxFileSize/1024) * 100) / 100)})}</small>
                : null }                
              </div>
            </TabPanel>
            <TabPanel header="URL">
              <div className="field">
                <label>URL - KML</label>
                <div className="p-inputgroup">
                  <InputText placeholder='https://...'
                    value={data.url}
                    onChange={e => changeURL(e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <Button
                    icon={ loading ? "pi pi-spin pi-spinner" : "pi pi-search" }
                    title={t("load", "Carregar")} tooltipOptions={{position: 'bottom'}}
                    disabled={loading}
                    onClick={e => {
                      e.preventDefault();
                      loadFromUserURL()
                    }}
                  />
                </div>
                
              </div>
            </TabPanel>

          </TabView>

        </div>
    )
  }

  return render();
}