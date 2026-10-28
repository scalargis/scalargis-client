/** A one-line button that opens a list of check boxes: the compact twin of a multi-select. */

import React from 'react';
import { Button, Checkbox, Popover, Stack, useMantineTheme, type ButtonProps } from '@mantine/core';

import { IconChevronDown } from './icons';

export interface CheckboxSelectOption {
  value: string;
  label: React.ReactNode;
}

export interface CheckboxSelectProps extends Omit<ButtonProps, 'children' | 'onChange'> {
  /** The options, one check box each. */
  data: CheckboxSelectOption[];
  /** The checked values. */
  value: string[];
  /** Called with the new checked values. */
  onChange: (value: string[]) => void;
  /** Button text. Default: the label, then `n of m`. */
  label?: React.ReactNode;
  /** Text between the checked count and the total. Default `/`. */
  ofText?: string;
  /** Layer of the list. Default: one rung above the dialog rung. */
  dropdownZIndex?: number;
}

export function CheckboxSelect({
  data,
  value,
  onChange,
  label,
  ofText = '/',
  dropdownZIndex,
  size = 'xs',
  variant = 'default',
  ...buttonProps
}: CheckboxSelectProps) {
  const theme = useMantineTheme();
  const z = dropdownZIndex ?? (theme.other?.zLadder?.dialog ?? 6000) + 100;
  return (
    <Popover position="bottom-start" shadow="md" zIndex={z}>
      <Popover.Target>
        <Button size={size} variant={variant} rightSection={<IconChevronDown />} {...buttonProps}>
          {label ? `${label}: ` : ''}
          {`${value.length} ${ofText} ${data.length}`}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Checkbox.Group value={value} onChange={onChange}>
          <Stack gap="xs">
            {data.map((o) => (
              <Checkbox key={o.value} value={o.value} label={o.label} />
            ))}
          </Stack>
        </Checkbox.Group>
      </Popover.Dropdown>
    </Popover>
  );
}
