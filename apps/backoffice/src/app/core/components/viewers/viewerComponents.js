import { inlineRefs } from './formViewShared';

const SIMPLE_TYPES = ['string', 'number', 'integer', 'boolean'];

/** Returns the component records of a config. */
export function componentList(config) {
  return Array.isArray(config?.components) ? config.components.filter((c) => c && typeof c === 'object') : [];
}

/** Returns a component id from a base that no record of the config uses. */
export function uniqueComponentId(config, base) {
  const used = new Set(componentList(config).map((c) => c.id));
  const stem = String(base || 'componente').toLowerCase().replace(/[^a-z0-9_]+/g, '_') || 'componente';
  if (!used.has(stem)) return stem;
  let n = 2;
  while (used.has(`${stem}_${n}`)) n += 1;
  return `${stem}_${n}`;
}

/** Returns a list of ids with one id replaced, or removed when the new id is null. */
function swapId(list, oldId, newId) {
  if (!Array.isArray(list)) return list;
  return newId === null ? list.filter((x) => x !== oldId) : list.map((x) => (x === oldId ? newId : x));
}

/** Returns the config with each reference to a component id replaced, or removed when the new id is null. */
function swapReferences(config, oldId, newId) {
  const next = { ...config };
  next.components = componentList(config).map((c) =>
    (Array.isArray(c.children) && c.children.includes(oldId) ? { ...c, children: swapId(c.children, oldId, newId) } : c));
  if (next.selected_menu === oldId) {
    if (newId === null) delete next.selected_menu;
    else next.selected_menu = newId;
  }
  const mobile = config.topbar_right?.menu_mobile;
  if (Array.isArray(mobile?.children) && mobile.children.includes(oldId)) {
    next.topbar_right = { ...config.topbar_right, menu_mobile: { ...mobile, children: swapId(mobile.children, oldId, newId) } };
  }
  return next;
}

/** Returns the config with a record put after the record afterId, or at the end. */
export function addComponent(config, record, afterId) {
  const list = componentList(config);
  const at = afterId ? list.findIndex((c) => c.id === afterId) : -1;
  const components = at < 0 ? [...list, record] : [...list.slice(0, at + 1), record, ...list.slice(at + 1)];
  return { ...config, components };
}

/** Returns the config with a record and each reference to its id removed. */
export function removeComponent(config, id) {
  const next = swapReferences(config, id, null);
  next.components = next.components.filter((c) => c.id !== id);
  return next;
}

/** Returns the config with a record moved by a step in the list, or null when it cannot move. */
export function moveComponent(config, id, step) {
  const list = [...componentList(config)];
  const at = list.findIndex((c) => c.id === id);
  const to = at + step;
  if (at < 0 || to < 0 || to >= list.length) return null;
  [list[at], list[to]] = [list[to], list[at]];
  return { ...config, components: list };
}

/** Returns the config with a record id changed, and each reference to it. */
export function renameComponent(config, oldId, newId) {
  const next = swapReferences(config, oldId, newId);
  next.components = next.components.map((c) => (c.id === oldId ? { ...c, id: newId } : c));
  return next;
}

/** Returns the JSON type name of a value, or null for no value. */
function valueType(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

/** Returns one type of a type list: the type of the value, or the first simple type. */
function pickType(types, value) {
  const list = types.filter((t) => t !== 'null');
  const actual = valueType(value);
  if (actual && list.includes(actual)) return actual;
  if (actual === 'integer' && list.includes('number')) return 'number';
  if (actual) return null;
  return list.find((t) => SIMPLE_TYPES.includes(t)) || list[0] || null;
}

/** Returns a schema node that the form can render for a value, or null when the node has no renderer. */
function formNode(node, value) {
  if (!node || typeof node !== 'object') return null;
  const out = { ...node };
  if (Array.isArray(out.type)) {
    const type = pickType(out.type, value);
    if (!type) return null;
    out.type = type;
    if (type !== 'object') delete out.additionalProperties;
  }
  if (out.type === 'object') {
    const properties = {};
    for (const [key, child] of Object.entries(out.properties || {})) {
      const next = formNode(child, value && typeof value === 'object' ? value[key] : undefined);
      if (next) properties[key] = next;
    }
    if (!Object.keys(properties).length) return null;
    out.properties = properties;
    if (Array.isArray(out.required)) out.required = out.required.filter((key) => key in properties);
    return out;
  }
  if (out.type === 'array') {
    if (!out.items || Array.isArray(out.items)) return null;
    const item = formNode(out.items, Array.isArray(value) ? value.find((v) => v !== undefined && v !== null) : undefined);
    if (!item) return null;
    out.items = item;
    return out;
  }
  if (!out.type && !out.enum && !out.oneOf) return null;
  return out;
}

/** Returns the form schema and UI schema of a component config_json, or null when no key renders. */
export function componentForm(configSchema, configJson) {
  if (!configSchema) return null;
  const copy = JSON.parse(JSON.stringify(configSchema));
  const root = inlineRefs(copy, copy.definitions || {});
  delete root.$schema;
  delete root.definitions;
  delete root.title;
  delete root.description;
  const properties = {};
  for (const [key, child] of Object.entries(root.properties || {})) {
    const next = formNode(child, configJson?.[key]);
    if (next) properties[key] = next;
  }
  const keys = Object.keys(properties);
  if (!keys.length) return null;
  const required = Array.isArray(root.required) ? root.required.filter((key) => key in properties) : [];
  return {
    schema: { type: 'object', additionalProperties: true, properties, ...(required.length ? { required } : {}) },
    uischema: { type: 'VerticalLayout', elements: keys.map((key) => ({ type: 'Control', scope: `#/properties/${key}` })) }
  };
}
