
export const convertToRGBAString = (str) => {
  const fill = str.split(',');
  return `rgba(${ fill[0] }, ${ fill[1] }, ${ fill[2] }, ${ fill[3] })`;
}

export const convertToRGBA = (str) => {
  const fill = str.split(',');
  return { r: fill[0], g: fill[1], b: fill[2], a: fill[3] };
}

/**
 * Traverse layers tree
 * 
 * @param {Array} items 
 * @param {Function} cb 
 * @param {Object} parent 
 */
export const traverseTree = (items, cb, parent = {}) => {
  items = items || [];
  items.map((child, i) => {
    cb(child, i, items, parent);
    traverseTree(child.children, cb, child);
    return child;
  });
};

export const traverseTreeRecursive = (items, parent, grandparent, cb) => {
  if (parent.children && parent.children.length) {
    items.filter(i => parent.children.includes(i.id)).forEach((node, i) => {
      cb(node, parent, grandparent);
      traverseTreeRecursive(items, node, parent, cb);
    });
  }
}

/*
export const traverseTreeUpRecursiveById = (node, id, level = 0) => {
  if (node.id === id) return [id];
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      let result = traverseTreeUpRecursiveById(node.children[i], id, level+1);
      if (Array.isArray(result)) return [node.id].concat(result);
    }
  } else if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      let result = traverseTreeUpRecursiveById(node[i], id, level+1);
      if (Array.isArray(result)) return [node.id].concat(result);
    }
  }
}
*/

export const findAllParents = (layers, id, seen = new Set([id])) => {
  let result = [];
  for (let i = 0; i < layers.length; i++) {
    if (Array.isArray(layers[i].children) && layers[i].children.includes(id) && !seen.has(layers[i].id)) {
      seen.add(layers[i].id);
      result.push(layers[i].id);
      result = result.concat(findAllParents(layers, layers[i].id, seen));
    }
  }
  return result;
}

export const findAllChildren = (layers, ids, seen = new Set()) => {
  let result = Object.assign([], ids);
  for (let i = 0; i < layers.length; i++) {
    if (ids.includes(layers[i].id) && Array.isArray(layers[i].children) && !seen.has(layers[i].id)) {
      seen.add(layers[i].id);
      result = result.concat(findAllChildren(layers, layers[i].children, seen));
    }
  }
  return result;
}