import { memo, useMemo } from 'react';
import { Select } from '@mantine/core';
import type { EnumCellProps } from '@jsonforms/core';
import type { TranslateProps } from '@jsonforms/react';

import { pickFieldProps, type MantineFieldProps } from '../util/field';
import { translateDefault } from '../util/i18nDefaults';

interface RequiredProp {
  required?: boolean;
}

export type MantineEnumCellProps = EnumCellProps &
  MantineFieldProps &
  Partial<TranslateProps> &
  RequiredProp & { className?: string };

/**
 * Enum values may be non-strings (integer enums); Mantine's Select speaks
 * strings only. Map through String() and translate back on change.
 */
export const useEnumOptionMapping = (
  options: EnumCellProps['options']
): [{ value: string; label: string }[], Map<string, unknown>] =>
  useMemo(() => {
    const data = (options ?? []).map((option) => ({
      value: String(option.value),
      label: option.label,
    }));
    const byKey = new Map((options ?? []).map((option) => [String(option.value), option.value]));
    return [data, byKey];
  }, [options]);

export const MantineSelect = memo(function MantineSelect(
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
        ? translateDefault(t, locale, 'enum.placeholder', { schema, uischema, path })
        : undefined,
    [t, locale, schema, uischema, path]
  );

  return (
    <Select
      {...pickFieldProps(props)}
      className={className}
      id={id}
      value={data !== undefined && data !== null ? String(data) : null}
      onChange={(value) =>
        handleChange(path, value === null ? undefined : byKey.get(value))
      }
      data={selectData}
      disabled={!enabled}
      placeholder={noneOptionLabel}
      // Prime parity: the clear icon appears only on optional fields.
      clearable={!required}
    />
  );
});
