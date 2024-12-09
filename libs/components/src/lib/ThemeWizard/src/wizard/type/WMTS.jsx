import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { WMTSCapabilities } from 'ol/format';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import {InputSwitch} from 'primereact/inputswitch';
import { Accordion, AccordionTab } from 'primereact/accordion';

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

    let srid = Models.MapModel.getProjectionSrid(mainMap.getView().getProjection());
    let bbox = viewer.config_json.full_extent || viewer.config_json.restricted_extent || mainMap.getView().calculateExtent();

    let options = {
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
        let dataitems = Models.OWSModel.convertWMTS2Themes(wmts, data.url, options);
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
              loadWMTSCapabilities()
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
                <label className="col-12 md:col-7">{t("version", "Versão")}</label>
                <div className="col-12 md:col-5">
                  <Dropdown
                    options={versions}
                    value={wmtsVersion}
                    onChange={(e) => editField('wmtsVersion', e.value)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-7">{t("ignoreServiceUrl", "Ignorar URL do serviço")}</label>
                <div className="col-12 md:col-5" style={{ textAlign: 'right' }}>
                  <InputSwitch
                    checked={wmtsIgnoreServiceUrl}
                    onChange={e => editField('wmtsIgnoreServiceUrl', !wmtsIgnoreServiceUrl)}
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


