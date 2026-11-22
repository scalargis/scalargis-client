import React, { useEffect, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Accordion, ActionIcon, Alert, Group, Switch, TextInput, Select } from '@mantine/core';
import { IconInfoCircle, IconSearch } from '@scalargis/ui';

import { ItemCard } from './../ItemCard';
import { I18N_NAMESPACE } from './../../i18n/index';

import { TextInput as CustomTextInput} from '@scalargis/ui';

import {
  filterCollectionsByType,
  serviceBase,
  countRecordCollections,
} from './../ogcapiUtils';


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
  const { setItemRenderer, data, loading, editField, getUrlHistory } = props;

  const { t } = useTranslation([I18N_NAMESPACE, "custom"]);

  const jsonService = data?.state?.jsonService;
  const collections = jsonService?.collections;
  const ogcAPIType = data?.ogcAPIType;

  const ogcTypeList = useMemo(() => [
    { value: 'maps', label: t("ogcapiMaps", "OGC API - Maps") },
    { value: 'mapTiles', label: t("ogcapiMapTiles", "OGC API - Map Tiles") },
    { value: 'vectorTiles', label: t("ogcapiVectorTiles", "OGC API - Vector Tiles") },
    { value: 'features', label: t("ogcapiFeatures", "OGC API - Features") },
  ], [t]);

  const typeLabel = useMemo(
    () => ogcTypeList.find((o) => o.value === ogcAPIType)?.label,
    [ogcTypeList, ogcAPIType]
  );

  // Coleções de registos (Records) ainda não suportadas
  /*
  const skippedCount = useMemo(() => countRecordCollections(collections), [collections]);
  const skippedCount = useMemo(
    () => (collections || []).filter((c) => c.itemType === 'record').length,
    [collections]
  );
  */

  // Converte as coleções filtradas em dataitems sempre que algo relevante muda
  useEffect(() => {
    if (!ogcAPIType || !collections || !data?.ogcBase) return;

    const { patchData, Models } = props;

    const options = {
      use_proxy: false,
      strategy: data.ogcLoadAll ? 'all' : 'bbox',
      featureRender: ogcAPIType === 'vectorTiles' ? 'tiles' : 'features',
      tiled: !!data.ogcTiled,
      maxFeatures: data?.maxFeatures || 500
    };

    const filtered = filterCollectionsByType(collections, ogcAPIType, data.ogcBase);

    const dataitems = Models.OWSModel.convertOGCAPI2Themes(
      { ...jsonService, collections: filtered },
      data.ogcBase,
      options
    );

    patchData({ dataitems });
  }, [ogcAPIType, data?.ogcTiled, data?.ogcLoadAll, data?.ogcBase, data?.maxFeatures, collections]);

  // Renderer dos itens da lista
  useEffect(() => {
    if (!setItemRenderer) return;
    const dataitems = data?.dataitems || [];

    setItemRenderer((itemData) => {
      const item = itemData?.id ? dataitems.find((i) => i.id === itemData.id) : null;

      if (item) {
        return (
          <ItemCard
            title={item.title}
            badges={typeLabel ? [{ label: typeLabel, color: 'teal' }] : []}
            description={item.description}
          />
        );
      }
      return <span>{itemData?.content}</span>;
    });
  }, [data?.dataitems, typeLabel]);

  /** Carrega as coleções do serviço OGC API */
  const loadCollections = () => {
    const { core, setLoading, patchData, beginLoad, setSelected, setError, cookies, Models } = props;
    const { isUrlAppOrigin, rememberUrl } = Models.Utils;

    const base = serviceBase(data.url);
    if (!base) return;

    let url = `${base}/collections?f=json`;
    if (data.ogcUseProxy && !isUrlAppOrigin(url)) {
      url = core.MAP_PROXY_URL + encodeURIComponent(url);
    }

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
          dataType: 'ogcapi',
          dataitems: [],
          ogcBase: base,
          ogcAPIType: null,
        });
        setSelected({});
        if (cookies) rememberUrl(cookies, 'ogcapi', sourceUrl);
      })
      .catch((error) => {
        if (!isCurrent()) return;
        patchData({
          state: { jsonService: null },
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

  const hasService = jsonService != null;
  const showAdvanced = ['maps', 'features'].includes(ogcAPIType);

  return (
    <React.Fragment>
      <Group className="ads-input-group" gap={0} wrap="nowrap" align="stretch">
        <TextInput
          placeholder="https://..."
          value={data.url || ''}
          list="urlhistory"
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

      <datalist id="urlhistory">
        {getUrlHistory().map((i) => <option key={i} value={i} />)}
      </datalist>

      {/*skippedCount > 0 && (
        <Alert color="informative" py="xs" mt="sm" icon={<IconInfoCircle />}>
          {t(
            "ogcapiUnsupportedCollections",
            "{{count}} coleções de registo ainda não são suportadas.",
            { count: skippedCount }
          )}
        </Alert>
      )*/}

      {hasService && !ogcAPIType && (
        <Alert color="informative" py="xs" mt="sm" icon={<IconInfoCircle />}>
          {t("ogcapiSelectType", "Selecione um tipo de API")}
        </Alert>
      )}

      {hasService && (
        <Select
          className="pt-2"
          placeholder={t("ogcType", "Escolha um tipo de API")}
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
                    {/*
                    <TextInput
                      placeholder="500"
                      value={data.maxFeatures || ''}
                      style={{ flex: 1 }}
                      onChange={(e) => editField('maxFeatures', e.target.value)}
                    />
                    */}
                  <CustomTextInput
                    label={t("ogcapiMaxFeatures", "Número máximo de features")}
                    inputMode="numeric"
                    value={data.maxFeatures}
                    onCommit={(text) => {
                      const n = parseInt(text, 10);
                      editField('maxFeatures', Number.isFinite(n) && n > 0 ? n : undefined);
                    }}
                  />
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
          {t("ogcapiTypeCollections", `${data?.dataitems?.length || 0} de ${collections.length || 0} coleções`)}
        </Alert>
      )}

    </React.Fragment>
  );
}
