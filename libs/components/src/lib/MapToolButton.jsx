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
  style,
  onClick,
  children,
  ...rest
}) {
  return (
    <ActionIcon
      type="button"
      variant="filled"
      radius="xl"
      /* Size comes from the shared --map-control-size knob (defined once in
         mainmap.css) so every button in the map control strip stays uniform
         and the size is a one-line change there. Set inline so it beats
         Mantine's default --ai-size regardless of CSS layer/specificity;
         the --ai-size-lg fallback (34px) keeps the button sized when the
         knob isn't defined (component used outside the viewer map). */
      style={{ '--ai-size': 'var(--map-control-size, var(--ai-size-lg))', ...style }}
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
