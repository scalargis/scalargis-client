const IGNORED_KEYS = new Set(['updated_at', 'created_at']);

const ID_LIST_KEYS = new Set(['roles', 'prints', 'print_groups', 'groups']);

const toLayouts = (value) => (Array.isArray(value)
  ? value.map((item) => ({ format: item?.format, orientation: item?.orientation, config: item?.config }))
  : value);

const toIds = (value) => (Array.isArray(value) ? value.map((item) => (item && typeof item === 'object' ? item.id : item)) : value);

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const isEmpty = (value) => value === null || value === undefined || value === '';

const isPrimitive = (value) => value === null || typeof value !== 'object';

/** Parses a text that holds a JSON object or array, and returns any other value as it is. */
export function parseJsonText(value) {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!(text.startsWith('{') || text.startsWith('['))) return value;
  try {
    return JSON.parse(text);
  } catch (e) {
    return value;
  }
}

function sameValue(a, b) {
  if (a === b) return true;
  if (isEmpty(a) && isEmpty(b)) return true;
  if ((typeof a === 'number' || typeof b === 'number') && !isEmpty(a) && !isEmpty(b)) return String(a) === String(b);
  return false;
}

function walk(a, b, path, out) {
  const left = parseJsonText(a);
  const right = parseJsonText(b);
  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
    keys.forEach((key) => walk(left[key], right[key], path ? `${path}.${key}` : key, out));
    return;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.every(isPrimitive) && right.every(isPrimitive)) {
      if (JSON.stringify(left) !== JSON.stringify(right)) out.push({ path, before: left, after: right });
      return;
    }
    const length = Math.max(left.length, right.length);
    for (let i = 0; i < length; i++) walk(left[i], right[i], `${path}[${i}]`, out);
    return;
  }
  if (!sameValue(left, right)) out.push({ path, before: left, after: right });
}

/** Returns the changed paths of the keys that a payload sends, as { path, before, after }. */
export function diffRecords(before, after) {
  const out = [];
  Object.keys(after || {})
    .filter((key) => !IGNORED_KEYS.has(key))
    .forEach((key) => {
      const left = (before || {})[key];
      const right = after[key];
      if (ID_LIST_KEYS.has(key)) walk(toIds(left), toIds(right), key, out);
      else if (key === 'layouts') walk(toLayouts(left), toLayouts(right), key, out);
      else walk(left, right, key, out);
    });
  return out;
}

/** Returns the top-level field of a change path. */
export function fieldOf(path) {
  return path.split(/[.[]/)[0];
}

/** Returns the text of a value for the change list. */
export function formatValue(value, max = 160) {
  if (isEmpty(value)) return '—';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

/** Returns the text of a field for the side-by-side view. */
export function fieldText(value) {
  const parsed = parseJsonText(value);
  if (isEmpty(parsed)) return '';
  if (typeof parsed === 'string') return parsed;
  return JSON.stringify(parsed, null, 2);
}

/** True when a field is a JSON value or a text of more than one line, so the side-by-side view shows it. */
export function isLongField(before, after) {
  return [before, after].some((value) => {
    const parsed = parseJsonText(value);
    return (parsed !== null && typeof parsed === 'object') || (typeof parsed === 'string' && parsed.includes('\n'));
  });
}
