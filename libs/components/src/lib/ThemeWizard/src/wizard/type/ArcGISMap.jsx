import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Accordion, ActionIcon, Group, Switch, TextInput } from '@mantine/core';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function ArcGISMap(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    if (props?.data?.dataType === 'arcgismap' && props?.data?.url) {
      loadArcGISMapCapabilities();
    }
  }, [props?.data?.dataType]);


  /**
   * Event handler for load ArcGIS Map Service capabilities
   */
  const loadArcGISMapCapabilities = () => {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    const srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    const bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    const options = {
      srid: srid,
      bbox: bbox,
      tiled: data.wmsTiled
    }
    let murl = `${data.url}?f=json`;
    let lurl = `${data.url}/layers?f=json`;

    if (!isUrlAppOrigin(data.url)) {
      murl = core.MAP_PROXY_URL + encodeURIComponent(murl);
      lurl = core.MAP_PROXY_URL + encodeURIComponent(lurl);
    }

    setLoading(true);

    Promise.all([
      fetch(murl).catch((error) => error),
      fetch(lurl).catch((error) => error)
    ]).then(async(result) => {
      const capabilities = {
        service: null,
        layers: null
      }
      if (result[0].ok) capabilities['service'] = await result[0].json();
      if (result[1].ok) {
        const layers_data = await result[1].json();
        capabilities.layers = layers_data?.layers ? layers_data?.layers : null;
      }
      return capabilities;
    }).then((capabilities) => {
      const dataitems = Models.OWSModel.convertArcGISMap2Themes(capabilities, data.url, options);
      setData({ ...data, dataitems });        

      // Add to cookies history
      if (cookies) rememberUrl(cookies, 'arcgismap', data.url);
      setLoading(false);
    }).catch((error) => {
      setData({ ...data, dataitems: [] });
      setLoading(false);
      setError(''+error);
    });
  }

  /**
   * Render ArcGISMap wizard
   */
  const render = () => {
    const { loading, data, editField, getUrlHistory } = props;
    const { wmsTiled } = data;
    return (
      <React.Fragment>
        <Group gap={0} wrap="nowrap" align="stretch">
          <TextInput placeholder='https://...'
            value={data.url}
            list='urlhistory'
            style={{ flex: 1 }}
            onChange={e => editField('url', e.target.value.trim())}
          />
          <ActionIcon
            size="input-sm" variant="filled" type="button"
            title={t("load", "Carregar")}
            aria-label={t("load", "Carregar")}
            loading={loading}
            onClick={e => {
              e.preventDefault();
              loadArcGISMapCapabilities();
            }}
          >
            <i className="pi pi-search" aria-hidden="true" />
          </ActionIcon>
        </Group>
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>

        <Accordion className="pt-2"
          value={data?.options?.showAdvancedOptions ? 'advanced' : null}
          onChange={(value) => {
            const new_options = {
              ...data?.options,
              showAdvancedOptions: value === 'advanced'
            }
            editField("options", new_options);
          }}>
          <Accordion.Item value="advanced">
            <Accordion.Control>{t("advancedOptions", "Opções Avançadas")}</Accordion.Control>
            <Accordion.Panel>
            <div className="p-fluid">
              <div className="field grid">
                <label className="col-12 md:col-7">{t("useTiles", "Usar quadrículas")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <Switch
                    size="md"
                    style={{ display: 'inline-block' }}
                    checked={wmsTiled}
                    onChange={e => editField('wmsTiled', !wmsTiled)}
                  />
                </div>
              </div>
            </div>

            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

      </React.Fragment>
    )
  }

  return render();

}