/**
 * TreeSelect behavioural contract: commit paths (click and Enter must be
 * equivalent — the Enter path closed the qa/phase-1 keyboard-selection
 * item), the leaves-only guard, and clearing.
 *
 * jsdom note: Mantine's Popover Transition never progresses past its
 * pre-enter `display:none` here (no layout engine), so role queries use
 * `hidden: true` — the dropdown's OPEN state is asserted through the
 * combobox's own aria-expanded, which the recipe controls. Real-browser
 * visibility is covered by the /demo-ext/mantine walkthrough.
 */
import React, { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { TreeSelect } from './TreeSelect';
import type { TreeNodeData } from './TreeView';

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

function Harness({
  leavesOnly = false,
  clearable = false,
  onChange,
}: {
  leavesOnly?: boolean;
  clearable?: boolean;
  onChange?: (value: string | null) => void;
}) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <MantineProvider theme={adsBaseTheme}>
      <TreeSelect
        data={data}
        value={value}
        onChange={(v) => {
          setValue(v);
          onChange?.(v);
        }}
        placeholder="Pick"
        clearable={clearable}
        selectableLeavesOnly={leavesOnly}
      />
    </MantineProvider>
  );
}

function combobox(): HTMLElement {
  return screen.getByRole('combobox', { hidden: true });
}

async function openDropdown(): Promise<void> {
  fireEvent.click(combobox());
  await screen.findAllByRole('treeitem', { hidden: true });
  expect(combobox().getAttribute('aria-expanded')).toBe('true');
}

function treeitemByValue(value: string): HTMLElement {
  return screen
    .getAllByRole('treeitem', { hidden: true })
    .find((li) => li.getAttribute('data-value') === value) as HTMLElement;
}

describe('TreeSelect', () => {
  it('commits a node with Enter and closes the dropdown', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await openDropdown();
    fireEvent.keyDown(treeitemByValue('pt'), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('pt');
    expect(combobox().getAttribute('aria-expanded')).toBe('false');
    await waitFor(() =>
      expect(screen.queryAllByRole('treeitem', { hidden: true })).toHaveLength(0)
    );
    expect(combobox().textContent).toContain('Portugal');
  });

  it('commits a node on click, same path as Enter', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await openDropdown();
    fireEvent.click(screen.getByText('Spain'));

    expect(onChange).toHaveBeenCalledWith('es');
    expect(combobox().getAttribute('aria-expanded')).toBe('false');
  });

  it('leaves-only: a branch never commits, the dropdown stays open', async () => {
    const onChange = vi.fn();
    render(<Harness leavesOnly onChange={onChange} />);

    await openDropdown();
    fireEvent.keyDown(treeitemByValue('europe'), { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(combobox().getAttribute('aria-expanded')).toBe('true');
  });

  it('clears back to null via the clear button without opening the dropdown', async () => {
    const onChange = vi.fn();
    render(<Harness clearable onChange={onChange} />);

    await openDropdown();
    fireEvent.keyDown(treeitemByValue('pt'), { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith('pt');

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection', hidden: true }));

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(combobox().textContent).toContain('Pick');
    // stopPropagation on the clear click: the dropdown must not reopen.
    expect(combobox().getAttribute('aria-expanded')).toBe('false');
  });
});
