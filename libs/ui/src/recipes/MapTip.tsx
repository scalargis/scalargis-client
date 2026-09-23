/** Hover tooltip over the map at a pixel position, with the shared compact spacing. */

import React from 'react';

export interface MapTipProps {
  /** Map pixel `[x, y]` of the pointer. */
  pixel: [number, number] | number[];
  /** `dark` is the translucent feature tip. `light` is the rounded card tip. */
  variant?: 'dark' | 'light';
  /** Thin light border on the dark variant. */
  withBorder?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function MapTip({
  pixel,
  variant = 'dark',
  withBorder = false,
  className,
  style,
  children,
}: MapTipProps) {
  const classes = [
    'ads-maptip',
    `ads-maptip--${variant}`,
    withBorder ? 'ads-maptip--bordered' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={{ left: pixel[0], top: pixel[1], ...style }}>
      {children}
    </div>
  );
}
