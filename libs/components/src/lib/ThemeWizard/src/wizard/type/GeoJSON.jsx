import React from 'react';
import { useTranslation } from "react-i18next";
import { ActionIcon, Group, Select, Tabs, TextInput } from '@mantine/core';
import { FileUpload, notify, IconSearch } from '@scalargis/ui';

import { I18N_NAMESPACE } from './../../i18n/index';
import { uploadVectorFile } from '../upload';


export default function GeoJSON (props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  const loadGeoJSONFile = (e) => uploadVectorFile(props, t, e.files[0], 'geojson', t("errorProcessingGeoJSONFile", "Ocorreu um erro ao processar o ficheiro GeoJSON."));

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
            <Select
              placeholder={t("selectCoordinateSystem", "Escolha o sistema de coordenadas")}
              data={viewer.config_json.crs_list.map(c => ({value: String(c.srid), label: c.title }))}
              value={String(data.crs || '4326')}
              onChange={(value) => editField('crs', value)}
            />
          </div>

          <Tabs defaultValue="file">
            <Tabs.List>
              <Tabs.Tab value="file">{t("file", "Ficheiro")}</Tabs.Tab>
              <Tabs.Tab value="url">URL</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="file" pt="sm">
              <div className="field">
                <label>{t("file", "Ficheiro")} GeoJSON</label>
                <FileUpload
                  multiple={false}
                  accept={{ 'application/json': ['.json', '.geojson'], 'application/geo+json': ['.geojson'] }}
                  maxSize={props.maxFileSize * 1024}
                  disabled={loading}
                  chooseLabel={t("choose", "Escolher")}
                  uploadLabel={t("load", "Carregar")}
                  cancelLabel={t("cancel", "Cancelar")}
                  onUpload={(files) => loadGeoJSONFile({ files })}
                />
                { (props.maxFileSize && props.maxFileSize > 0) ?
                <small id="upload-help" className="p-warn">{t("maxFileSizeInfo", "Dimensão máxima do ficheiro: {{size}} MB",  {size: (Math.round((props.maxFileSize/1024) * 100) / 100)})}</small>
                : null }
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="url" pt="sm">
              <div className="field">
                <label>URL</label>
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