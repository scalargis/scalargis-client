import type { ReactNode } from 'react';
import type { CellProps, WithClassname } from '@jsonforms/core';

/**
 * The field props MantineInputControl computes once and hands to every cell.
 * Mantine's Input-based components accept them natively (label association,
 * `aria-invalid` + `aria-describedby` wiring, error text next to the field —
 * the plan §1d a11y contract); non-Input widgets (Checkbox, Switch, Slider)
 * adapt them inside their cell.
 */
export interface MantineFieldProps {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  withAsterisk?: boolean;
  'aria-required'?: boolean;
}

export type MantineCellProps = CellProps & WithClassname & MantineFieldProps;

/** The subset of props a cell spreads onto its Mantine input. */
export const pickFieldProps = (props: MantineFieldProps) => ({
  label: props.label,
  description: props.description,
  error: props.error,
  withAsterisk: props.withAsterisk,
  'aria-required': props['aria-required'],
});
