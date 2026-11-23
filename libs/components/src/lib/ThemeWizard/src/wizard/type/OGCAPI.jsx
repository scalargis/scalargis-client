import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Accordion, ActionIcon, Alert, Group, Switch, Text, TextInput, Select } from '@mantine/core';
import { IconInfoCircle, IconSearch } from '@scalargis/ui';

import { ItemCard, viewableUrl } from './../ItemCard';
import { findItemById } from './../itemTree';
import { useServiceAutoLoad } from './../autoLoad';
import { I18N_NAMESPACE } from './../../i18n/index';

import { TextInput as CustomTextInput} from '@scalargis/ui';

import {
  filterCollectionsByType,
  itemsLimitOf,
  serviceBase,
} from './../ogcapiUtils';

const LARGE_COLLECTION = 10000;

/** Sends a URL through the map proxy when the context asks for it. */
function proxied(url, ctx) {
  return ctx.useProxy && !ctx.isUrlAppOrigin(url) ? ctx.proxyUrl + encodeURIComponent(url) : url;
}

/** Fetches a URL as JSON with f=json, or throws. */
function getJson(url, ctx) {
  const target = /[?&]f=/.test(url) ? url : url + (url.includes('?') ? '&' : '?') + 'f=json';
  return fetch(proxied(target, ctx)).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

/** Returns the first OpenAPI document that one of the URLs gives, or null. */
function firstOpenApi(urls, ctx) {
  if (!urls.length) return Promise.resolve(null);
  return getJson(urls[0], ctx)
    .then((json) => (json?.paths ? json : firstOpenApi(urls.slice(1), ctx)))
    .catch(() => firstOpenApi(urls.slice(1), ctx));
}

/** Returns the limit facts of the items path of an OGC API service, from its OpenAPI document. */
function readItemsLimit(base, ctx) {
  return getJson(`${base}/`, ctx)
    .then((json) => json?.links || [])
    .catch(() => [])
    .then((links) => {
      const desc = links.find((l) => l.rel === 'service-desc' && /json/i.test(l.type || ''))?.href
        || links.find((l) => l.rel === 'service-desc')?.href;
      return firstOpenApi([...new Set([desc, `${base}/openapi`, `${base}/api`].filter(Boolean))], ctx);
    })
    .then((doc) => (doc ? itemsLimitOf(doc) : {}));
}


function SwitchRow({ label, checked, onChange, labelCols = 8 }) {
  return (
    <div className="field grid">
      <label className={`col-12 md:col-${labelCols}`}>{label}</label>
      <div className={`col-12 md:col-${12 - labelCols}`} style={{ textAlign: 'right' }}>
        <Switch
          size="md"
          style={{ display: 'inline-block' }}
          checked={!!checked}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function OGCAPI(props) {
  const { setItemRenderer, data, loading, editField, getUrlHistory, selected, patchData } = props;

  const { t, i18n } = useTranslation([I18N_NAMESPACE, "custom"]);
  const lang = i18n?.resolvedLanguage || i18n?.language;
  const [matched, setMatched] = useState({});
  const asked = useRef(new Set());
  const patchRef = useRef(patchData);
  patchRef.current = patchData;
  const itemsRef = useRef(data?.dataitems);
  itemsRef.current = data?.dataitems;

  const isUrlAppOrigin = props.Models.Utils.isUrlAppOrigin;
  const proxyUrl = props.core?.MAP_PROXY_URL;
  const useProxy = !!data?.ogcUseProxy;
  const fetchCtx = useMemo(() => ({ useProxy, proxyUrl, isUrlAppOrigin }), [useProxy, proxyUrl, isUrlAppOrigin]);

  const mapCode = props.mainMap?.getView?.().getProjection?.().getCode?.();
  const mapSrid = useMemo(() => {
    const n = mapCode ? parseInt(String(mapCode).split(':')[1], 10) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [mapCode]);

  const jsonService = data?.state?.jsonService;
  const collections = jsonService?.collections;
  const ogcAPIType = data?.ogcAPIType;

  const ogcTypeList = useMemo(() => [
    { value: 'maps', label: t("ogcapiMaps", "OGC API - Maps") },
    { value: 'mapTiles', label: t("ogcapiMapTiles", "OGC API - Map Tiles") },
    { value: 'vectorTiles', label: t("ogcapiVectorTiles", "OGC API - Vector Tiles") },
    { value: 'features', label: t("ogcapiFeatures", "OGC API - Features") },
  ], [t]);

  useEffect(() => {
    if (!ogcAPIType || !collections || !data?.ogcBase) return;

    const { Models } = props;

    const options = {
      use_proxy: false,
      strategy: data.ogcLoadAll ? 'all' : 'bbox',
      featureRender: ogcAPIType === 'vectorTiles' ? 'tiles' : 'features',
      tiled: !!data.ogcTiled,
      maxFeatures: data?.maxFeatures || 500,
      pageSize: data?.ogcLimit?.base === data.ogcBase ? data?.ogcLimit?.max : undefined,
      pageSizes: data?.ogcLimit?.base === data.ogcBase ? data?.ogcLimit?.byCollection : undefined,
      legends: data?.ogcLegends?.base === data.ogcBase ? data?.ogcLegends?.byCollection : undefined,
      mapSrid
    };

    const filtered = filterCollectionsByType(collections, ogcAPIType, data.ogcBase);

    const dataitems = Models.OWSModel.convertOGCAPI2Themes(
      { ...jsonService, collections: filtered },
      data.ogcBase,
      options
    );

    const ids = new Map((itemsRef.current || []).map((i) => [`${i.type}|${i.url}`, i.id]));
    dataitems.forEach((i) => {
      const id = ids.get(`${i.type}|${i.url}`);
      if (id) i.id = id;
    });

    patchData({ dataitems });
  }, [ogcAPIType, data?.ogcTiled, data?.ogcLoadAll, data?.ogcBase, data?.maxFeatures, data?.ogcLimit, data?.ogcLegends, collections, mapSrid]);

  const limitBase = data?.ogcLimit?.base;
  const ogcBase = data?.ogcBase;
  useEffect(() => {
    if (ogcAPIType !== 'features' || !ogcBase || limitBase === ogcBase) return;
    let cancelled = false;
    readItemsLimit(ogcBase, fetchCtx)
      .catch(() => ({}))
      .then((limit) => {
        if (!cancelled) patchRef.current({ ogcLimit: { base: ogcBase, ...limit } });
      });
    return () => { cancelled = true; };
  }, [ogcAPIType, ogcBase, limitBase, fetchCtx]);

  const legendsBase = data?.ogcLegends?.base;
  const OWSModel = props.Models.OWSModel;
  useEffect(() => {
    if (ogcAPIType !== 'maps' || !ogcBase || !collections || legendsBase === ogcBase) return;
    const linkBase = `${ogcBase}/collections`;
    const mapIds = new Set(filterCollectionsByType(collections, 'maps', ogcBase).map((c) => c.id));
    const mapCollections = collections.filter((c) => mapIds.has(c.id));
    const linked = mapCollections
      .map((c) => [c.id, OWSModel.ogcapiCollectionLegendUrl(c, linkBase)])
      .filter(([, url]) => url);
    const linkedIds = new Set(linked.map(([id]) => id));
    const asks = mapCollections
      .filter((c) => !linkedIds.has(c.id))
      .map((c) => ({ id: c.id, defaultStyle: c.defaultStyle, url: OWSModel.ogcapiStylesUrl(c, linkBase) }))
      .filter((a) => a.url);
    let cancelled = false;
    Promise.all(asks.map((a) => getJson(a.url, fetchCtx)
      .then((json) => [a.id, OWSModel.ogcapiStyleLegendUrl(json, a.url, a.defaultStyle)])
      .catch(() => [a.id, null])))
      .then((pairs) => {
        if (cancelled) return;
        const byCollection = Object.fromEntries([...linked, ...pairs.filter(([, url]) => url)]);
        patchRef.current({ ogcLegends: { base: ogcBase, byCollection } });
      });
    return () => { cancelled = true; };
  }, [ogcAPIType, ogcBase, collections, legendsBase, fetchCtx, OWSModel]);

  useEffect(() => {
    if (ogcAPIType !== 'features') return;
    const items = (data?.dataitems || []).filter((i) => selected?.[i.id]?.checked && i.url && !asked.current.has(i.url));
    items.forEach((item) => {
      asked.current.add(item.url);
      getJson(`${item.url}?f=json&limit=1`, fetchCtx)
        .then((json) => {
          const n = typeof json?.numberMatched === 'number' ? json.numberMatched : null;
          setMatched((m) => ({ ...m, [item.url]: n }));
        })
        .catch(() => setMatched((m) => ({ ...m, [item.url]: null })));
    });
  }, [selected, data?.dataitems, ogcAPIType, fetchCtx]);

  useEffect(() => {
    if (!setItemRenderer) return;
    const dataitems = data?.dataitems || [];

    setItemRenderer((itemData) => {
      const item = findItemById(dataitems, itemData?.id);

      if (item) {
        return (
          <ItemCard
            title={item.title}
            description={item.description}
            legendUrl={item.legend_url ? viewableUrl(proxied(item.legend_url, fetchCtx), proxyUrl, isUrlAppOrigin) : null}
          />
        );
      }
      return <span>{itemData?.content}</span>;
    });
  }, [data?.dataitems, setItemRenderer, fetchCtx, proxyUrl, isUrlAppOrigin]);

  /** Loads the collections of the OGC API service. */
  const loadCollections = () => {
    const { setLoading, beginLoad, setSelected, setError, Models } = props;
    const { rememberUrl } = Models.Utils;

    const base = serviceBase(data.url);
    if (!base) return;

    const url = proxied(`${base}/collections?f=json` + (lang ? `&lang=${encodeURIComponent(lang)}` : ''), fetchCtx);

    const sourceUrl = data.url;
    const isCurrent = beginLoad();
    setLoading(true);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!isCurrent()) return;
        patchData({
          state: { jsonService: json },
          dataType: undefined,
          dataitems: [],
          ogcBase: base,
          ogcAPIType: null,
          ogcLimit: null,
          ogcLegends: null,
        });
        setMatched({});
        asked.current = new Set();
        setSelected({});
        rememberUrl('ogcapi', sourceUrl);
      })
      .catch((error) => {
        if (!isCurrent()) return;
        patchData({
          state: { jsonService: null },
          dataType: undefined,
          dataitems: [],
          ogcBase: null,
          ogcAPIType: null,
        });
        setSelected({});
        setError(error?.message || String(error));
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  };

  useServiceAutoLoad(data, 'ogcapi', loadCollections);

  const hasService = jsonService != null;
  const showAdvanced = ['maps', 'features'].includes(ogcAPIType);
  const ticked = (data?.dataitems || []).filter((i) => selected?.[i.id]?.checked);
  const serverMax = ogcAPIType === 'features' && data?.ogcLimit?.base === data?.ogcBase
    ? [...new Set((ticked.length ? ticked.map((i) => i.page_size) : [data?.ogcLimit?.max]).filter(Boolean))].sort((a, b) => a - b).join(', ')
    : null;
  const large = ogcAPIType === 'features'
    ? ticked
      .filter((i) => matched[i.url] > LARGE_COLLECTION)
      .map((i) => ({ title: i.title, count: matched[i.url] }))
    : [];

  return (
    <React.Fragment>
      <Group className="ads-input-group" gap={0} wrap="nowrap" align="stretch">
        <TextInput
          placeholder="https://..."
          value={data.url || ''}
          list={`urlhistory-${data.type}`}
          style={{ flex: 1 }}
          onChange={(e) => editField('url', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              loadCollections();
            }
          }}
        />
        <ActionIcon
          size="input-md"
          variant="filled"
          type="button"
          title={t("load", "Carregar")}
          aria-label={t("load", "Carregar")}
          loading={loading}
          onClick={(e) => {
            e.preventDefault();
            loadCollections();
          }}
        >
          <IconSearch />
        </ActionIcon>
      </Group>

      <datalist id={`urlhistory-${data.type}`}>
        {getUrlHistory().map((i) => <option key={i} value={i} />)}
      </datalist>

      {hasService && !ogcAPIType && (
        <Alert color="informative" py="xs" mt="sm" icon={<IconInfoCircle />}>
          {t("ogcapiSelectType", "Selecione um tipo de API")}
        </Alert>
      )}

      {hasService && (
        <Select
          className="pt-2"
          placeholder={t("ogcapiType", "Tipo de API")}
          data={ogcTypeList}
          value={ogcAPIType || null}
          allowDeselect={false}
          onChange={(value) => editField('ogcAPIType', value)}
        />
      )}

      {showAdvanced && (
        <Accordion
          className="pt-2"
          value={data?.options?.showAdvancedOptions ? 'advanced' : null}
          onChange={(value) =>
            editField('options', { ...data?.options, showAdvancedOptions: value === 'advanced' })
          }
        >
          <Accordion.Item value="advanced">
            <Accordion.Control>{t("advancedOptions", "Opções Avançadas")}</Accordion.Control>
            <Accordion.Panel>
              <div className="p-fluid">
                {ogcAPIType === 'features' && (
                  <React.Fragment>
                    <SwitchRow
                      label={t("ogcapiLoadAll", "Carregar toda a coleção (sem bbox)")}
                      checked={data.ogcLoadAll}
                      onChange={() => editField('ogcLoadAll', !data.ogcLoadAll)}
                    />
                    {large.map((l) => (
                      <Alert key={l.title} color="warning" py="xs" mb="xs" icon={<IconInfoCircle />}>
                        {t("ogcapiLargeCollection", "{{title}}: {{count}} elementos. Carregar toda a coleção pode ser lento.", {
                          title: l.title,
                          count: l.count.toLocaleString(lang)
                        })}
                      </Alert>
                    ))}
                    <div>{t("ogcapiTotalFeatures", "Total de elementos a carregar")}</div>
                    <CustomTextInput
                      numeric="integer"
                      allowNegative={false}
                      value={data.maxFeatures}
                      onCommit={(text) => {
                        const n = parseInt(text, 10);
                        editField('maxFeatures', Number.isFinite(n) && n > 0 ? n : undefined);
                      }}
                    />
                    {serverMax ? (
                      <Text size="xs" c="dimmed" mt={4}>
                        {t("ogcapiServerMax", "Máx. do servidor: {{max}} por pedido", { max: serverMax })}
                      </Text>
                    ) : null}
                  </React.Fragment>
                )}

                {ogcAPIType === 'maps' && (
                  <SwitchRow
                    label={t("useTiles", "Usar quadrículas")}
                    labelCols={7}
                    checked={data.ogcTiled}
                    onChange={() => editField('ogcTiled', !data.ogcTiled)}
                  />
                )}
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      {hasService && ogcAPIType && (
        <Alert color="informative" py="xs" mt="sm" icon={<IconInfoCircle />}>
          {t("ogcapiCountTypeCollections", "{{count}} de {{total}} coleções", {count: data?.dataitems?.length || 0, total: collections?.length || 0})}
        </Alert>
      )}

    </React.Fragment>
  );
}
