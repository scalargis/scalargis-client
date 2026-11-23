/** Finds the item with the given id in a tree of wizard items, or returns null. */
export function findItemById(items, id) {
  if (id == null) return null;
  const key = String(id);
  const stack = [...(items || [])];
  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    if (String(item.id) === key) return item;
    if (item.children?.length) stack.push(...item.children);
  }
  return null;
}
