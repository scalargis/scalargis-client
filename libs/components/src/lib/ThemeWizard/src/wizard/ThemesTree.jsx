import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Anchor, TextInput } from '@mantine/core';
import { TreeView, useTree, IconSearch } from '@scalargis/ui';

import { I18N_NAMESPACE } from './../i18n/index';
import { foldDiacritics } from '../../../utils/common';

/* Prime Tree node ({key,label,children}) → Mantine TreeNodeData. Values are
   the layer ids as strings — the same strings the wizard's `selected` map is
   keyed by (object keys were already strings under Prime). */
function toTreeData(nodes) {
  return (nodes || []).map((n) => {
    const item = { value: String(n.key), label: n.label };
    if (n.children && n.children.length) item.children = toTreeData(n.children);
    return item;
  });
}

/* Prime "lenient" filtering: a node stays when its own label matches (whole
   subtree kept) or when any descendant matches (pruned to matching branches). */
function filterTreeData(nodes, query) {
  const q = foldDiacritics((query || '').trim());
  if (!q) return nodes;
  const walk = (list) =>
    list
      .map((n) => {
        if (foldDiacritics(n.label || '').includes(q)) return n;
        const children = n.children ? walk(n.children) : [];
        return children.length ? { ...n, children } : null;
      })
      .filter(Boolean);
  return walk(nodes);
}

function collectLeafValues(nodes, acc = []) {
  (nodes || []).forEach((n) => {
    if (n.children && n.children.length) collectLeafValues(n.children, acc);
    else acc.push(n.value);
  });
  return acc;
}

/* Values + nesting only — the same idea as the TreeView recipe's shape key,
   so a reload of the same service does not count as a new shape. */
function shapeKeyOf(nodes) {
  return (nodes || [])
    .map((n) => (n.children && n.children.length ? `${n.value}(${shapeKeyOf(n.children)})` : n.value))
    .join(',');
}

const sameSet = (a, b) => a.length === b.length && a.every((v) => b.includes(v));

/**
 * The checkbox tree shared by the three wizard theme selectors.
 *
 * It keeps speaking the wizard's Prime Tree selection contract — `selected`
 * is a map `{ [key]: { checked, partialChecked } }` holding every fully or
 * partially checked node — and translates it from/to the TreeView
 * controller's leaf-value checkedState.
 *
 * The `selected` map, not the controller, is the source of truth: Mantine's
 * Tree re-initialises its checkedState from the data it is handed and DROPS
 * values that are not in it, so with the filter active the controller only
 * ever holds the visible leaves. Hidden leaves keep their state in the map
 * (carried over by the up-sync) and are re-seeded when the filter clears —
 * filtering never loses a selection, which is how the Prime Tree behaved.
 */
export default function ThemesTree({ nodes, selected, setSelected, readOnly, withFilter }) {
  const { t } = useTranslation([I18N_NAMESPACE, 'custom']);
  const [filter, setFilter] = useState('');
  const [isSelectAll, setIsSelectAll] = useState(false);

  const treeData = useMemo(() => toTreeData(nodes), [nodes]);
  const filteredData = useMemo(() => filterTreeData(treeData, filter), [treeData, filter]);

  const initialChecked = useMemo(
    () => (readOnly || !selected ? [] : collectLeafValues(treeData).filter((v) => selected[v]?.checked)),
    // Seeded once at mount; afterwards the sync effects own the state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const tree = useTree({ initialCheckedState: initialChecked });

  // Down-sync: the wizard resets or preloads `selected` from outside (the
  // type components call setSelected({}) when a load fails), and filtering
  // changes which leaves the controller may hold. Set-compared, so the
  // round-trip with the up-sync below converges instead of looping.
  useEffect(() => {
    if (readOnly) return;
    const wanted = collectLeafValues(filteredData).filter((v) => selected?.[v]?.checked);
    if (!sameSet(wanted, tree.checkedState)) tree.setCheckedState(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, filteredData]);

  // Up-sync: rebuild the Prime-shaped map. Leaf truth comes from the
  // controller for visible leaves and from the previous map for hidden ones;
  // group checked/partial states derive from that leaf truth over the FULL
  // tree, never from the filtered twin. Skipped when the result matches the
  // prop by value (covers mount and the down-sync echo).
  useEffect(() => {
    if (readOnly || !setSelected) return;
    const prev = selected || {};
    const visible = new Set(collectLeafValues(filteredData));
    const checkedSet = new Set(tree.checkedState);

    const sel = {};
    const deriveNode = (n) => {
      if (!n.children || !n.children.length) {
        const checked = visible.has(n.value) ? checkedSet.has(n.value) : !!prev[n.value]?.checked;
        if (checked) sel[n.value] = { checked: true, partialChecked: false };
        return { total: 1, checked: checked ? 1 : 0 };
      }
      let total = 0;
      let checkedCount = 0;
      n.children.forEach((c) => {
        const r = deriveNode(c);
        total += r.total;
        checkedCount += r.checked;
      });
      if (total > 0 && checkedCount === total) sel[n.value] = { checked: true, partialChecked: false };
      else if (checkedCount > 0) sel[n.value] = { checked: false, partialChecked: true };
      return { total, checked: checkedCount };
    };
    treeData.forEach(deriveNode);

    const same =
      Object.keys(sel).length === Object.keys(prev).length &&
      Object.keys(sel).every(
        (k) =>
          !!prev[k] &&
          !!prev[k].checked === sel[k].checked &&
          !!prev[k].partialChecked === !!sel[k].partialChecked
      );
    if (!same) setSelected(sel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree.checkedState]);

  // Every group opens on load, as the Prime selectors did; re-opened when the
  // loaded service (and so the shape) changes.
  const shapeKey = useMemo(() => shapeKeyOf(treeData), [treeData]);
  useEffect(() => {
    tree.expandAllNodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapeKey]);

  if (!treeData.length) return null;

  return (
    <React.Fragment>
      {!readOnly && !!setSelected && (
        <div style={{ textAlign: 'right' }} className="mb-1">
          <Anchor
            component="button"
            type="button"
            onClick={() => {
              if (isSelectAll) tree.uncheckAllNodes();
              else tree.checkAllNodes();
              setIsSelectAll(!isSelectAll);
            }}
          >
            {t('selectRemovalAll', 'Selecionar/Remover Todos')}
          </Anchor>
        </div>
      )}

      {!readOnly && withFilter && (
        <TextInput
          size="sm"
          mb="xs"
          value={filter}
          placeholder={`${t('filter', 'Filtro')}...`}
          leftSection={<IconSearch />}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}

      <TreeView data={filteredData} tree={tree} checkboxes={!readOnly} />
    </React.Fragment>
  );
}
