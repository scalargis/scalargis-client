import React from 'react';
import { ActionIcon, rem } from '@mantine/core';

/**
 * @typedef {object} MainMenuButtonProps
 * @property {string} [className]
 * @property {string} [title]
 * @property {React.ReactNode} [icon]
 * @property {React.CSSProperties} [style]
 * @property {boolean} [active]
 * @property {boolean} [inactive]
 * @property {React.MouseEventHandler<HTMLButtonElement>} [onClick]
 * @property {React.ReactNode} [children]
 */

/** Round main menu button: filled when selected, light with a primary border when its panel waits for a map tool, outline otherwise. */
const MainMenuButton = React.forwardRef(/** @param {MainMenuButtonProps} props @param {React.ForwardedRef<HTMLButtonElement>} ref */ function MainMenuButton(
  {
    className = '',
    title,
    icon,
    style,
    active,
    inactive = false,
    onClick,
    children,
  },
  ref,
) {
  const isActive = active ?? !String(className).includes('p-button-outlined');
  const passthrough = String(className)
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('p-button'))
    .join(' ');

  let variant = 'outline';
  if (isActive) variant = inactive ? 'light' : 'filled';
  const lightBorder = variant === 'light' ? { '--ai-bd': `${rem(1)} solid var(--mantine-primary-color-filled)` } : null;

  return (
    <ActionIcon
      ref={ref}
      type="button"
      variant={variant}
      size={38}
      radius="xl"
      className={passthrough || undefined}
      style={lightBorder ? [lightBorder, style] : style}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      onClick={onClick}
    >
      {children ?? (React.isValidElement(icon) ? icon : <i className={icon} aria-hidden="true" />)}
    </ActionIcon>
  );
});

export default MainMenuButton;
