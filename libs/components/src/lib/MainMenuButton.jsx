import React from 'react';
import { ActionIcon } from '@mantine/core';

/**
 * Round main-menu button — the viewer plugin-contract control every
 * component's MainMenu export renders (Core.jsx renderMainMenu mounts them
 * in the 55px sidebar strip).
 *
 * Active state: until the shell pass hands a semantic prop, the only state
 * signal is the className contract — the shell appends `p-button-outlined`
 * to unselected items and nothing else. `active` (when given) wins over the
 * derived value, so the shell can migrate to `active={...}` without touching
 * the components again.
 *
 * The `p-button-*` tokens are stripped before the class list reaches the
 * DOM (they'd fight Mantine's styling while Prime CSS is still loaded);
 * every other class (menu-inactive, main-menu-btn-image, custom hooks)
 * passes through for the layout sass.
 */
export default function MainMenuButton({
  className = '',
  title,
  icon,
  style,
  active,
  onClick,
  children,
}) {
  const isActive = active ?? !String(className).includes('p-button-outlined');
  const passthrough = String(className)
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('p-button'))
    .join(' ');

  return (
    <ActionIcon
      type="button"
      variant={isActive ? 'filled' : 'outline'}
      size={38}
      radius="xl"
      className={passthrough || undefined}
      style={style}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      onClick={onClick}
    >
      {children ?? <i className={icon} aria-hidden="true" />}
    </ActionIcon>
  );
}
