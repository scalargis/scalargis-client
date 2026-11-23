import React, { useMemo, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Button, CloseButton, Group, Radio, Stack, Text, UnstyledButton } from '@mantine/core';

import { I18N_NAMESPACE } from './../i18n/index';

const RECENT_TYPE_LABELS = {
  wms: 'WMS',
  wmts: 'WMTS',
  wfs: 'WFS',
  ogcapi: 'OGC API',
  arcgismap: 'ArcGIS',
  cog: 'COG',
  geojson: 'GeoJSON',
  kml: 'KML'
};

/** Returns the host and path of a URL, cut in the middle when it is longer than max. */
function shortUrl(url, max = 34) {
  let text = url;
  try {
    const u = new URL(url);
    text = u.host + (u.pathname === '/' ? '' : u.pathname);
  } catch {
    text = url;
  }
  if (text.length <= max) return text;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${text.slice(0, head)}…${text.slice(-tail)}`;
}


export default function WizardStepType(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);
  const utils = props?.Models?.Utils;

  // Translate type
  const types = useMemo(() => {
    return (props?.types || []).map( tp => {
      return {
        ...tp,
        label: t(tp.value, tp.label)
      }
    });
  }, [i18n?.resolvedLanguage]);

  const recentTypes = useMemo(
    () => (props?.types || []).map(tp => tp.value).filter(v => RECENT_TYPE_LABELS[v]),
    [props?.types]
  );
  const readRecent = () => utils?.getRecentSearches ? utils.getRecentSearches(recentTypes) : [];
  const [recent, setRecent] = useState(readRecent);

  const removeRecent = (entry) => {
    utils?.forgetUrl?.(entry.type, entry.url);
    setRecent(readRecent());
  };

  const type = props?.wizardData?.type;

  return (
    <div>

      { recent.length > 0 && (
        <Stack gap={2} mb="sm">
          <Text size="xs" fw={600} c="dimmed">{t("recentSearches", "Pesquisas recentes")}</Text>
          { recent.map(entry => (
            <Group
              key={`${entry.type}|${entry.url}`}
              gap={4}
              wrap="nowrap"
              data-recent-search=""
              data-type={entry.type}
              data-url={entry.url}
            >
              <UnstyledButton
                data-recent-open=""
                title={entry.date ? `${entry.url} · ${new Date(entry.date).toLocaleString(i18n?.resolvedLanguage)}` : entry.url}
                onClick={() => props.onRecent(entry)}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Group gap="xs" wrap="nowrap">
                  <Text size="xs" fw={600} w={52} style={{ flexShrink: 0 }}>{RECENT_TYPE_LABELS[entry.type]}</Text>
                  <Text size="xs" truncate>{shortUrl(entry.url)}</Text>
                </Group>
              </UnstyledButton>
              <CloseButton
                size="sm"
                data-recent-remove=""
                title={t("removeRecentSearch", "Remover da lista")}
                aria-label={t("removeRecentSearch", "Remover da lista")}
                onClick={() => removeRecent(entry)}
              />
            </Group>
          ))}
        </Stack>
      )}

      <div className="mt-2">
        <Radio.Group
          value={type || null}
          onChange={(value) => props.onChange(value)}
        >
          <Stack gap="xs">
            { types.map(t => (
              <Radio
                key={t.value}
                value={t.value}
                label={t.label}
              />
            ))}
          </Stack>
        </Radio.Group>
      </div>

      <div style={ {padding: "0.571rem 1rem", textAlign: "right"} }>
        <Button
          type="button"
          disabled={!type}
          onClick={e => {
            props.onSave();
          }}
        >
          {t("next", "Seguinte")}
        </Button>
      </div>
    </div>
  )
}
