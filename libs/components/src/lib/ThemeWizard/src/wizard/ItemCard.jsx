import { useRef, useState } from 'react';
import { ActionIcon, Box, Group, Popover, Text } from '@mantine/core';
import 'primeicons/primeicons.css';

/** Item title with a popover that shows the description. */
export function ItemCard({ title, badges = [], description }) {

  const [opened, setOpened] = useState(false);
  const closeTimer = useRef();

  const open = () => {
    clearTimeout(closeTimer.current);
    setOpened(true);
  };

  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpened(false), 100);
  };

  return (
    <Box>
      <Group gap="xs" justify="space-between" align="center" wrap="nowrap">
        <Text fz={14} lineClamp={2} style={{ flex: 1, minWidth: 0 }}>
          {title}
        </Text>

        <Popover
          opened={opened}
          onChange={setOpened}
          width={260}
          position="bottom-end"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <ActionIcon
              size={16}
              variant="outline"
              color="gray"
              radius="xl"
              aria-label="Mostrar descrição"
              onPointerEnter={(e) => e.pointerType === 'mouse' && open()}
              onPointerLeave={(e) => e.pointerType === 'mouse' && closeSoon()}
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <i className="pi pi-info" style={{ fontSize: 9 }} />
            </ActionIcon>
          </Popover.Target>

          <Popover.Dropdown
            onPointerEnter={(e) => e.pointerType === 'mouse' && open()}
            onPointerLeave={(e) => e.pointerType === 'mouse' && closeSoon()}
            onClick={(e) => e.stopPropagation()}
          >
            <Text size="sm">{description}</Text>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Box>
  );
}
