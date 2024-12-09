import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { FileUpload } from 'primereact/fileupload';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import {parseString} from 'xml2js';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function KML(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    const { editField } = props;
    editField('crs', 4326);
  }, []);

  const loadKMLData = (file, name) => {
    const { core, mainMap, viewer, data, setLoading, setData, setError, Models, fastFetch } = props;
    const { isUrlAppOrigin } = Models.Utils;
    const endpoint = viewer.upload_url || core.UPLOAD_URL;
    
    const upload = new FormData();
    upload.append('files', file);
    upload.append('ext', 'kml');

    setLoading(true);
    const options = { method: 'POST', body: upload };
    fastFetch(endpoint, options, 8000)
      .then(res => res.json())
      .then(res => {

        // Validate response
        if (!res.Success) {
          setError(t("errorProcessingKMLFile", "Ocorreu um erro ao processar o ficheiro KML."));
          return setLoading(false);
        }
        
        let orginal_url = core.API_URL + res.Data.url;
        let url = orginal_url;
        if (!isUrlAppOrigin(url)) {
          url = core.MAP_PROXY_URL + encodeURIComponent(url);
        };        
        fetch(url)
          .then(res => res.json())
          .then(res => {
            data.dataitems = Models.OWSModel.convertGeoJSON2Themes(res, orginal_url, name, data.crs);
            setData(Object.assign({}, data));
            setLoading(false);
        })

        // Catch download error
        .catch(error => {
          setLoading(false);
          setError(''+error);
        });
      })
      
      // Catch upload error
      .catch(error => {
        setLoading(false);
        setError(''+error);
      });
  }

  /**
   * Event handler for load file
   * 
   * @param {Object} e 
   */
  const loadKMLFile = (e) => {
    const name = e.files[0].name;
    const file = e.files[0];
    loadKMLData(file, name);
  }

  const changeURL = (value) => {
    let { data, setData } = props;
    data.url = value.trim();
    setData(Object.assign({}, data));
  }

  const loadFromUserURL = () => {
    let { core, data, setData, setSelected, setError, cookies, setLoading, Models, } = props;
    let { isUrlAppOrigin } = Models.Utils;
    let name = 'KML';
    let url = data.url || '';

    if (!url.trim()) return;

    if (!isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    };
    setLoading(true);

    fetch(url)
      .then(res => res.text())
      .then(res => {
        try {
          parseString(res, function (err, kml) { 
            data.dataitems = Models.OWSModel.convertKML2Themes(kml, data.url, res, data.crs);
            if (data.dataitems && data.dataitems.length > 0) {
              setLoading(false);
              setData(Object.assign({}, data));
              // Add to cookies history
              //if (cookies) rememberUrl(cookies, 'geojson', data.url);              
            } else {
              throw Error(t("invalidResponse", "Não foi possível obter uma resposta válida."));
            }
          });
        } catch (e) {
          setLoading(false);
          setError(''+e);
        }          
      })
      .catch(error => {
        setData({ ...data, dataitems: [] });
        setSelected({});
        setLoading(false);
        setError(''+error);
      })
  }

  /**
   * Render KML wizard
   */
  const render = () => {
    const { viewer, loading, data } = props;
    return (
      <React.Fragment>
        <div className="p-fluid">

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
                    tooltip={t("load", "Carregar")} tooltipOptions={{position: 'bottom'}}
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

      </React.Fragment>
    )
  }

  return render();
}