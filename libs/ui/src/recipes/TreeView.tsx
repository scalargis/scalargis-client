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

/* Mantine memoizes isNodeChecked/isNodeIndeterminate on a cache key of
   JSON.stringify([value, data, checkedState]) — the WHOLE data array, on every
   node of every render. A `label` that is a React element carries a circular
   fiber reference, so that stringify throws ("Converting circular structure to
   JSON") and takes the screen with it; even where it survives (production
   elements may have no _owner) it serialises the entire tree per node.

   Labels are ours to render anyway — the recipe owns renderNode — so Mantine
   only ever sees values and shape, and the real labels ride a side map keyed by
   value. Any consumer can hand us JSX labels (the PanelJSON tree does; the TOC
   will) without knowing this.

   TreeNodeData requires a label, so the twin carries the node's own value as a
   plain string — serializable, and never rendered (renderNode reads the map). */
type ShapeOnlyNode = { value: string; label: string; children?: ShapeOnlyNode[] };

// The shape twin (values + nesting only) is what feeds Mantine's <Tree>, whose
// useEffect(initialize, [data]) fires setState on every new `data` identity — so
// a caller that mints a fresh array each render (the PanelJSON tree did; the TOC
// will) drives an infinite loop. buildShape is memoized below on a SHAPE key so
// a new array of identical shape reuses the same twin and the Tree never
// re-initialises. Labels are separate: collectLabels rebuilds them each render
// (they are read at render time, never in an effect, so they loop nothing),
// which keeps JSX labels fresh even when the shape is unchanged.
function buildShape(nodes: TreeNodeData[]): ShapeOnlyNode[] {
  return nodes.map((node) => {
    const twin: ShapeOnlyNode = { value: node.value, label: node.value };
    if (node.children?.length) twin.children = buildShape(node.children);
    return twin;
  });
}

function collectLabels(
  nodes: TreeNodeData[],
  labels: Map<string, React.ReactNode>
): void {
  for (const node of nodes) {
    labels.set(node.value, node.label);
    if (node.children?.length) collectLabels(node.children, labels);
  }
}

// A stable key derived from the shape alone (values + nesting), serializable and
// label-free. Two data arrays with the same shape share a key, so buildShape's
// memo hands back the same twin object across renders.
function shapeKeyOf(nodes: TreeNodeData[]): string {
  return nodes
    .map((n) => (n.children?.length ? `${n.value}(${shapeKeyOf(n.children)})` : n.value))
    .join(',');
}

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

  // shapeData is keyed on the shape so a same-shape re-render reuses the twin
  // (breaks Mantine's Tree re-initialise loop even for callers that don't
  // memoize their data); labels rebuild on every data change to stay fresh.
  const shapeKey = shapeKeyOf(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shapeData = React.useMemo(() => buildShape(data), [shapeKey]);
  const labels = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    collectLabels(data, map);
    return map;
  }, [data]);

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
    // Only ask in checkbox mode: a plain tree has no use for the answer, and
    // these two are the memoized pair described at the top of the file.
    const checked = checkboxes && t.isNodeChecked(node.value);
    const indeterminate = checkboxes && t.isNodeIndeterminate(node.value);

    // `node` is the shape-only twin, so the label comes back from the map.
    const label = labels.get(node.value);

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
            aria-label={typeof label === 'string' ? label : String(node.value)}
            tabIndex={-1}
            onClick={(event: React.MouseEvent) => event.stopPropagation()}
            onChange={toggleChecked}
          />
        )}

        <span>{label}</span>
      </Group>
    );
  };

  const treeElement = (
    <Tree
      data={shapeData}
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
