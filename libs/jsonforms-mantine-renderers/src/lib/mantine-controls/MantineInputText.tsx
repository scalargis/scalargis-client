import { memo } from 'react';
import merge from 'lodash/merge';
import { PasswordInput, Textarea, TextInput } from '@mantine/core';

import { pickFieldProps, type MantineCellProps } from '../util/field';

export const MantineInputText = memo(function MantineInputText(
  props: MantineCellProps
) {
  const { data, className, id, enabled, uischema, schema, path, handleChange, config } =
    props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const maxLength = schema.maxLength;

  const common = {
    ...pickFieldProps(props),
    className,
    id,
    value: typeof data === 'string' ? data : '',
    disabled: !enabled,
    autoFocus: !!appliedUiSchemaOptions.focus,
    maxLength: appliedUiSchemaOptions.restrict ? maxLength : undefined,
  };

  const onChange = (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newVal = ev.currentTarget.value;
    handleChange(path, newVal !== '' ? newVal : undefined);
  };

  // `multi` renders a real textarea — a documented gap in the Prime cell,
  // which rendered every string single-line (json-forms-baseline-test.md
  // flags it: "Textarea (if `multi` option works)").
  if (appliedUiSchemaOptions.multi) {
    return <Textarea {...common} onChange={onChange} autosize minRows={3} />;
  }

  if (appliedUiSchemaOptions.format === 'password') {
    return <PasswordInput {...common} onChange={onChange} />;
  }

  return <TextInput {...common} onChange={onChange} />;
});
