/* =====================================================================
   TreeView — the Prime Tree twin.

   Mantine's <Tree> is unstyled and affordance-free: it renders bare
   labels with no chevron, no checkbox, no hit area and no surface. Prime's
   Tree is a bordered card of hoverable rows, each with a disclosure
   chevron and (in `selectionMode="checkbox"`) a tri-state checkbox that
   cascades to children. That behaviour is what the layer-tree/TOC screens
   depend on, so it belongs here once rather than in every screen.

   Accessibility: Mantine's Tree supplies role=tree/treeitem and the arrow-
   key navigation model; the recipe adds the Enter binding Mantine lacks
   (Enter = the row's default action, mirroring a click — ARIA tree
   pattern). The pattern also wants aria-checked on the treeitem itself,
   but renderNode cannot reach the <li role="treeitem"> Mantine owns
   (upstream limitation) — so the row embeds a REAL Checkbox (named after
   the node, kept out of the tab order) and AT gets name/role/state from
   it; Space still toggles via checkOnSpace. Full TOC keyboard parity is
   verified with the layer tree in Phase 3 (cluster C).
   ===================================================================== */

import React from 'react';
import {
  Box,
  Checkbox,
  Group,
  Paper,
  Tree,
  getTreeExpandedState,
  useTree,
  type MantineSpacing,
  type RenderTreeNodePayload,
  type TreeNodeData,
  type TreeProps,
} from '@mantine/core';

import { IconChevronRight } from './icons';

export interface TreeViewProps
  extends Omit<TreeProps, 'renderNode' | 'data' | 'tree' | 'levelOffset'> {
  data: TreeNodeData[];
  /**
   * Controller from `useTree()`. Pass one when the screen needs to read the
   * checked/expanded state; omit it and TreeView keeps its own.
   */
  tree?: ReturnType<typeof useTree>;
  /** Tri-state checkboxes that cascade to children (Prime `selectionMode="checkbox"`). */
  checkboxes?: boolean;
  /** Wrap in a bordered surface, as Prime's Tree is. */
  bordered?: boolean;
  /** Indent per level. Defaults to one grid step (24px). */
  levelOffset?: MantineSpacing;
  /**
   * Expand every node on first render. Ignored when `tree` is supplied —
   * seed that controller's `initialExpandedState` instead (see TreeSelect).
   */
  defaultExpandAll?: boolean;
}

export function TreeView({
  data,
  tree,
  checkboxes = false,
  bordered = true,
  levelOffset = 'md',
  defaultExpandAll = false,
  onKeyDown,
  ...treeProps
}: TreeViewProps) {
  // Hooks can't be conditional, so always build a controller and prefer the
  // caller's. `initialExpandedState` is only read on first render, which is
  // why defaultExpandAll is a default and not a controlled prop.
  const internalTree = useTree({
    initialExpandedState: getTreeExpandedState(data, defaultExpandAll ? '*' : []),
  });
  const controller = tree ?? internalTree;

  // Mantine's Tree binds Space and the Arrow keys but NOT Enter (9.4.1
  // TreeNode handleKeyDown), so a keyboard user can focus a row yet never
  // activate it — the kit 04 (2.1.1) gap recorded in qa/phase-1.md, and what
  // made TreeSelect unusable without a pointer. The ARIA tree pattern gives
  // Enter the node's default action; here that mirrors a row click exactly:
  // toggle the check in checkbox mode, otherwise disclose + select the same
  // way Mantine's own label click does (expandOnClick/selectOnClick).
  const handleRootKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event);
    if (event.key !== 'Enter' || event.defaultPrevented) return;
    const item = (event.target as HTMLElement).closest('[role="treeitem"]');
    const value = item?.getAttribute('data-value');
    if (!value) return;
    event.preventDefault();
    if (checkboxes) {
      if (controller.isNodeChecked(value)) controller.uncheckNode(value);
      else controller.checkNode(value);
    } else {
      // Same order as Mantine's handleNodeClick; toggleExpanded on a leaf
      // is a no-op, so no hasChildren check is needed.
      controller.toggleExpanded(value);
      if (treeProps.selectOnClick) controller.select(value);
    }
  };

  const renderNode = ({
    node,
    expanded,
    hasChildren,
    elementProps,
    tree: t,
  }: RenderTreeNodePayload) => {
    const checked = t.isNodeChecked(node.value);
    const indeterminate = t.isNodeIndeterminate(node.value);

    const toggleChecked = () =>
      checked ? t.uncheckNode(node.value) : t.checkNode(node.value);

    return (
      <Group
        gap="xs"
        wrap="nowrap"
        {...elementProps}
        className={[elementProps.className, 'ads-tree__node'].filter(Boolean).join(' ')}
        onClick={(event: React.MouseEvent<HTMLDivElement>) => {
          // Mantine's handler keeps the focus/expand behaviour; in checkbox
          // mode the row itself toggles the check (Prime parity: clicking
          // the label checks, the chevron expands).
          elementProps.onClick?.(event);
          if (checkboxes) toggleChecked();
        }}
      >
        <Box
          component="span"
          className="ads-chevron ads-tree__chevron"
          data-expanded={expanded || undefined}
          data-leaf={!hasChildren || undefined}
          onClick={(event: React.MouseEvent) => {
            // Chevron toggles expansion without also selecting/checking the row.
            event.stopPropagation();
            t.toggleExpanded(node.value);
          }}
        >
          <IconChevronRight />
        </Box>

        {checkboxes && (
          <Checkbox
            checked={checked}
            indeterminate={indeterminate}
            // A real input, so AT gets name/role/state — renderNode cannot
            // put aria-checked on the treeitem <li> where the ARIA pattern
            // wants it. Out of the tab order: the roving-tabindex treeitem
            // plus Space (checkOnSpace) is the keyboard surface.
            aria-label={typeof node.label === 'string' ? node.label : String(node.value)}
            tabIndex={-1}
            onClick={(event: React.MouseEvent) => event.stopPropagation()}
            onChange={toggleChecked}
          />
        )}

        <span>{node.label}</span>
      </Group>
    );
  };

  const treeElement = (
    <Tree
      data={data}
      tree={controller}
      levelOffset={levelOffset}
      /* In checkbox mode, click and Space CHECK; expansion stays on the
         chevron and the Arrow keys (Prime parity). Mantine's defaults
         (expandOnClick/expandOnSpace true) would make each do both at once. */
      expandOnClick={!checkboxes}
      expandOnSpace={!checkboxes}
      checkOnSpace={checkboxes}
      renderNode={renderNode}
      onKeyDown={handleRootKeyDown}
      {...treeProps}
    />
  );

  return bordered ? (
    <Paper withBorder radius="sm" p="xs">
      {treeElement}
    </Paper>
  ) : (
    treeElement
  );
}

export { useTree, getTreeExpandedState };
export type { TreeNodeData };
