import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { ActionIcon, Group, Tabs, TextInput } from '@mantine/core';
import { FileUpload, notify } from '@scalargis/ui';
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
        
        const orginal_url = core.API_URL + res.Data.url;
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
    const { data, setData } = props;
    data.url = value.trim();
    setData(Object.assign({}, data));
  }

  const loadFromUserURL = () => {
    const { core, data, setData, setSelected, setError, cookies, setLoading, Models, } = props;
    const { isUrlAppOrigin, rememberUrl } = Models.Utils;
    const name = 'KML';
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
              if (cookies) rememberUrl(cookies, 'kml', data.url);              
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
      <div>

          <Tabs defaultValue="file">
            <Tabs.List>
              <Tabs.Tab value="file">{t("file", "Ficheiro")}</Tabs.Tab>
              <Tabs.Tab value="url">URL</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="file" pt="sm">
              <div className="field">
                <label>{t("kmlFormatInfo", "Ficheiro - KML/KMZ")}</label>
                <FileUpload
                  multiple={false}
                  accept={{ 'application/vnd.google-earth.kml+xml': ['.kml'], 'application/vnd.google-earth.kmz': ['.kmz'] }}
                  maxSize={props.maxFileSize * 1024}
                  disabled={loading}
                  chooseLabel={t("choose", "Escolher")}
                  uploadLabel={t("load", "Carregar")}
                  cancelLabel={t("cancel", "Cancelar")}
                  onUpload={async (files) => loadKMLFile({ files })}
                />
                { (props.maxFileSize && props.maxFileSize > 0) ?
                <small id="upload-help" className="p-warn">{t("maxFileSizeInfo", "Dimensão máxima do ficheiro: {{size}} MB",  {size: (Math.round((props.maxFileSize/1024) * 100) / 100)})}</small>
                : null }
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="url" pt="sm">
              <div className="field">
                <label>URL - KML</label>
                <Group className="ads-input-group" gap={0} wrap="nowrap" align="stretch">
                  <TextInput placeholder='https://...'
                    value={data.url}
                    onChange={e => changeURL(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    size="input-sm" variant="filled" type="button"
                    title={t("load", "Carregar")}
                    aria-label={t("load", "Carregar")}
                    loading={loading}
                    onClick={e => {
                      e.preventDefault();
                      loadFromUserURL()
                    }}
                  >
                    <i className="pi pi-search" aria-hidden="true" />
                  </ActionIcon>
                </Group>

              </div>
            </Tabs.Panel>

          </Tabs>

        </div>
    )
  }

  return render();
}