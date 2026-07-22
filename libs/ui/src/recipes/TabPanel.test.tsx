/**
 * TabPanel mount contract — how a tab body is mounted and hidden:
 *  - eager   keeps children mounted, hidden off-flow when inactive;
 *  - lazy    withholds children until the first activation, then keeps them;
 *  - unmount mounts children only while active.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { TabPanel, type TabPanelProps } from './TabPanel';

function renderPanel(props: TabPanelProps) {
  return render(
    <MantineProvider theme={adsBaseTheme}>
      <TabPanel {...props} />
    </MantineProvider>
  );
}

// The OFF_FLOW styling lands on the inner wrapper — the parent of the child node.
const bodyWrapper = () => screen.getByText('Body').parentElement as HTMLElement;

describe('TabPanel', () => {
  it('eager keeps children mounted but hidden off-flow when inactive', () => {
    renderPanel({ active: false, children: <span>Body</span> });

    expect(screen.getByText('Body')).toBeTruthy(); // still in the DOM
    expect(bodyWrapper().style.visibility).toBe('hidden');
    expect(bodyWrapper().style.position).toBe('absolute');
  });

  it('eager shows children in flow when active', () => {
    renderPanel({ active: true, children: <span>Body</span> });

    expect(bodyWrapper().style.visibility).not.toBe('hidden');
    expect(bodyWrapper().style.position).not.toBe('absolute');
  });

  it('lazy withholds children until the first activation, then keeps them mounted', () => {
    const { rerender } = renderPanel({ active: false, mount: 'lazy', children: <span>Body</span> });
    expect(screen.queryByText('Body')).toBeNull(); // never activated → not mounted

    const wrap = (active: boolean) => (
      <MantineProvider theme={adsBaseTheme}>
        <TabPanel active={active} mount="lazy">
          <span>Body</span>
        </TabPanel>
      </MantineProvider>
    );

    rerender(wrap(true));
    expect(screen.getByText('Body')).toBeTruthy();

    // Deactivating keeps it mounted (hidden), so re-reveals stay instant.
    rerender(wrap(false));
    expect(bodyWrapper().style.visibility).toBe('hidden');
  });

  it('unmount renders children only while active', () => {
    const { rerender } = renderPanel({ active: true, mount: 'unmount', children: <span>Body</span> });
    expect(screen.getByText('Body')).toBeTruthy();

    rerender(
      <MantineProvider theme={adsBaseTheme}>
        <TabPanel active={false} mount="unmount">
          <span>Body</span>
        </TabPanel>
      </MantineProvider>
    );
    expect(screen.queryByText('Body')).toBeNull();
  });
});
