import React from 'react';
import { useTranslation } from "react-i18next";
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { I18N_NAMESPACE } from './../../i18n/index';
import { uploadVectorFile } from '../upload';


export default function GeoJSON (props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  const loadGeoJSONFile = (e) => uploadVectorFile(props, t, e.files[0], 'geojson', t("errorProcessingGeoJSONFile", "Ocorreu um erro ao processar o ficheiro GeoJSON."))
    .catch(error => props.setError(error.message));

  const changeURL = (value) => {
    props.patchData({ url: value.trim() });
  }

  const loadFromUserURL = () => {
    const { core, data, setSelected, setError, cookies, setLoading, patchData, beginLoad, Models } = props;
    const { isUrlAppOrigin, rememberUrl } = Models.Utils;
    const name = 'GeoJSON';
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
        return res.json();
      })
      .then(res => {
        const dataitems = Models.OWSModel.convertGeoJSON2Themes(res, sourceUrl, name, crs);
        if (!dataitems || !dataitems.length) throw new Error(invalidResponse);
        if (!isCurrent()) return;
        patchData({ dataitems });
        if (cookies) rememberUrl(cookies, 'geojson', sourceUrl);
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
   * Render GeoJSON wizard
   */
  const render = () => {
    const { viewer, loading, data, editField, winSize } = props;
    return (
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