import React from 'react';
import { Paper, Stack, Title } from '@mantine/core';

/** Backoffice page block: an optional title, then a white card with an optional toolbar above the content. */
export default function PageSection({ title, toolbar, children, ...others }) {
  return (
    <Stack gap="sm" mb="md" {...others}>
      {title ? <Title order={3}>{title}</Title> : null}
      <Paper p="md">
        {toolbar ? <Stack gap="md">{toolbar}{children}</Stack> : children}
      </Paper>
    </Stack>
  );
}
