import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import xml2js from 'xml2js';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import {InputSwitch} from 'primereact/inputswitch';
import { Accordion, AccordionTab } from 'primereact/accordion';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function WFS(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    if (props?.data?.dataType === 'wfs' && props?.data?.url) {
      loadWFSCapabilities();
    }
  }, [props?.data?.dataType]);


  /**
   * Event handler for load WFS Capabilities
   */
  const loadWFSCapabilities = () => {
    const { core, auth, mainMap, viewer, data, setLoading, setData, setError, cookies, Models } = props;
    const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
    if (!data.url) return;

    const srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    const bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    const options = {
      srid: srid,
      bbox: bbox,
      servertype: data.wfsServerType,
      ignore_url: data.wfsIgnoreServiceUrl,
      version: data.wfsVersion,
      data_crs: data.wfsDataCRS
    }
    
    let turl = data.url;
    turl = removeUrlParam(turl, 'request')
    turl = removeUrlParam(turl, 'service')
    turl = removeUrlParam(turl, 'version')
    turl = turl + (turl.indexOf('?') > -1 ? '' : '?')
    turl = turl + '&SERVICE=WFS&REQUEST=GetCapabilities';
    if (data.wfsVersion && data.wfsVersion !== 'default') {
      turl = turl + '&VERSION=' + data.wfsVersion;
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
    };

    setLoading(true);

    fetch(turl)
    .then(res => {
      if (!res.ok) throw Error(res.statusText);
      return res;
    })
    .then(res => res.text())
    .then((r) => {
      xml2js.parseString(r, (err, capabilities) => {
        if (err) {
          console.error(err);
          setError(''+err);
          setLoading(false);
          return;
        }
        const dataitems = Models.OWSModel.convertWFS2Themes(capabilities, data.url, options);
        setData({ ...data, dataType: undefined, dataitems });

        // Add to cookies history
        if (cookies) rememberUrl(cookies, 'wfs', data.url);
        setLoading(false);

      });
    }).catch((error) => {
      setData({ ...data, dataType: undefined, dataitems: [] });
      setError(''+error);
      setLoading(false);
    });
  }

  /**
   * Render WFS wizard
   */
  const render = () => {
    const { loading, data, editField, getUrlHistory } = props;
    const { wfsServerType, wfsIgnoreServiceUrl, wfsVersion, wfsDataCRS } = data;

    const versions = [
      { key: 'default', value: 'default', label: t("specifiedByService", "Especificada pelo Serviço") },
      { key: '1.0.0', value: '1.0.0', label: '1.0.0' },
      /*{ key: '1.1.0', value: '1.1.0', label: '1.1.0' },*/
      { key: '2.0.0', value: '2.0.0', label: '2.0.0' }
    ];

    const wfsServerTypeOtions = [
      { key: 999, value: '', label: t("notDefined", "Não Especificado") },
      { key: "arcgisserver", value: "arcgisserver", label: "ArcGIS Server"}
    ];

    const wfsDataCRSOptions = [
      { key: 0, value: 0, label: t("specifiedByService", "Especificado pelo Serviço") },
      { key: 4326, value: 4326, label: 'EPSG:4326' },
      { key: 3857, value: 3857, label: 'EPSG:3857' }
    ]

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
            title={t("load", "Carregar")} tooltipOptions={{position: 'bottom'}}
            disabled={loading}
            onClick={e => {
              e.preventDefault();
              loadWFSCapabilities()
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
                    options={wfsServerTypeOtions}
                    value={wfsServerType || ''}
                    onChange={({ value }) => editField('wfsServerType', value)}
                  />
                </div>
              </div> 

              <div className="field grid">
                <label className="col-12 md:col-4">{t("version", "Versão")}</label>
                <div className="col-12 md:col-8">
                  <Dropdown
                    options={versions}
                    value={wfsVersion}
                    onChange={(e) => editField('wfsVersion', e.value)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-7">{t("ignoreServiceUrl", "Ignorar URL do serviço")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
                    checked={wfsIgnoreServiceUrl}
                    onChange={e => editField('wfsIgnoreServiceUrl', !wfsIgnoreServiceUrl)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-4">{t("wfsDataCRS", "Sistema de Coordenadas dos Dados")}</label>
                <div className="col-12 md:col-8">
                  <Dropdown
                    options={wfsDataCRSOptions}
                    value={wfsDataCRS || 0}
                    onChange={(e) => editField('wfsDataCRS', e.value)}
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