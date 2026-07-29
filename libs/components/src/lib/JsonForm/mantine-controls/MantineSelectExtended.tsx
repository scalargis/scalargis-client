import React from 'react';
import {
  MantineSelect,
  type MantineEnumCellProps,
} from '@scalargis/jsonforms-mantine-renderers';

/**
 * MantineSelect plus the ScalarGIS `dependent_controls` contract: the schema
 * lists the data paths of controls whose values become stale when this one
 * changes, and every change here resets them to undefined.
 */
export const MantineSelectExtended = React.memo(function MantineSelectExtended(
  props: MantineEnumCellProps
) {
  const { data, schema, handleChange } = props;

  const handleChangeWithDependents: typeof handleChange = (path, value) => {
    handleChange(path, value);

    const dependentControls = (schema as { dependent_controls?: unknown })
      .dependent_controls;
    if (Array.isArray(dependentControls) && dependentControls.length) {
      dependentControls.forEach((ctrlPath) => {
        handleChange(ctrlPath, undefined);
      });
    }
  };

  // oneOf values can arrive as the {const, title} object; unwrap to the const.
  const value =
    data && typeof data === 'object' && 'const' in data ? data.const : data;

  return (
    <MantineSelect {...props} data={value} handleChange={handleChangeWithDependents} />
  );
});
