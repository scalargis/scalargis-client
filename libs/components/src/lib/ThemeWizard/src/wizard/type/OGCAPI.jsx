import React, { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Accordion, ActionIcon, Alert, Group, Switch, TextInput } from '@mantine/core';
import { IconInfoCircle, IconSearch } from '@scalargis/ui';

import { I18N_NAMESPACE } from './../../i18n/index';


export default function OGCAPI(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  useEffect(() => {
    if (props?.data?.dataType === 'ogcapi' && props?.data?.url) {
      loadCollections();
    }
  }, [props?.data?.dataType]);

  /** Reduce the pasted URL to the service base (no /collections, no query). */
  const serviceBase = (raw) => {
    let u = (raw || '').trim();
    if (!u) return '';
    u = u.split('?')[0].split('#')[0];
    u = u.replace(/\/+$/, '');
    u = u.replace(/\/collections$/i, '');
    return u;
  }

  /**
   * Event handler for load OGC API collections
   */
  const loadCollections = () => {
    const { core, data, setLoading, setData, setSelected, setError, cookies, Models } = props;
    const { isUrlAppOrigin, rememberUrl } = Models.Utils;

    const base = serviceBase(data.url);
    if (!base) return;

    let url = base + '/collections?f=json';
    if (data.ogcUseProxy && !isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    }

    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(json => {
        const options = {
          use_proxy: !!data.ogcUseProxy,
          strategy: data.ogcLoadAll ? 'all' : 'bbox'
        };
        const dataitems = Models.OWSModel.convertOGCAPI2Themes(json, base, options);
        const total = (json?.collections || []).length;
        const skipped = total - dataitems.length;

        setData({ ...data, dataType: undefined, dataitems, ogcSkipped: skipped });
        setSelected({});

        if (cookies) rememberUrl(cookies, 'ogcapi', data.url);
        setLoading(false);
      })
      .catch(error => {
        setData({ ...data, dataType: undefined, dataitems: [], ogcSkipped: 0 });
        setSelected({});
        setError('' + error);
        setLoading(false);
      });
  }

  /**
   * Render OGC API wizard
   */
  const render = () => {
    const { loading, data, editField, getUrlHistory } = props;

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
              loadCollections()
            }}
          >
            <IconSearch />
          </ActionIcon>
        </Group>
        <datalist id='urlhistory'>
          { getUrlHistory().map((i, k) => <option key={k} value={i} />)}
        </datalist>

        { data.ogcSkipped > 0 &&
          <Alert color="informative" py="xs" mt="sm" icon={<IconInfoCircle />}>
            {t("ogcapiUnsupportedCollections", "{{count}} coleções de mapa ou registo ainda não são suportadas.", { count: data.ogcSkipped })}
          </Alert>
        }

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
                <label className="col-12 md:col-8">{t("useProxy", "Usar proxy do servidor")}</label>
                <div className="col-12 md:col-4" style={{ textAlign: 'right' }}>
                  <Switch
                    size="md"
                    style={{ display: 'inline-block' }}
                    checked={!!data.ogcUseProxy}
                    onChange={e => editField('ogcUseProxy', !data.ogcUseProxy)}
                  />
                </div>
              </div>

              <div className="field grid">
                <label className="col-12 md:col-8">{t("ogcapiLoadAll", "Carregar toda a coleção (sem bbox)")}</label>
                <div className="col-12 md:col-4" style={{ textAlign: 'right' }}>
                  <Switch
                    size="md"
                    style={{ display: 'inline-block' }}
                    checked={!!data.ogcLoadAll}
                    onChange={e => editField('ogcLoadAll', !data.ogcLoadAll)}
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
