import React from 'react';
import { ActionIcon } from '@mantine/core';

import './map-tool-button.css';

/**
 * Round raised button floating on the map surface (the map-region chrome:
 * MapControls, Basemaps toggle, and the cluster-C tools that follow).
 *
 * The purple hover/active matches the OL-native controls rendered beside
 * these buttons — that pairing, not the theme, owns the colour here.
 */
export default function MapToolButton({
  icon,
  title,
  active,
  className,
  onClick,
  children,
  ...rest
}) {
  return (
    <ActionIcon
      type="button"
      variant="filled"
      size={34}
      radius="xl"
      className={['map-tool-btn', active ? 'active' : '', className || '']
        .filter(Boolean)
        .join(' ')}
      title={title}
      aria-label={title}
      aria-pressed={active != null ? active : undefined}
      onClick={onClick}
      {...rest}
    >
      {children ?? <i className={icon} aria-hidden="true" />}
    </ActionIcon>
  );
}
