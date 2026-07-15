import { memo, useMemo } from 'react';
import { MultiSelect } from '@mantine/core';

import { pickFieldProps } from '../util/field';
import { translateDefault } from '../util/i18nDefaults';
import { useEnumOptionMapping, type MantineEnumCellProps } from './MantineSelect';

export const MantineMultiSelect = memo(function MantineMultiSelect(
  props: MantineEnumCellProps
) {
  const {
    data,
    className,
    id,
    enabled,
    schema,
    uischema,
    path,
    handleChange,
    options,
    required,
    t,
    locale,
  } = props;

  const [selectData, byKey] = useEnumOptionMapping(options);

  const noneOptionLabel = useMemo(
    () =>
      t
        ? translateDefault(t, locale, 'oneofenum.placeholder', { schema, uischema, path })
        : undefined,
    [t, locale, schema, uischema, path]
  );

  return (
    <MultiSelect
      {...pickFieldProps(props)}
      className={className}
      id={id}
      value={Array.isArray(data) ? data.map(String) : []}
      onChange={(values) =>
        // Prime parity: an empty selection stores undefined, not [].
        handleChange(
          path,
          values.length ? values.map((value) => byKey.get(value)) : undefined
        )
      }
      data={selectData}
      disabled={!enabled}
      placeholder={noneOptionLabel}
      clearable={!required}
    />
  );
});
