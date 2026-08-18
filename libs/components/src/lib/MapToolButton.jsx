import React from 'react';
import { ActionIcon } from '@mantine/core';

import './map-tool-button.css';

/**
 * Round raised button floating on the map surface (the map-region chrome:
 * MapControls, Basemaps toggle, and the cluster-C tools that follow).
 *
 * The purple hover/active matches the OL-native controls rendered beside
 * these buttons — that pairing, not the theme, owns the colour here.
 *
 * Extended (B-09) with opt-in `size`/`variant`/`color`/`radius` pass-throughs
 * so the dense panel toolbars (DrawingToolbar, TimelineControl, DrawTools)
 * can reuse the shared title/aria-label/aria-pressed wiring without
 * inheriting the map-chrome look: passing ANY of the four switches the
 * button into "plain" mode — a bare ActionIcon with that wiring, none of
 * map-tool-button.css's forced background/shadow — so the ~8 existing
 * map-surface adopters, which never pass them, stay byte-identical.
 * `MapToolButton.Group` wraps children in `<ActionIcon.Group>` for
 * segmented strips like Timeline's transport row.
 */
export default function MapToolButton({
  icon,
  title,
  active,
  className,
  style,
  onClick,
  children,
  size,
  variant,
  color,
  radius,
  ...rest
}) {
  // Chrome mode is the original parameterless call (no size/variant/color/
  // radius override): the purple map-chrome (map-tool-button.css) still owns
  // the look, exactly as before this prop set existed.
  const isChrome = size == null && variant == null && color == null && radius == null;

  return (
    <ActionIcon
      type="button"
      variant={variant ?? 'filled'}
      color={color}
      radius={radius ?? (isChrome ? 'xl' : undefined)}
      size={size}
      /* Size comes from the shared --map-control-size knob (defined once in
         mainmap.css) so every button in the map control strip stays uniform
         and the size is a one-line change there. Set inline so it beats
         Mantine's default --ai-size regardless of CSS layer/specificity;
         the --ai-size-lg fallback (34px) keeps the button sized when the
         knob isn't defined (component used outside the viewer map). Only
         applied in chrome mode — a plain-mode caller supplies its own size. */
      style={isChrome ? { '--ai-size': 'var(--map-control-size, var(--ai-size-lg))', ...style } : style}
      className={[isChrome ? 'map-tool-btn' : '', isChrome && active ? 'active' : '', className || '']
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

MapToolButton.Group = function MapToolButtonGroup({ children, ...rest }) {
  return <ActionIcon.Group {...rest}>{children}</ActionIcon.Group>;
};
