import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { ActionIcon, Group, Tabs, TextInput } from '@mantine/core';
import { FileUpload, notify, IconSearch } from '@scalargis/ui';
import {parseString} from 'xml2js';

import { I18N_NAMESPACE } from './../../i18n/index';
import { uploadVectorFile } from '../upload';


export default function KML(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    const { editField } = props;
    editField('crs', 4326);
  }, []);

  const loadKMLFile = (e) => uploadVectorFile(props, t, e.files[0], 'kml', t("errorProcessingKMLFile", "Ocorreu um erro ao processar o ficheiro KML."));

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
                  onUpload={(files) => loadKMLFile({ files })}
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
                    size="input-md" variant="filled" type="button"
                    title={t("load", "Carregar")}
                    aria-label={t("load", "Carregar")}
                    loading={loading}
                    onClick={e => {
                      e.preventDefault();
                      loadFromUserURL()
                    }}
                  >
                    <IconSearch />
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