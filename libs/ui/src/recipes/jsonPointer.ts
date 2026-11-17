import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
type SyntaxNode = ReturnType<typeof syntaxTree>['topNode'];

const VALUE_NODES = new Set(['Object', 'Array', 'String', 'Number', 'True', 'False', 'Null']);

/** A text range of a JSON document. */
export interface JsonRange {
  from: number;
  to: number;
}

/** Splits a JSON pointer into its unescaped keys. */
function pointerKeys(pointer: string): string[] {
  if (!pointer) return [];
  return pointer.replace(/^\//, '').split('/').map(k => k.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** Returns the value nodes that are direct children of a node. */
function childValues(node: SyntaxNode): SyntaxNode[] {
  const out: SyntaxNode[] = [];
  for (let c = node.firstChild; c; c = c.nextSibling) if (VALUE_NODES.has(c.name)) out.push(c);
  return out;
}

/** Returns the Property node of an Object node that holds a key. */
function propertyOf(state: EditorState, node: SyntaxNode, key: string): SyntaxNode | null {
  for (let c = node.firstChild; c; c = c.nextSibling) {
    if (c.name !== 'Property') continue;
    const name = c.getChild('PropertyName');
    if (!name) continue;
    try {
      if (JSON.parse(state.sliceDoc(name.from, name.to)) === key) return c;
    } catch {
      continue;
    }
  }
  return null;
}

/** Returns the text range of the value at a JSON pointer, or of its key name with `key`, or null when the pointer is not in the text. */
export function jsonPointerRange(state: EditorState, pointer: string, options: { key?: boolean } = {}): JsonRange | null {
  const tree = ensureSyntaxTree(state, state.doc.length, 500) || syntaxTree(state);
  let node: SyntaxNode | null = tree.topNode.firstChild;
  while (node && !VALUE_NODES.has(node.name)) node = node.nextSibling;
  let nameNode: SyntaxNode | null = null;
  for (const key of pointerKeys(pointer)) {
    if (!node) return null;
    if (node.name === 'Object') {
      const prop = propertyOf(state, node, key);
      if (!prop) return null;
      nameNode = prop.getChild('PropertyName');
      node = childValues(prop)[0] || null;
    } else if (node.name === 'Array') {
      nameNode = null;
      node = childValues(node)[Number(key)] || null;
    } else {
      return null;
    }
  }
  if (options.key && nameNode) return { from: nameNode.from, to: nameNode.to };
  if (!node) return null;
  if (node.name === 'Object' || node.name === 'Array') {
    const line = state.doc.lineAt(node.from);
    return { from: node.from, to: Math.min(node.to, Math.max(line.to, node.from + 1)) };
  }
  return { from: node.from, to: node.to };
}
