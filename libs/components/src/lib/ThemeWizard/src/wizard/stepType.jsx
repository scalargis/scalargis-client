import React, { useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { Button, Radio, Stack } from '@mantine/core';

import { I18N_NAMESPACE } from './../i18n/index';


export default function WizardStepType(props) {

  const { i18n, t } = useTranslation([I18N_NAMESPACE, "custom"]);

  // Translate type
  const types = useMemo(() => {
    return (props?.types || []).map( tp => {
      return {
        ...tp,
        label: t(tp.value, tp.label)
      }
    });
  }, [i18n?.resolvedLanguage]);

  const type = props?.wizardData?.type;

  return (
    <div>

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
