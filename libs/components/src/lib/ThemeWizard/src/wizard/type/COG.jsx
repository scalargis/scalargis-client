import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";

import * as GeoTIFFLib from "geotiff";

import { Accordion, ActionIcon, Fieldset, Group, NumberInput, Select, Switch, TextInput } from '@mantine/core';
import { IconSearch } from '@scalargis/ui';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function COG(props) {

  const { core, auth, mainMap, viewer, data, loading, setLoading, setData, setError, editField, cookies, Models } = props;
  const { isUrlAppOrigin, isUrlAppHostname, rememberUrl, removeUrlParam } = Models.Utils;
  const { hasProjection, addProjections } = Models.MapModel;
  const { getCOGImageProjCode } = Models.OWSModel;

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  const bandOptions = useMemo(() => {
    if (!data?.options?.image_bands) {
      return [1, 2, 3];
    }
    return Array.from({length: data.options.image_bands}, (_, index) => (index + 1));
  }, [data?.options?.image_bands]);

  /**
   * Event handler for load COG
   *
   * @param {Object} e The click handler
   */
  const loadCOGMetadata = () => {

    if (!data.url) return;

    let url = data.url;

    //Add user authentication token
    if (isUrlAppHostname(url) && viewer.integrated_authentication) {
      if (auth && auth.data && auth.data.auth_token) {
        const authkey = viewer?.integrated_authentication_key || 'authkey';
        if (url.indexOf('?') !== -1) {
          url = url + '&' + authkey + '=' + auth.data.auth_token;
        } else {
          url = url + '?' + authkey + '=' + auth.data.auth_token;
        }
      }
    }

    setLoading(true);

    let proxyRequests = false;

    GeoTIFFLib.fromUrl(url)
    .catch(error => {
      if (isUrlAppOrigin(url)) throw new error();

      proxyRequests = true;

      const surl = core.MAP_PROXY_URL + encodeURIComponent(url);
      return GeoTIFFLib.fromUrl(surl);
    })
    .then(tiff => {
      return tiff.getImage();
    })
    .then(async image => {
      const code = getCOGImageProjCode(image);
      const epsg = `EPSG:${code}`;

      if (!hasProjection(epsg)) {
        //throw new Error(`Unsupported coordinate reference system (EPSG:${code})`);
        try {
          const response = await fetch(`https://epsg.io/${code}.proj4`);
          const projText = await response.text();

          const newProj = {
            "srid": code,
            "code": epsg,
            "title": image?.geoKeys?.GTCitationGeoKey || epsg,
            "defs": projText,
            "extent": "-180 -90 180 90",
            "description": image?.geoKeys?.GTCitationGeoKey || t("cogCoordinateSystemInfo", "Dinamically loaded by COG image ({{epsg}})", {epsg})
          }
          addProjections([newProj]);
        } catch (error) {
          throw new Error(t("cogCoordinateSystemUnsupported", "Could not load unsupported coordinate reference system ({{epsg}})", {epsg}));
        }
      }
      return image;
    }).then(image => {
      const number_bands = image.getSamplesPerPixel();
      const available_bands = Array.from({length: number_bands}, (_, index) => (index + 1));
      const options = {
        image_bands: number_bands,
        bands: number_bands >= 3 ? [1, 2, 3] : available_bands
      }

      // Extract filename from url path
      const baseUrl = data.url.indexOf('?') === -1 ? data.url : data.url.slice(0, data.url.indexOf('?'));
      const [...parts] = baseUrl.split('/');
      const filename = parts.pop();

      const dataitems = Models.OWSModel.convertCOG2Themes(image, data.url, filename, proxyRequests, options);
      setData({ ...data, options, dataitems });

      // Add to cookies history
      if (cookies) rememberUrl(cookies, 'cog', data.url);
      
    }).catch((error) => {
      console.log(error);
      setData({ ...data, dataitems: [] });
      setLoading(false);
      setError('' + error);
    }).finally(()=>{
      setLoading(false);
    });
  }

  const onChangeBand = (index, value) => {
    const bands = [...selectedBands];
    bands[index] = value;

    const new_options = {
      ...data?.options,
      bands: bands
    }
    editField("options", new_options);

    if (data?.dataitems?.length) {
      let item = data.dataitems[0];
      item = {
        ...item,
        options: {
          ...item.options,
          bands: bands
        }
      }

      setData({
        ...data,
        dataitems: [item]
      });
    }
  }

  const onChangeConvertToRGB = (value) => {
    const new_options = {
      ...data?.options,
      convertToRGB: value
    }
    editField("options", new_options);

    if (data?.dataitems?.length) {
      let item = data.dataitems[0];
      item = {
        ...item,
        options: {
          ...item.options,
          convertToRGB: value
        }
      }
      setData({
        ...data,
        dataitems: [item]
      });
    }
  }

  const onChangeNoData = (value) => {
    const new_options = {
      ...data?.options,
      nodata: value
    }
    editField("options", new_options);

    if (data?.dataitems?.length) {
      let item = data.dataitems[0];
      item = {
        ...item,
        options: {
          ...item.options,
          nodata: value
        }
      }
      setData({
        ...data,
        dataitems: [item]
      });
    }
  }

  let selectedBands = [1, 2, 3];
  let convertToRGB;
  let nodata;
  if (data?.dataitems?.length) {
    if (data?.dataitems[0].options?.bands?.length) {
      selectedBands = data.dataitems[0].options.bands;
    } else if (data?.options?.bands?.length) {
      selectedBands = data.options.bands;
    }
    convertToRGB = data.dataitems[0]?.options?.convertToRGB != null ? data.dataitems[0].options.convertToRGB : false;
    nodata = data.dataitems[0]?.options?.nodata != null ? data.dataitems[0].options?.nodata : undefined;
  }


  /**
   * Render COG wizard
   */
  const render = () => {

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
              loadCOGMetadata()
            }}
          >
            <IconSearch />
          </ActionIcon>
        </Group>
        {/*
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>
          */}

        <Accordion className="pt-2">
          <Accordion.Item value="advanced">
            <Accordion.Control>{t("advancedOptions", "Opções Avançadas")}</Accordion.Control>
            <Accordion.Panel>

            <div className="p-fluid">
              <div className="field grid">
                <Fieldset legend={t("bands", "Bandas")} className="col-12">
                  <div className="field grid">
                    <label className="col-12 md:col-4">{t("red", "Vermelho")}</label>
                    <div className="col-12 md:col-8">
                      <Select placeholder={t("selectBands", "Selecione a banda")}
                        data={bandOptions.map(b => String(b))}
                        value={selectedBands[0] != null ? String(selectedBands[0]) : null}
                        onChange={(value) => {
                          onChangeBand(0, Number(value));
                        }}
                      />
                    </div>
                  </div>
                  <div className="field grid">
                    <label className="col-12 md:col-4">{t("green", "Verde")}</label>
                    <div className="col-12 md:col-8">
                      <Select placeholder={t("selectBands", "Selecione a banda")}
                        data={bandOptions.map(b => String(b))}
                        value={selectedBands[1] != null ? String(selectedBands[1]) : null}
                        onChange={(value) => {
                          onChangeBand(1, Number(value));
                        }}
                      />
                    </div>
                  </div>
                  <div className="field grid">
                    <label className="col-12 md:col-4">{t("blue", "Azul")}</label>
                    <div className="col-12 md:col-8">
                      <Select placeholder={t("selectBands", "Selecione a banda")}
                        data={bandOptions.map(b => String(b))}
                        value={selectedBands[2] != null ? String(selectedBands[2]) : null}
                        onChange={(value) => {
                          onChangeBand(2, Number(value));
                        }}
                      />
                    </div>
                  </div>
                </Fieldset>
              </div>
              <div className="field grid">
                <label className="col-12 md:col-6">{t("convertToRGB", "Converter para RGB")}</label>
                <Switch size="md" style={{ display: 'inline-block' }} checked={convertToRGB || false} onChange={(e) => {
                  onChangeConvertToRGB(e.currentTarget.checked);
                }} />
              </div>

              <div className="field grid">
                <label className="col-12 md:col-4">{t("nodataValue", "Valor NoData")}</label>
                <div className="col-12 md:col-8">
                  <NumberInput hideControls value={nodata != null ? nodata : ''} onChange={(value) => {
                    onChangeNoData(typeof value === 'number' ? value : (value === '' || value == null ? null : Number(value)));
                  }} />
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