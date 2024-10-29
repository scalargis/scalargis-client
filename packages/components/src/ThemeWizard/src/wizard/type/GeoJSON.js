import React from 'react';
import { useTranslation } from "react-i18next";
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function GeoJSON (props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  /**
   * Event handler for load file
   * 
   * @param {Object} e 
   */
  const loadGeoJSONFile = (e) => {
    const { core, mainMap, viewer, data, setLoading, setData, setError, Models, fastFetch } = props;
    const { isUrlAppOrigin } = Models.Utils;
    const endpoint = viewer.upload_url || core.UPLOAD_URL;
    const name = e.files[0].name;

    const file = e.files[0];
    const upload = new FormData();
    upload.append('files', file);
    upload.append('ext', 'json');

    setLoading(true);
    const options = { method: 'POST', body: upload };
    fastFetch(endpoint, options, 8000)
      .then(res => {
        if (!res || !res.ok) {
          throw new Error(t("invalidResponse", "Não foi possível obter uma resposta válida."));
        } else {
          return res.json();
        }        
      })
      .then(res => {
        // Validate response
        if (!res.Success) {
          setError(t("errorProcessingGeoJSONFile", "Ocorreu um erro ao processar o ficheiro GeoJSON."));
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

  const changeURL = (value) => {
    let { data, setData } = props;
    data.url = value.trim();
    setData(Object.assign({}, data));
  }

  const loadFromUserURL = () => {
    let { core, data, setData, setSelected, setError, cookies, setLoading, Models } = props;
    let { isUrlAppOrigin } = Models.Utils;
    let name = 'GeoJSON';
    let url = data.url || '';

    if (!url.trim()) return;

    if (!isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    };
    setLoading(true);
    fetch(url)
      .then(res => {     
        if (!res.ok) {
          throw new Error(t("invalidResponse", "Não foi possível obter uma resposta válida."));
        } else {
          return res.json();
        }                   
      })
      .then(res => {
        try {
          data.dataitems = Models.OWSModel.convertGeoJSON2Themes(res, data.url, name, data.crs);
          if (data.dataitems && data.dataitems.length > 0) {
            setLoading(false);
            setData(Object.assign({}, data));
            // Add to cookies history
            //if (cookies) rememberUrl(cookies, 'geojson', data.url);
          } else {
            throw Error(t("invalidResponse", "Não foi possível obter uma resposta válida."));
          }
        } catch (e) {
          setLoading(false);
          setError(''+e);
        }          
      })
      // Catch download error
      .catch(error => {
        setData({ ...data, dataitems: [] });
        setSelected({});
        setLoading(false);
        setError(''+error);
      });
  }

  /**
   * Render GeoJSON wizard
   */
  const render = () => {
    const { viewer, loading, data, editField, winSize } = props;
    return (
      <React.Fragment>
        <div className="p-fluid">

          <div className="field">
            <label>{t("coordinateSystem", "Sistema de Coordenadas")}</label>
            <Dropdown 
              placeholder={t("selectCoordinateSystem", "Escolha o sistema de coordenadas")}
              options={viewer.config_json.crs_list.map(c => ({value: String(c.srid), label: c.title }))}
              value={data.crs || '4326'}
              onChange={(e) => editField('crs', e.value)}
            />
          </div>

          <TabView>
            <TabPanel header={t("file", "Ficheiro")}>
              <div className="field">
                <label>{t("file", "Ficheiro")} GeoJSON</label>
                <FileUpload 
                  name="upload"
                  accept="application/json,.geojson"
                  maxFileSize={props.maxFileSize * 1024}
                  customUpload 
                  uploadHandler={loadGeoJSONFile}
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
                <label>URL</label>
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