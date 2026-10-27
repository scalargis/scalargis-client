import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { WMTSCapabilities } from 'ol/format';
import { Accordion, ActionIcon, Group, Select, Switch, TextInput } from '@mantine/core';
import { IconSearch } from '@scalargis/ui';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function WMTS(props) {

  const { t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    if (props?.data?.dataType === 'wmts' && props?.data?.url) {
      loadWMTSCapabilities();
    }
  }, [props?.data?.dataType]);


  /**
   * Event handler for load WMTS capabilities
   *
   * @param {Object} e The click handler
   */
  const loadWMTSCapabilities = () => {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    const srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    const bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    const options = {
      srid: srid,
      bbox: bbox,
      ignore_url: data.wmtsIgnoreServiceUrl,
      version: data.wmtsVersion
    }
    let turl = data.url;
    turl = removeUrlParam(turl, 'request')
    turl = removeUrlParam(turl, 'service')
    turl = removeUrlParam(turl, 'version')
    turl = turl + (turl.indexOf('?') > -1 ? '' : '?')
    turl = turl + '&SERVICE=WMTS&REQUEST=GetCapabilities';
    if (data.wmtsVersion && data.wmtsVersion !== 'default') {
      turl = turl + '&VERSION=' + data.wmtsVersion;
    }

    //Add user authentication token
    if (isUrlAppHostname(turl) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        turl = turl + '&' + authkey + '=' + auth.data.auth_token;
        options.authToken = { param: authkey, token: auth.data.auth_token };
      }
    }

    if (!isUrlAppOrigin(turl)) {
      turl = core.MAP_PROXY_URL + encodeURIComponent(turl);
    };

    setLoading(true);
    fetch(turl)
    .then(res => {
      if (!res.ok) throw Error(res.statusText);
      return res;
    })
    .then(res => res.text())
    .then((r) => {
      try {
        const parser = new WMTSCapabilities();
        const wmts = parser.read(r);
        const dataitems = Models.OWSModel.convertWMTS2Themes(wmts, data.url, options);
        data.wmtsTileMatrixSet = [];
        if (wmts.Contents && wmts.Contents.TileMatrixSet) {
          data.wmtsTileMatrixSet = wmts.Contents.TileMatrixSet.map(m => ({ Identifier: m.Identifier, SupportedCRS: m.SupportedCRS }));
        }
        setData({ ...data, dataType: undefined, dataitems });

        // Add to cookies history
        if (cookies) rememberUrl(cookies, 'wmts', data.url);
        setLoading(false);

      } catch (e) {
        setError(''+e);
        setLoading(false);
      }
    }).catch((error) => {
      setData({ ...data, dataType: undefined, dataitems: [] });
      setError(''+error);
      setLoading(false);
    });
  }


  /**
   * Render WMTS wizard
   */
  const render = () => {
    const { loading, data, editField, getUrlHistory } = props;
    const { wmtsIgnoreServiceUrl, wmtsVersion } = data;

    const versions = [
      { key: 'default', value: 'default', label: t("specifiedByService", "Especificada pelo Serviço") },
      { key: '1.0.0', value: '1.0.0', label: '1.0.0' }
    ];
    
    return (
      <React.Fragment>
        <Group className="ads-input-group" gap={0} wrap="nowrap" align="stretch">
          <TextInput placeholder='https://...'
            value={data.url}
            list='urlhistory'
            style={{ flex: 1 }}
            onChange={e => editField('url', e.target.value.trim())}
          />
          <ActionIcon
            size="input-md" variant="filled" type="button"
            title={t("load", "Carregar")}
            aria-label={t("load", "Carregar")}
            loading={loading}
            onClick={e => {
              e.preventDefault();
              loadWMTSCapabilities()
            }}
          >
            <IconSearch />
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
                <label className="col-12 md:col-7">{t("version", "Versão")}</label>
                <div className="col-12 md:col-5">
                  <Select
                    data={versions.map(o => ({ value: o.value, label: o.label }))}
                    value={wmtsVersion}
                    onChange={(value) => editField('wmtsVersion', value)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-7">{t("ignoreServiceUrl", "Ignorar URL do serviço")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <Switch
                    size="md"
                    style={{ display: 'inline-block' }}
                    checked={wmtsIgnoreServiceUrl}
                    onChange={e => editField('wmtsIgnoreServiceUrl', !wmtsIgnoreServiceUrl)}
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


