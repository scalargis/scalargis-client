import { createAjv } from '@jsonforms/core';
import type { JsonSchema } from '@jsonforms/core';
import type { ErrorObject, ValidateFunction } from 'ajv';
import schema from './viewer.schema.json';
import { coreComponentSchemas } from './coreComponentSchemas';

export { coreComponentSchemas };

/** A schema fault at one JSON pointer of the viewer config. */
export interface ViewerConfigFault {
  pointer: string;
  keyword: string;
  message: string;
  params: Record<string, unknown>;
}

/** The result of one viewer config validation. */
export interface ViewerConfigValidation {
  valid: boolean;
  faults: ViewerConfigFault[];
}

export const viewerConfigSchema = schema as unknown as JsonSchema;

const ajv = createAjv({ allErrors: true });
const validators = new WeakMap<object, ValidateFunction>();

/** Returns the viewer schema with each component schema, by default the core ones, put under the config_json of its type. */
export function getViewerConfigSchema(componentSchemas: Record<string, JsonSchema> = coreComponentSchemas): JsonSchema {
  const merged = JSON.parse(JSON.stringify(viewerConfigSchema));
  const types = Object.keys(componentSchemas);
  if (!types.length) return merged;
  merged.definitions.component.allOf = types.map(type => ({
    if: { properties: { type: { const: type } }, required: ['type'] },
    then: { properties: { config_json: withoutSchemaKeyword(componentSchemas[type]) } }
  }));
  return merged;
}

/** Returns a copy of a component schema without its root $schema keyword. */
function withoutSchemaKeyword(componentSchema: JsonSchema): JsonSchema {
  const copy = JSON.parse(JSON.stringify(componentSchema));
  delete copy.$schema;
  return copy;
}

let fullSchema: JsonSchema | undefined;

/** Returns the viewer schema with the core component schemas, built once. */
function getFullSchema(): JsonSchema {
  if (!fullSchema) fullSchema = getViewerConfigSchema();
  return fullSchema;
}

/** Returns the compiled validator of a schema, compiled once. */
function getValidator(target: JsonSchema): ValidateFunction {
  let validate = validators.get(target);
  if (!validate) {
    validate = ajv.compile(target);
    validators.set(target, validate);
  }
  return validate;
}

/** Maps one ajv error to a fault. */
function toFault(error: ErrorObject): ViewerConfigFault {
  return {
    pointer: error.instancePath,
    keyword: error.keyword,
    message: error.message || error.keyword,
    params: error.params as Record<string, unknown>
  };
}

/** Validates a viewer config against the viewer schema with the core component schemas, or the given one, and lists every fault. */
export function validateViewerConfig(config: unknown, target?: JsonSchema): ViewerConfigValidation {
  const validate = getValidator(target || getFullSchema());
  const valid = validate(config) as boolean;
  const faults = (validate.errors || []).filter(e => e.keyword !== 'if').map(toFault);
  return { valid, faults };
}

/** A key of the viewer config that its schema does not name. */
export interface ViewerConfigUnknownKey {
  pointer: string;
  key: string;
}

type SchemaNode = Record<string, any>;

/** Returns the schema that a $ref of the given root points to, or the schema itself. */
function resolveRef(node: SchemaNode | undefined, root: SchemaNode): SchemaNode | undefined {
  let current = node;
  for (let i = 0; current && typeof current.$ref === 'string' && i < 20; i++) {
    current = current.$ref.replace(/^#\/?/, '').split('/').filter(Boolean)
      .reduce((s: SchemaNode | undefined, part: string) => s?.[part], root);
  }
  return current;
}

/** Escapes one key for a JSON pointer. */
function pointerPart(key: string): string {
  return key.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** Lists each key of a viewer config that the viewer schema or the schema of its component type does not name. */
export function findUnknownKeys(config: unknown, componentSchemas: Record<string, JsonSchema> = coreComponentSchemas): ViewerConfigUnknownKey[] {
  const root = viewerConfigSchema as SchemaNode;
  const componentNode = root['definitions']?.component;
  const out: ViewerConfigUnknownKey[] = [];
  const walk = (value: unknown, node: SchemaNode | undefined, base: SchemaNode, pointer: string) => {
    const schema = resolveRef(node, base);
    if (!schema || value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      if (schema['items'] && !Array.isArray(schema['items'])) {
        value.forEach((item, i) => walk(item, schema['items'], base, `${pointer}/${i}`));
      }
      return;
    }
    const props = schema['properties'];
    if (!props || !Object.keys(props).length) return;
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const child = `${pointer}/${pointerPart(key)}`;
      if (!(key in props)) {
        out.push({ pointer: child, key });
      } else if (schema === componentNode && key === 'config_json' && typeof record['type'] === 'string' && componentSchemas[record['type']]) {
        const own = componentSchemas[record['type']] as SchemaNode;
        walk(record[key], own, own, child);
      } else {
        walk(record[key], props[key], base, child);
      }
    }
  };
  walk(config, root, root, '');
  return out;
}

const TYPE_NAMES: Record<string, string> = {
  array: 'uma lista',
  object: 'um objeto',
  string: 'um texto',
  number: 'um número',
  integer: 'um número inteiro',
  boolean: 'true ou false',
  null: 'null'
};

/** Returns the Portuguese text of one schema fault. */
export function describeViewerConfigFault(fault: ViewerConfigFault): string {
  const p = fault.params as Record<string, any>;
  switch (fault.keyword) {
    case 'type': {
      const types = (Array.isArray(p['type']) ? p['type'] : String(p['type']).split(',')) as string[];
      return `O valor deve ser ${types.map(t => TYPE_NAMES[t] || t).join(' ou ')}.`;
    }
    case 'required':
      return `Falta a chave obrigatória "${p['missingProperty']}".`;
    case 'enum':
      return `O valor deve ser um destes: ${(p['allowedValues'] || []).join(', ')}.`;
    case 'const':
      return `O valor deve ser ${JSON.stringify(p['allowedValue'])}.`;
    case 'minItems':
      return `A lista deve ter pelo menos ${p['limit']} elementos.`;
    case 'maxItems':
      return `A lista deve ter no máximo ${p['limit']} elementos.`;
    case 'minimum':
      return `O valor deve ser ${p['comparison']} ${p['limit']}.`;
    case 'maximum':
      return `O valor deve ser ${p['comparison']} ${p['limit']}.`;
    case 'anyOf':
    case 'oneOf':
      return 'O valor não tem nenhuma das formas aceites.';
    default:
      return fault.message;
  }
}
