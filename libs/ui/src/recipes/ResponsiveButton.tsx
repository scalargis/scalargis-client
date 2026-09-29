/** A labelled button on a wide screen and an icon button on a phone. */

import React from 'react';
import { ActionIcon, Button, type MantineColor, type MantineSize } from '@mantine/core';

import { useIsMobile } from '../hooks/useIsMobile';

export interface ResponsiveButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color' | 'children' | 'type'> {
  /** Button text, and the accessible name of the icon button. */
  label: string;
  icon: React.ReactNode;
  /** Side of the icon on the labelled button. */
  iconPosition?: 'left' | 'right';
  size?: MantineSize;
  variant?: string;
  color?: MantineColor;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ResponsiveButton({
  label,
  icon,
  iconPosition = 'left',
  size = 'sm',
  type = 'button',
  variant,
  color,
  loading,
  disabled,
  ...rest
}: ResponsiveButtonProps) {
  const isMobile = useIsMobile();
  const shared = { type, variant, color, loading, disabled };

  if (isMobile) {
    return (
      <ActionIcon {...rest} {...shared} size={`input-${size}`} aria-label={label} title={rest.title ?? label}>
        {icon}
      </ActionIcon>
    );
  }

  return (
    <Button
      {...rest}
      {...shared}
      size={size}
      leftSection={iconPosition === 'left' ? icon : undefined}
      rightSection={iconPosition === 'right' ? icon : undefined}
    >
      {label}
    </Button>
  );
}
