import React from 'react';
import { ActionIcon } from '@mantine/core';

/** Round main menu button: filled when selected, light when its panel waits for a map tool, outline otherwise. */
const MainMenuButton = React.forwardRef(function MainMenuButton(
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

  return (
    <ActionIcon
      ref={ref}
      type="button"
      variant={variant}
      size={38}
      radius="xl"
      className={passthrough || undefined}
      style={style}
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
