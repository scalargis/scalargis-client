export const DEFAULT_ROOT_LAYERS = ['overlays', 'main', 'background', 'basemaps'];

/** Returns the ids of the top-level nodes that the viewer reads. */
export function rootIds(config) {
  const roots = config?.root_layers;
  return Array.isArray(roots) && roots.length ? roots : DEFAULT_ROOT_LAYERS;
}

/** Returns the layer nodes of a config, or an empty list. */
export function layerList(config) {
  return Array.isArray(config?.layers) ? config.layers.filter((l) => l && typeof l === 'object') : [];
}

/** Returns the rows of the layer tree in display order, then the nodes that no group or root reaches. */
export function treeRows(config) {
  const layers = layerList(config);
  const byId = new Map(layers.map((l) => [l.id, l]));
  const roots = rootIds(config);
  const seen = new Set();
  const rows = [];
  const walk = (node, depth, parentId) => {
    if (seen.has(node.id)) return;
    seen.add(node.id);
    rows.push({ node, depth, parentId });
    if (node.type !== 'GROUP' || !Array.isArray(node.children)) return;
    for (const childId of node.children) {
      const child = byId.get(childId);
      if (child) walk(child, depth + 1, node.id);
    }
  };
  for (const node of layers) {
    if (roots.includes(node.id)) walk(node, 0, null);
  }
  const orphans = layers.filter((l) => !seen.has(l.id));
  return { rows, orphans };
}

/** Returns the id of the group that holds the node first, or null for a top-level or orphan node. */
export function parentOf(config, id) {
  return layerList(config).find((l) => Array.isArray(l.children) && l.children.includes(id))?.id ?? null;
}

/** Returns a node id that no node of the config uses yet. */
export function uniqueId(config, prefix) {
  const ids = new Set(layerList(config).map((l) => l.id));
  let n = 1;
  while (ids.has(`${prefix}_${n}`)) n++;
  return `${prefix}_${n}`;
}

/** Returns the ids of a node and of every node under it. */
export function subtreeIds(config, id) {
  const byId = new Map(layerList(config).map((l) => [l.id, l]));
  const out = new Set();
  const walk = (nodeId) => {
    if (out.has(nodeId)) return;
    out.add(nodeId);
    const node = byId.get(nodeId);
    if (node && Array.isArray(node.children)) node.children.forEach(walk);
  };
  walk(id);
  return out;
}

/** Returns the config with a list key filtered, or the key left out when the config had none. */
function withList(config, key, filter) {
  if (!Array.isArray(config[key])) return config;
  return { ...config, [key]: config[key].filter(filter) };
}

/** Returns the config with a new node under a group, or at the top level when the parent is null. */
export function addNode(config, node, parentId, afterId = null) {
  let layers = layerList(config).slice();
  if (parentId) {
    layers = layers.map((l) => {
      if (l.id !== parentId) return l;
      const children = Array.isArray(l.children) ? l.children.slice() : [];
      const at = afterId ? children.indexOf(afterId) : -1;
      if (at >= 0) children.splice(at + 1, 0, node.id);
      else children.push(node.id);
      return { ...l, children };
    });
    layers.push(node);
  } else {
    const at = afterId ? layers.findIndex((l) => l.id === afterId) : -1;
    if (at >= 0) layers.splice(at + 1, 0, node);
    else layers.push(node);
  }
  let next = { ...config, layers };
  if (!parentId) next = { ...next, root_layers: [...rootIds(config), node.id] };
  const checked = Array.isArray(config.checked) ? config.checked : [];
  if (!checked.includes(node.id)) next = { ...next, checked: [...checked, node.id] };
  return next;
}

