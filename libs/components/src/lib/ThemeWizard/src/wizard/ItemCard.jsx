import { useRef, useState } from 'react';
import { ActionIcon, Box, Group, Popover, Text } from '@mantine/core';
import 'primeicons/primeicons.css';

/** Item title with an optional grey subtitle and a popover that shows the description and the legend. */
export function ItemCard({ title, subtitle, description, legendUrl }) {

  const [opened, setOpened] = useState(false);
  const [legendFailed, setLegendFailed] = useState(false);
  const closeTimer = useRef();

  const open = () => {
    clearTimeout(closeTimer.current);
    setOpened(true);
  };

  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpened(false), 100);
  };

  const showLegend = !!legendUrl && !legendFailed;
  const hasDetails = !!description || showLegend;

  return (
    <Box data-item-card>
      <Group gap="xs" justify="space-between" align="center" wrap="nowrap">
        <Text fz={14} lineClamp={2} style={{ flex: 1, minWidth: 0 }}>
          {title}
          {subtitle ? (
            <Text span c="dimmed" fz={12} ml={6} data-item-subtitle>{subtitle}</Text>
          ) : null}
        </Text>

        {hasDetails ? (
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
              {description ? (
                <Text size="sm" style={{ maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-line' }}>{description}</Text>
              ) : null}
              {opened && showLegend ? (
                <Box mt={description ? 'xs' : 0}>
                  <img
                    data-item-legend
                    src={legendUrl}
                    alt=""
                    loading="lazy"
                    style={{ display: 'block', maxWidth: '100%', maxHeight: 160, objectFit: 'contain' }}
                    onError={() => setLegendFailed(true)}
                  />
                </Box>
              ) : null}
            </Popover.Dropdown>
          </Popover>
        ) : null}
      </Group>
    </Box>
  );
}
