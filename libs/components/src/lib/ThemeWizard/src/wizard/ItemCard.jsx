import { useRef, useState } from 'react';
import { ActionIcon, Box, Group, Popover, Text } from '@mantine/core';
//import { ActionIcon, Badge, Box, Group, HoverCard, Text } from '@mantine/core';
import 'primeicons/primeicons.css';



export function ItemCard({ title, badges = [], description }) {

  const [opened, setOpened] = useState(false);
  const closeTimer = useRef();

  const open = () => {
    clearTimeout(closeTimer.current);
    setOpened(true);
  };

  // Pequeno atraso para permitir mover o rato do botão para o popup
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
              // Hover apenas com rato; em toque o popup abre com o clique
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
            // O dropdown está num portal, mas os eventos React propagam pela árvore de componentes
            onClick={(e) => e.stopPropagation()}
          >
            <Text size="sm">{description}</Text>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Box>
  );

 /*
 return (
    <Box>
      <Group gap="xs" align="center" wrap="nowrap">
        <Text fz={14} lineClamp={2}>
          {title}
        </Text>

        <HoverCard width={260} position="bottom-start" withArrow shadow="md" openDelay={100}>
          <HoverCard.Target>
            <ActionIcon
              size={16}
              variant="outline"
              color="gray"
              radius="xl"
              aria-label="Mostrar descrição"
            >
              <i className="pi pi-info" style={{ fontSize: 9 }} />
            </ActionIcon>
          </HoverCard.Target>

          <HoverCard.Dropdown>
            <Text size="sm">{description}</Text>
          </HoverCard.Dropdown>
        </HoverCard>
      </Group>
    </Box>
  );
  */

    /*
    return (
    <Box>
        <Text fz={14} lineClamp={2}>
        {title}
        </Text>

        <Group justify="space-between" align="center" wrap="nowrap" mt="xs">
        <Group gap={6}>
            {badges.map((badge) => {
            const { label, color } =
                typeof badge === 'string' ? { label: badge, color: undefined } : badge;

            return (
                <Badge key={label} size="sm" variant="light" color={color}>
                {label}
                </Badge>
            );
            })}
        </Group>

        <HoverCard width={260} position="bottom-end" withArrow shadow="md" openDelay={100}>
            <HoverCard.Target>
            <ActionIcon
                size="sm"
                variant="outline"
                color="gray"
                radius="xl"
                aria-label="Mostrar descrição"
            >
                <i className="pi pi-info" style={{ fontSize: 12 }} />
            </ActionIcon>
            </HoverCard.Target>

            <HoverCard.Dropdown>
            <Text size="sm">{description}</Text>
            </HoverCard.Dropdown>
        </HoverCard>
        </Group>
    </Box>
    );
  */
}

/* Exemplo de utilização:

<ItemCard
  title="Limites administrativos"
  badges={['WFS', { label: 'Vetorial', color: 'teal' }]}
  description="Camada com os limites de distritos, concelhos e freguesias, atualizada anualmente."
/>
*/
