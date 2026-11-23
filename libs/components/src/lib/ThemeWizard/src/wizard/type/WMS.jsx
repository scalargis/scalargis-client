import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { WMSCapabilities } from 'ol/format';
import { Accordion, ActionIcon, Group, Select, Switch, TextInput } from '@mantine/core';
import { IconSearch } from '@scalargis/ui';

import { ItemCard } from './../ItemCard';
import { findItemById } from './../itemTree';
import { I18N_NAMESPACE } from './../../i18n/index';


/** True when a WMS title reads as a code, so the layer name goes next to it. */
function isCodeTitle(title, name) {
  if (!title || title === name) return true;
  return !/\s/.test(title) && /[_:]/.test(title);
}

/** Builds the legend URL of a WMS item: its LegendURL, else a GetLegendGraphic request. */
function legendUrlOf(item) {
  if (item.legend_url) return item.legend_url;
  if (!item.url || !item.layers) return '';
  const sep = !item.url.includes('?') ? '?' : (/[?&]$/.test(item.url) ? '' : '&');
  const style = item.wms_style ? '&STYLE=' + encodeURIComponent(item.wms_style) : '';
  return item.url + sep + 'SERVICE=WMS&VERSION=1.3.0&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&LAYER=' +
    encodeURIComponent(item.layers) + style;
}


export default function WMS(props) {

  const { t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    if (props?.data?.dataType === 'wms' && props?.data?.url) {
      loadWMSCapabilities();
    }
  }, [props?.data?.dataType]);

  const { setItemRenderer } = props;
  const dataitems = props?.data?.dataitems;
  const proxyUrl = props.core?.MAP_PROXY_URL;
  const isUrlAppOrigin = props.Models?.Utils?.isUrlAppOrigin;

  useEffect(() => {
    if (!setItemRenderer) return;
    const pageIsHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    const viewable = (url) => {
      if (!url || !pageIsHttps || !/^http:/i.test(url) || !proxyUrl || isUrlAppOrigin?.(url)) return url;
      return proxyUrl + encodeURIComponent(url);
    };

    setItemRenderer((itemData) => {
      const item = findItemById(dataitems || [], itemData?.id);
      if (!item) return <span>{itemData?.content}</span>;

      const name = item.layers || '';
      const title = item.title || name;
      const subtitle = name && name !== title && isCodeTitle(item.title, name) ? name : null;
      const isGroup = !!item.children?.length;

      return (
        <ItemCard
          title={title}
          subtitle={subtitle}
          description={item.description}
          legendUrl={isGroup ? null : viewable(legendUrlOf(item))}
        />
      );
    });
  }, [dataitems, setItemRenderer, proxyUrl, isUrlAppOrigin]);


  /**
   * Event handler for load WMS capabilities
   *
   * @param {Object} e The click handler
   */
  const loadWMSCapabilities = () => {
    const { core, auth, mainMap, viewer, data, setLoading, patchData, beginLoad, setError, Models } = props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    const srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    const bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    const options = {
      srid: srid,
      bbox: bbox,
      servertype: data.wmsServerType,
      ignore_url: data.wmsIgnoreServiceUrl,
      version: data.wmsVersion,
      tiled: data.wmsTiled
    }
    let turl = data.url;
    turl = removeUrlParam(turl, 'request')
    turl = removeUrlParam(turl, 'service')
    turl = removeUrlParam(turl, 'version')
    turl = turl + (turl.indexOf('?') > -1 ? '' : '?')
    turl = turl + '&SERVICE=WMS&REQUEST=GetCapabilities';
    if (data.wmsVersion && data.wmsVersion !== 'default') {
      turl = turl + '&VERSION=' + data.wmsVersion;
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
    }

    const sourceUrl = data.url;
    const isCurrent = beginLoad();
    setLoading(true);
    fetch(turl)
      .then(res => {
        if (!res.ok) throw Error(res.statusText);
        return res.text();
      })
      .then((r) => {
        const parser = new WMSCapabilities();
        const wms = parser.read(r);
        const dataitems = Models.OWSModel.convertWMS2Themes(wms, sourceUrl, options);
        if (!isCurrent()) return;
        patchData({ dataType: undefined, dataitems });
        rememberUrl('wms', sourceUrl, options.authToken);
      }).catch((error) => {
        if (!isCurrent()) return;
        patchData({ dataType: undefined, dataitems: [] });
        setError(''+error);
      }).finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }


  /**
   * Render WMS wizard
   */
  const render = () => {
    const { loading, data, editField, getUrlHistory } = props;
    const { wmsServerType, wmsIgnoreServiceUrl, wmsVersion, wmsTiled } = data;

    const versions = [
      { key: 'default', value: 'default', label: t("specifiedByService", "Especificada pelo Serviço") },
      { key: '1.1.0', value: '1.1.0', label: '1.1.0' },
      { key: '1.1.1', value: '1.1.1', label: '1.1.1' },
      { key: '1.3.0', value: '1.3.0', label: '1.3.0' }
    ];

    const wmsServerTypeOtions = [
      { key: 999, value: '', label: t("notDefined", "Não Especificado") },
      { key: "geoserver", value: "geoserver", label: "Geoserver"},
      { key: "mapserver", value: "mapserver", label: "Mapserver"},
      { key: "qgis", value: "qgis", label: "QGIS"}
    ];

    return (
      <React.Fragment>
        <Group className="ads-input-group" gap={0} wrap="nowrap" align="stretch">
          <TextInput placeholder='https://...'
            value={data.url}
            list={`urlhistory-${data.type}`}
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
              loadWMSCapabilities()
            }}
          >
            <IconSearch />
          </ActionIcon>
        </Group>
        <datalist id={`urlhistory-${data.type}`}>
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

              {/* Label stacked above the control so "Não Especificado" gets the
                  full panel width and stops truncating in the ~288px panel (C-09). */}
              <div className="field grid">
                <label className="col-12">{t("serverType", "Tipo de servidor")}</label>
                <div className="col-12">
                  <Select placeholder={t("selectServerType", "Escolha o tipo de servidor")}
                    data={wmsServerTypeOtions.map(o => ({ value: o.value, label: o.label }))}
                    value={wmsServerType || ''}
                    onChange={(value) => editField('wmsServerType', value)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-4">{t("version", "Versão")}</label>
                <div className="col-12 md:col-8">
                  <Select
                    data={versions.map(o => ({ value: o.value, label: o.label }))}
                    value={wmsVersion}
                    onChange={(value) => editField('wmsVersion', value)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-7">{t("ignoreServiceUrl", "Ignorar URL do serviço")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <Switch
                    size="md"
                    style={{ display: 'inline-block' }}
                    checked={wmsIgnoreServiceUrl}
                    onChange={e => editField('wmsIgnoreServiceUrl', !wmsIgnoreServiceUrl)}
                  />
                </div>
              </div>

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


