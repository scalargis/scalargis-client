/** A toolbar that shows its actions as buttons on a wide screen and folds them into one menu on a phone. */

import React from 'react';
import { ActionIcon, Button, Group, Menu, type MantineSize } from '@mantine/core';

import { useIsMobile } from '../hooks/useIsMobile';
import { uiText } from './i18n';
import { IconChevronDown, IconEllipsisV } from './icons';

export interface ToolbarAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Sub-actions: a dropdown on a wide screen, a labelled group in the phone menu. */
  items?: ToolbarAction[];
}

export interface ActionToolbarProps {
  /** Controls that stay in view at every width, on the left. */
  start?: React.ReactNode;
  actions: ToolbarAction[];
  size?: MantineSize;
}

function WideAction({ action, size }: { action: ToolbarAction; size: MantineSize }) {
  const button = (
    <Button
      type="button"
      size={size}
      variant="subtle"
      leftSection={action.icon}
      rightSection={action.items ? <IconChevronDown /> : undefined}
      disabled={action.disabled}
      loading={action.loading}
      onClick={action.items ? undefined : action.onClick}
    >
      {action.label}
    </Button>
  );
  if (!action.items) return button;
  return (
    <Menu>
      <Menu.Target>{button}</Menu.Target>
      <Menu.Dropdown>
        {action.items.map((item) => (
          <Menu.Item key={item.key} leftSection={item.icon} disabled={item.disabled} onClick={item.onClick}>
            {item.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export function ActionToolbar({ start, actions, size = 'xs' }: ActionToolbarProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    const busy = actions.some((a) => a.loading);
    return (
      <Group justify="space-between" wrap="nowrap" gap="xs" className="ads-action-toolbar">
        <Group gap={4} wrap="nowrap">
          {start}
        </Group>
        {actions.length > 0 && (
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                size={`input-${size}`}
                loading={busy}
                aria-label={uiText('toolbar.more', 'More actions')}
                title={uiText('toolbar.more', 'More actions')}
              >
                <IconEllipsisV />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              {actions.map((action, i) =>
                action.items ? (
                  <React.Fragment key={action.key}>
                    {i > 0 && <Menu.Divider />}
                    <Menu.Label>{action.label}</Menu.Label>
                    {action.items.map((item) => (
                      <Menu.Item key={item.key} leftSection={item.icon} disabled={item.disabled || action.disabled} onClick={item.onClick}>
                        {item.label}
                      </Menu.Item>
                    ))}
                  </React.Fragment>
                ) : (
                  <Menu.Item key={action.key} leftSection={action.icon} disabled={action.disabled} onClick={action.onClick}>
                    {action.label}
                  </Menu.Item>
                )
              )}
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    );
  }

  return (
    <Group justify="space-between" wrap="wrap" gap="xs" className="ads-action-toolbar">
      <Group gap="xs" wrap="wrap">
        {start}
      </Group>
      <Group gap="xs" wrap="wrap" justify="flex-end">
        {actions.map((action) => (
          <WideAction key={action.key} action={action} size={size} />
        ))}
      </Group>
    </Group>
  );
}
