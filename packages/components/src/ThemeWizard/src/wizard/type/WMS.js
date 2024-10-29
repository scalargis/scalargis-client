import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { WMSCapabilities } from 'ol/format';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import {InputSwitch} from 'primereact/inputswitch';
import { Accordion, AccordionTab } from 'primereact/accordion';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function WMS(props) {

  const { t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    if (props?.data?.dataType === 'wms' && props?.data?.url) {
      loadWMSCapabilities();
    }
  }, [props?.data?.dataType]);


  /**
   * Event handler for load WMS capabilities
   *
   * @param {Object} e The click handler
   */
  const loadWMSCapabilities = () => {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    let srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    let bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    let options = {
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
      }
    }

    if (!isUrlAppOrigin(turl)) {
      turl = core.MAP_PROXY_URL + encodeURIComponent(turl);
    }

    setLoading(true);
    fetch(turl)
    .then(res => {
      if (!res.ok) throw Error(res.statusText);
      return res;
    })
    .then(res => res.text())
    .then((r) => {
      try {
        const parser = new WMSCapabilities();
        const wms = parser.read(r);
        let dataitems = Models.OWSModel.convertWMS2Themes(wms, data.url, options);
        setData({ ...data, dataType: undefined, dataitems });

        // Add to cookies history
        if (cookies) rememberUrl(cookies, 'wms', data.url);
        setLoading(false);

      } catch (e) {
        setLoading(false);
        setError(''+e);
      }
    }).catch((error) => {
      setData({ ...data, dataType: undefined, dataitems: [] });
      setLoading(false);
      setError(''+error);
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

    let wmsServerTypeOtions = [
      { key: 999, value: '', label: t("notDefined", "Não Especificado") },
      { key: "geoserver", value: "geoserver", label: "Geoserver"},
      { key: "mapserver", value: "mapserver", label: "Mapserver"},
      { key: "qgis", value: "qgis", label: "QGIS"}
    ];

    return (
      <React.Fragment>
        <div className="p-inputgroup">
          <InputText placeholder='https://...'
            value={data.url}
            list='urlhistory'
            onChange={e => editField('url', e.target.value.trim())}
          />
          <Button
            icon={ loading ? "pi pi-spin pi-spinner" : "pi pi-search" }
            tooltip={t("load", "Carregar")} tooltipOptions={{position: 'bottom'}}
            disabled={loading}
            onClick={e => {
              e.preventDefault();
              loadWMSCapabilities()
            }}
          />
        </div>
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>

        <Accordion activeIndex={data?.options?.showAdvancedOptions ? 0 : -1} className="pt-2"
          onTabChange={(e) => {
            const new_options = {
              ...data?.options,
              showAdvancedOptions: e.index === 0 ? true : false
            }
            editField("options", new_options);
          }}>
          <AccordionTab header={t("advancedOptions", "Opções Avançadas")}>

            <div className="p-fluid">

              <div className="field grid">
                <label className="col-12 md:col-4">{t("serverType", "Tipo de servidor")}</label>
                <div className="col-12 md:col-8">
                  <Dropdown placeholder={t("selectServerType", "Escolha o tipo de servidor")}
                    options={wmsServerTypeOtions}
                    value={wmsServerType || ''}
                    onChange={({ value }) => editField('wmsServerType', value)}
                  />
                </div>
              </div> 

              <div className="field grid">
                <label className="col-12 md:col-4">{t("version", "Versão")}</label>
                <div className="col-12 md:col-8">
                  <Dropdown
                    options={versions}
                    value={wmsVersion}
                    onChange={(e) => editField('wmsVersion', e.value)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-7">{t("ignoreServiceUrl", "Ignorar URL do serviço")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
                    checked={wmsIgnoreServiceUrl}
                    onChange={e => editField('wmsIgnoreServiceUrl', !wmsIgnoreServiceUrl)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-7">{t("useTiles", "Usar quadrículas")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
                    checked={wmsTiled}
                    onChange={e => editField('wmsTiled', !wmsTiled)}
                  />
                </div>
              </div>
            </div>

          </AccordionTab>
        </Accordion>

      </React.Fragment>
    )
  }

  return render();

}


