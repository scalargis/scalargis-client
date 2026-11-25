import { describeViewerConfigFault } from '@scalargis/components';

export const AJV_OPTIONS = { useDefaults: false };

export const FORM_CONFIG = { formatNumber: false, showUnfocusedDescription: true };

const ARRAY_TEXTS = {
  addTooltip: 'Adicionar',
  addAriaLabel: 'Adicionar',
  removeTooltip: 'Remover',
  removeAriaLabel: 'Remover',
  upAriaLabel: 'Subir',
  downAriaLabel: 'Descer',
  noDataMessage: 'Sem itens.',
  noSelection: 'Sem seleção.',
  deleteDialogTitle: 'Remover',
  deleteDialogMessage: 'Remover este item?',
  deleteDialogAccept: 'Sim',
  deleteDialogDecline: 'Não'
};

const ENUM_TEXTS = {
  'enum.none': 'Nenhum',
  'enum.placeholder': 'Escolha uma opção',
  'oneofenum.placeholder': 'Escolha uma ou mais opções'
};

export const FORM_I18N = {
  locale: 'pt',
  translate: (key, defaultMessage, values) => {
    const error = values?.error;
    if (error?.keyword) {
      return describeViewerConfigFault({ pointer: error.instancePath, keyword: error.keyword, message: error.message, params: error.params });
    }
    const name = String(key || '');
    const enumKey = Object.keys(ENUM_TEXTS).find((k) => name === k || name.endsWith(`.${k}`));
    if (enumKey) return ENUM_TEXTS[enumKey];
    const last = name.split('.').pop();
    return ARRAY_TEXTS[last] ?? defaultMessage;
  }
};

/** Returns the listed keys of an object that it holds. */
export function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source && source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

/** Returns a schema node with each local $ref replaced by its definition. The keys next to a $ref win. */
export function inlineRefs(node, defs) {
  if (Array.isArray(node)) return node.map((item) => inlineRefs(item, defs));
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (key !== '$ref') out[key] = inlineRefs(value, defs);
  }
  const name = typeof node.$ref === 'string' ? node.$ref.replace(/^#\/definitions\//, '') : null;
  return name && defs[name] ? { ...inlineRefs(defs[name], defs), ...out } : out;
}

/** Returns a UI schema control for one key. */
export const control = (key) => ({ type: 'Control', scope: `#/properties/${key}` });

/** Returns the UI schema elements of object properties: a control for each key, and a group for an object key. */
export function objectElements(properties, scope = '#') {
  return Object.entries(properties || {}).map(([key, node]) => {
    const path = `${scope}/properties/${key}`;
    if (node?.type === 'object' && node.properties) {
      return { type: 'Group', label: node.title || key, elements: objectElements(node.properties, path) };
    }
    return { type: 'Control', scope: path };
  });
}