/** Returns the config without a node and without each node under it that no other group holds. */
export function removeNode(config, id) {
  const layers = layerList(config);
  const doomed = subtreeIds(config, id);
  for (const otherId of Array.from(doomed)) {
    if (otherId === id) continue;
    const heldElsewhere = layers.some((l) => !doomed.has(l.id) && Array.isArray(l.children) && l.children.includes(otherId));
    if (heldElsewhere) subtreeIds(config, otherId).forEach((d) => doomed.delete(d));
  }
  const kept = layers.filter((l) => !doomed.has(l.id)).map((l) => (
    Array.isArray(l.children) && l.children.some((c) => doomed.has(c))
      ? { ...l, children: l.children.filter((c) => !doomed.has(c)) }
      : l
  ));
  let next = { ...config, layers: kept };
  for (const key of ['checked', 'opened', 'root_layers']) next = withList(next, key, (v) => !doomed.has(v));
  return next;
}

/** Returns the config with a node id changed in the node, in each group, and in checked, opened, and root_layers. */
export function renameNode(config, oldId, newId) {
  const swap = (v) => (v === oldId ? newId : v);
  const layers = layerList(config).map((l) => {
    let out = l.id === oldId ? { ...l, id: newId } : l;
    if (Array.isArray(out.children) && out.children.includes(oldId)) out = { ...out, children: out.children.map(swap) };
    return out;
  });
  const next = { ...config, layers };
  for (const key of ['checked', 'opened', 'root_layers']) {
    if (Array.isArray(next[key])) next[key] = next[key].map(swap);
  }
  return next;
}

/** Returns the config with a node moved one place up (-1) or down (+1) among its siblings, or null when it cannot move. */
export function moveNode(config, id, step) {
  const parentId = parentOf(config, id);
  const layers = layerList(config).slice();
  if (parentId) {
    const parent = layers.find((l) => l.id === parentId);
    const children = parent.children.slice();
    const at = children.indexOf(id);
    const to = at + step;
    if (to < 0 || to >= children.length) return null;
    [children[at], children[to]] = [children[to], children[at]];
    return { ...config, layers: layers.map((l) => (l.id === parentId ? { ...l, children } : l)) };
  }
  const roots = rootIds(config);
  if (!roots.includes(id)) return null;
  const rootPositions = layers.map((l, i) => (roots.includes(l.id) ? i : -1)).filter((i) => i >= 0);
  const at = rootPositions.indexOf(layers.findIndex((l) => l.id === id));
  const to = at + step;
  if (to < 0 || to >= rootPositions.length) return null;
  const a = rootPositions[at];
  const b = rootPositions[to];
  [layers[a], layers[b]] = [layers[b], layers[a]];
  return { ...config, layers };
}

/** Returns the groups that can take the node: every group outside its own subtree. */
export function moveTargets(config, id) {
  const blocked = subtreeIds(config, id);
  return layerList(config).filter((l) => l.type === 'GROUP' && !blocked.has(l.id));
}

/** Returns the config with a node taken out of each group and the top level, then put at the end of a group, or at the top level when the target is null. */
export function moveInto(config, id, targetId) {
  const layers = layerList(config).map((l) => (
    Array.isArray(l.children) && l.children.includes(id) ? { ...l, children: l.children.filter((c) => c !== id) } : l
  ));
  const roots = rootIds(config).filter((r) => r !== id);
  const next = { ...config, layers };
  if (Array.isArray(config.root_layers) || rootIds(config).includes(id)) next.root_layers = roots;
  if (targetId) {
    next.layers = next.layers.map((l) => (l.id === targetId ? { ...l, children: [...(Array.isArray(l.children) ? l.children : []), id] } : l));
  } else {
    next.root_layers = [...roots, id];
  }
  return next;
}

/** Returns the shared layer codes that the layers of the config name, in first-use order. */
export function sharedCodes(config) {
  const codes = [];
  for (const l of layerList(config)) {
    if (typeof l.shared === 'string' && l.shared && !codes.includes(l.shared)) codes.push(l.shared);
  }
  return codes;
}

/** Returns the config with a pointer to a shared layer at the end of a group, and the new node id. The layer starts off. */
export function addSharedPointer(config, code, targetId) {
  const taken = layerList(config).some((l) => l.id === code);
  const id = taken ? uniqueId(config, code) : code;
  const next = addNode(config, { id, shared: code }, targetId);
  if (Array.isArray(config.checked)) next.checked = config.checked;
  else delete next.checked;
  return { config: next, id };
}
