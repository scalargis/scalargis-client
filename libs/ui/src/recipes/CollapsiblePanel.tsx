/* =====================================================================
   CollapsiblePanel — the Prime <Panel toggleable> twin.

   Not an Accordion. An Accordion is a *set* of mutually-aware sections
   with roving semantics; a Panel is one titled surface that happens to
   collapse. Modelling one as a single-item Accordion (which the first
   Mantine showcase did) gets the chrome wrong — no surface, no header
   band — and gives assistive tech a group of one.

   Built from Paper + Collapse, with the header button carrying
   aria-expanded/aria-controls so the relationship is announced.
   ===================================================================== */

import React, { useId } from 'react';
import {
  Box,
  Flex,
  Collapse,
  Group,
  Paper,
  UnstyledButton,
  type PaperProps,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { IconChevronDown } from './icons';

export interface CollapsiblePanelProps extends Omit<PaperProps, 'children' | 'onChange'> {
  header: React.ReactNode;
  children: React.ReactNode;
  /** Render the disclosure control. When false the panel is a plain titled surface. */
  toggleable?: boolean;
  /** Uncontrolled initial state. */
  defaultOpened?: boolean;
  /** Controlled state. Pair with onChange. */
  opened?: boolean;
  onChange?: (opened: boolean) => void;
  /** Extra controls rendered at the end of the header row (Prime's `icons`). */
  headerActions?: React.ReactNode;
}

export function CollapsiblePanel({
  header,
  children,
  toggleable = true,
  defaultOpened = true,
  opened: controlledOpened,
  onChange,
  headerActions,
  ...paperProps
}: CollapsiblePanelProps) {
  const contentId = useId();
  const [uncontrolledOpened, handlers] = useDisclosure(defaultOpened);

  const isControlled = controlledOpened !== undefined;
  const opened = isControlled ? controlledOpened : uncontrolledOpened;

  const toggle = () => {
    if (!isControlled) handlers.toggle();
    onChange?.(!opened);
  };

  const title = (
    <Flex gap="md" w="100%">
      {typeof header === 'string' ? (
        <Box fw={600} fz="sm" c="neutral.9" dangerouslySetInnerHTML={{ __html: header }} />
      ) : (
        <Box fw={600} fz="sm" c="neutral.9">{header}</Box>
      )}
    </Flex>
  );

  return (
    <Paper withBorder radius="sm" {...paperProps}>
      <Group
        justify="space-between"
        wrap="nowrap"
        gap="xs"
        px="sm"
        py="xs"
        bg="neutral.1"
        style={{
          borderStartStartRadius: 'inherit',
          borderStartEndRadius: 'inherit',
          borderBottom: opened ? '1px solid var(--mantine-color-neutral-2)' : undefined,
        }}
      >
        {toggleable ? (
          <UnstyledButton
            onClick={toggle}
            aria-expanded={opened}
            aria-controls={contentId}
            style={{ flex: 1, minWidth: 0 }}
          >
            <Group justify="space-between" wrap="nowrap" gap="xs">
              {title}
              <Box
                component="span"
                className="ads-chevron ads-panel__chevron"
                data-expanded={opened || undefined}
              >
                <IconChevronDown />
              </Box>
            </Group>
          </UnstyledButton>
        ) : (
          title
        )}
        {headerActions}
      </Group>

      <Collapse expanded={opened} id={contentId}>
        <Box p="sm">{children}</Box>
      </Collapse>
    </Paper>
  );
}
