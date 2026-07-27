/* =====================================================================
   Dialog — the Prime <Dialog> twin for windowed content.

   A raw Mantine Modal covers the plain title+body dialogs (the whole
   backoffice converted on it). The viewer's dialogs carry two extras
   Modal's flat API cannot express:

   - `maximizable` — a header control that toggles full-screen, which
     Prime's Dialog offered and the help/results/document windows use;
   - `footer` — an action bar OUTSIDE the scroll region, pinned to the
     dialog's bottom edge.

   Both require the Modal.Root composition; this recipe owns that
   boilerplate so call sites stay a prop-rename away from the old Prime
   markup. The content column is a flex layout with the body as the
   scrolling `flex: 1` cell, so percentage/`100%`-height children
   (iframes, embedded panoramas) track the dialog size with no resize
   listeners — the machinery Prime call sites hand-rolled with
   onShow/onResize/onMaximize handlers becomes CSS.
   ===================================================================== */

import React, { useState } from 'react';
import {
  ActionIcon,
  Box,
  Group,
  Modal,
  useMantineTheme,
  type ModalRootProps,
} from '@mantine/core';

import { IconWindowMaximize, IconWindowMinimize } from './icons';
import { uiText } from './i18n';

export interface DialogProps extends Omit<ModalRootProps, 'title'> {
  /** Header title (Prime's `header`). */
  title?: React.ReactNode;
  /** Action bar pinned below the scrollable body (Prime's `footer`). */
  footer?: React.ReactNode;
  /** Render the maximize/restore header control. */
  maximizable?: boolean;
  /** Fixed content height while windowed, e.g. '80vh'. Body scrolls inside. */
  height?: number | string;
}

export function Dialog({
  title,
  footer,
  maximizable = false,
  height,
  children,
  opened,
  onClose,
  centered = true,
  zIndex,
  ...rootProps
}: DialogProps) {
  const theme = useMantineTheme();
  const [maximized, setMaximized] = useState(false);

  // Modal.Root does not inherit the theme's `Modal` defaultProps (they only
  // apply to the compound component), so the ADS dialog rung is restated here.
  const z = zIndex ?? theme.other?.zLadder?.dialog ?? 6000;

  return (
    <Modal.Root
      opened={opened}
      onClose={onClose}
      centered={centered}
      zIndex={z}
      fullScreen={maximized}
      {...rootProps}
    >
      <Modal.Overlay />
      <Modal.Content
        h={maximized ? undefined : height}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
          <Group gap={4} wrap="nowrap">
            {maximizable && (
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                onClick={() => setMaximized((m) => !m)}
                aria-label={
                  maximized
                    ? uiText('dialog.restore', 'Restore')
                    : uiText('dialog.maximize', 'Maximize')
                }
              >
                {maximized ? <IconWindowMinimize /> : <IconWindowMaximize />}
              </ActionIcon>
            )}
            <Modal.CloseButton aria-label={uiText('dialog.close', 'Close')} />
          </Group>
        </Modal.Header>
        {/* minHeight 0 lets the body actually shrink and scroll in a flex
            column; without it long content stretches the dialog offscreen. */}
        <Modal.Body style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {children}
        </Modal.Body>
        {footer && <Box className="ads-dialog__footer">{footer}</Box>}
      </Modal.Content>
    </Modal.Root>
  );
}
