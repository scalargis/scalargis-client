/* =====================================================================
   TreeSelect — the Prime TreeSelect twin.

   Mantine core has no equivalent, and the mapping question the first
   showcase left open ("grouped Select vs custom?") resolves to custom:
   a grouped Select flattens the hierarchy to two levels and loses the
   ancestor path, which is exactly what these pickers exist to show.

   So: an InputBase target (a real <button>, so it is focusable and
   announces its value) opening a Popover that hosts the TreeView recipe.
   Single-select only — a checkbox TreeSelect is a different control and
   nothing measured in the codebase asks for one.
   ===================================================================== */

import React, { useMemo, useState } from 'react';
import {
  CloseButton,
  Combobox,
  Input,
  InputBase,
  Popover,
  type InputBaseProps,
  type TreeNodeData,
} from '@mantine/core';

import { TreeView, getTreeExpandedState, useTree } from './TreeView';
import { uiText } from './i18n';

export interface TreeSelectProps
  extends Omit<InputBaseProps, 'value' | 'onChange' | 'children' | 'component'> {
  data: TreeNodeData[];
  /** Selected node `value`, or null. */
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  clearable?: boolean;
  /** Only leaf nodes may be selected. Branches then just expand. */
  selectableLeavesOnly?: boolean;
}

/** Depth-first walk to resolve a node value to its label (and whether it's a leaf). */
function findNode(
  data: TreeNodeData[],
  value: string
): { node: TreeNodeData; isLeaf: boolean } | null {
  for (const node of data) {
    if (node.value === value) {
      return { node, isLeaf: !node.children?.length };
    }
    if (node.children) {
      const hit = findNode(node.children, value);
      if (hit) return hit;
    }
  }
  return null;
}

export function TreeSelect({
  data,
  value = null,
  onChange,
  placeholder = uiText('treeselect.placeholder', 'Select item'),
  clearable = false,
  selectableLeavesOnly = false,
  ...inputProps
}: TreeSelectProps) {
  const [opened, setOpened] = useState(false);

  const selected = useMemo(
    () => (value ? findNode(data, value) : null),
    [data, value]
  );

  const tree = useTree({
    multiple: false,
    // Open with the hierarchy visible — the whole point over a flat Select.
    // (TreeView's defaultExpandAll can't do it here: it only seeds TreeView's
    // internal controller, and this controller is ours.)
    initialExpandedState: getTreeExpandedState(data, '*'),
    selectedState: value ? [value] : [],
    onSelectedStateChange: (next) => {
      // select() never emits an empty state in single mode; guard for safety.
      const picked = next[0] ?? null;
      if (!picked) return;

      if (selectableLeavesOnly && !findNode(data, picked)?.isLeaf) {
        // Branch clicked in leaves-only mode: Tree still expanded it, which is
        // the useful half of the interaction. Just don't commit a value.
        return;
      }

      onChange?.(picked);
      setOpened(false);
    },
  });

  const canClear = clearable && value !== null && !inputProps.disabled;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      width="target"
      shadow="md"
      withinPortal
      /* The dropdown is portaled, so without a trap, Tab never reaches it.
         Trapping gets Arrow keys + Esc working from the tree; TreeView's
         Enter binding commits the focused node through the same
         onSelectedStateChange path as a click (closed the qa/phase-1
         keyboard-selection item, 2026-07-10). */
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <InputBase
          component="button"
          type="button"
          pointer
          multiline
          className="ads-treeselect__target"
          role="combobox"
          aria-expanded={opened}
          aria-haspopup="tree"
          onClick={() => setOpened((o) => !o)}
          rightSection={
            canClear ? (
              <CloseButton
                size="sm"
                aria-label={uiText('treeselect.clear', 'Clear selection')}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange?.(null);
                }}
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          // The chevron is decorative; the clear button is not, so it must stay
          // clickable rather than being swallowed by the button target.
          rightSectionPointerEvents={canClear ? 'all' : 'none'}
          {...inputProps}
        >
          {selected ? (
            selected.node.label
          ) : (
            <Input.Placeholder>{placeholder}</Input.Placeholder>
          )}
        </InputBase>
      </Popover.Target>

      <Popover.Dropdown p="xs">
        {/* expandOnClick stays on even in leaves-only mode: clicking a branch
            has to do *something*, and expanding it is the useful half. Range
            selection makes no sense in a single-value picker. */}
        <TreeView
          data={data}
          tree={tree}
          bordered={false}
          selectOnClick
          allowRangeSelection={false}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
