/**
 * TreeView keyboard contract. Mantine's Tree ships Space + Arrow bindings
 * but no Enter — the recipe adds it (ARIA tree pattern: Enter = the row's
 * default action). This is the kit 04 (2.1.1) gap recorded in qa/phase-1.md.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { TreeView, type TreeNodeData } from './TreeView';

const data: TreeNodeData[] = [
  {
    value: 'europe',
    label: 'Europe',
    children: [
      { value: 'pt', label: 'Portugal' },
      { value: 'es', label: 'Spain' },
    ],
  },
];

function renderTree(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

function treeitemByValue(value: string): HTMLElement {
  return screen
    .getAllByRole('treeitem')
    .find((li) => li.getAttribute('data-value') === value) as HTMLElement;
}

function checkboxByName(name: string): HTMLInputElement {
  return screen.getByRole('checkbox', { name }) as HTMLInputElement;
}

describe('TreeView — Enter activates the focused row', () => {
  it('toggles the tri-state checkbox in checkbox mode (and cascades)', () => {
    renderTree(<TreeView data={data} checkboxes defaultExpandAll />);

    fireEvent.keyDown(treeitemByValue('europe'), { key: 'Enter' });
    expect(checkboxByName('Europe').checked).toBe(true);
    expect(checkboxByName('Portugal').checked).toBe(true);

    fireEvent.keyDown(treeitemByValue('europe'), { key: 'Enter' });
    expect(checkboxByName('Europe').checked).toBe(false);
  });

  it('selects and discloses in selection mode, mirroring a click', () => {
    renderTree(<TreeView data={data} selectOnClick />);

    // Collapsed on first render: the branch's children are not in the tree.
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);

    fireEvent.keyDown(treeitemByValue('europe'), { key: 'Enter' });

    expect(treeitemByValue('europe').getAttribute('aria-selected')).toBe('true');
    expect(screen.getAllByRole('treeitem').length).toBeGreaterThan(1);
  });

  it('leaves other keys to Mantine and still calls a caller onKeyDown', () => {
    const onKeyDown = vi.fn();
    renderTree(<TreeView data={data} onKeyDown={onKeyDown} />);

    fireEvent.keyDown(treeitemByValue('europe'), { key: 'ArrowDown' });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});
