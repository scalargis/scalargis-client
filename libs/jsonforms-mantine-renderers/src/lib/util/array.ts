import { useCallback } from 'react';
import startCase from 'lodash/startCase';
import {
  createDefaultValue,
  type ArrayTranslations,
  type JsonSchema,
} from '@jsonforms/core';
import { confirm } from '@scalargis/ui';

/* =====================================================================
   Shared by the two array renderers — the table control (complex/
   MantineArrayControlRenderer) and the detail layout (layouts/
   MantineArrayLayoutRenderer).

   Both are NET-NEW here, not ports: the Prime lib shipped an array
   control that was a `TODO:` stub AND left it commented out of its
   registry, so an object array has always fallen through to "No
   applicable renderer found".

   Labels come from props.translations, whose JSONForms defaults are all
   undefined — the fallbacks below are what actually shows unless the
   host app translates the keys.
   ===================================================================== */

/** Every property that can live in a table cell: nested arrays cannot.
 *  A primitive item schema has a single, unnamed column. */
export const getValidColumnProps = (itemSchema: JsonSchema): string[] => {
  const properties = itemSchema.properties;
  if (itemSchema.type === 'object' && typeof properties === 'object') {
    return Object.keys(properties).filter(
      (prop) => properties[prop].type !== 'array'
    );
  }
  return [''];
};

export const columnTitle = (itemSchema: JsonSchema, prop: string): string =>
  itemSchema.properties?.[prop]?.title ?? startCase(prop);

export const isRequiredColumn = (itemSchema: JsonSchema, prop: string): boolean =>
  (itemSchema.required ?? []).includes(prop);

/** The property a detail panel titles itself with, when the uischema does
 *  not name one: the first primitive of the item. */
export const getFirstPrimitiveProp = (
  itemSchema: JsonSchema
): string | undefined => {
  const properties = itemSchema.properties;
  if (itemSchema.type !== 'object' || typeof properties !== 'object') {
    return undefined;
  }
  return Object.keys(properties).find((prop) =>
    ['string', 'number', 'integer', 'boolean'].includes(
      properties[prop].type as string
    )
  );
};

export interface ArrayItemActionsProps {
  path: string;
  /** ArrayLayoutProps.schema is already the resolved *item* schema. */
  schema: JsonSchema;
  rootSchema: JsonSchema;
  addItem: (path: string, value: unknown) => () => void;
  removeItems?: (path: string, toDelete: number[]) => () => void;
  translations: ArrayTranslations;
}

/** Add appends a schema default; remove asks first, through the shared
 *  confirm() recipe (the same danger dialog the rest of the client uses). */
export const useArrayItemActions = ({
  path,
  schema,
  rootSchema,
  addItem,
  removeItems,
  translations,
}: ArrayItemActionsProps) => {
  const add = useCallback(
    () => addItem(path, createDefaultValue(schema, rootSchema))(),
    [addItem, path, schema, rootSchema]
  );

  const remove = useCallback(
    (index: number) => {
      confirm({
        header: translations.deleteDialogTitle ?? 'Delete',
        message:
          translations.deleteDialogMessage ??
          'Are you sure you want to delete the selected entry?',
        severity: 'danger',
        // undefined falls back to confirm()'s own localized Yes/No.
        acceptLabel: translations.deleteDialogAccept,
        rejectLabel: translations.deleteDialogDecline,
        accept: () => removeItems?.(path, [index])(),
      });
    },
    [removeItems, path, translations]
  );

  return { add, remove };
};

export const arrayTexts = (translations: ArrayTranslations) => ({
  add: translations.addTooltip ?? 'Add',
  remove: translations.removeTooltip ?? 'Delete',
  noData: translations.noDataMessage ?? 'No data',
});
