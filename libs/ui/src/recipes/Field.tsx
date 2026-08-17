/* =====================================================================
   Field — the RHF-aware wrapper every imperative form was hand-rolling.

   Every Mantine input in an imperative (non-jsonforms) form needs the same
   three things wired together: a label with its required asterisk, the
   actual Mantine control, and the validation error. Before this recipe
   each form re-derived that itself, slightly differently every time —
   Print's `useFormFields` threaded a synthetic-event field bag
   (`{ target: { id, value } }`) through four panels, ContactForm hand-rolled
   `error={(!value || value.length===0) ? requiredMessage : undefined}` per
   field in plain `useState` (`findings/02` theme 4). Both re-implemented
   "required" slightly differently, in a form library (react-hook-form)
   that already does this.

   Field is a thin composition over react-hook-form's <Controller> — NOT a
   new field-type library. It owns the label/asterisk line and the RHF
   wiring; the render-prop child decides which Mantine input plugs in
   (TextInput, Select, PasswordInput, Checkbox…) and how that input surfaces
   `fieldState.error` — different inputs show errors differently, so Field
   does not render error text itself. Schema-driven forms stay on
   jsonforms + `libs/jsonforms-mantine-renderers`; Field is for imperative
   forms that already call `useForm()` directly (B-08).
   ===================================================================== */

import React, { useId } from 'react';
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type RegisterOptions,
} from 'react-hook-form';
import { Box, Text } from '@mantine/core';

import { uiText } from './i18n';

export interface FieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  /** RHF field name — the `control`'s dot-path to this value. */
  name: TName;
  /** `control` from the owning `useForm()` (or `useFormContext()`). */
  control: Control<TFieldValues>;
  /** Label rendered above the input. Omit for a label-less field (e.g. a
   *  field already titled by a surrounding heading). */
  label?: React.ReactNode;
  /** Shows the required asterisk next to the label. When `rules` is
   *  omitted, also applies a default `{ required: <i18n message> }` rule —
   *  pass `rules` yourself for a specific message or richer validation. */
  required?: boolean;
  /** RHF validation rules. Wins over `required`'s default. */
  rules?: Omit<
    RegisterOptions<TFieldValues, TName>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  /** Passed through to <Controller> when this path isn't in the form's `defaultValues`. */
  defaultValue?: FieldPathValue<TFieldValues, TName>;
  /** Render prop: return whichever Mantine input fits. `field` carries a
   *  stable `id` (for the label's `htmlFor`) alongside the usual RHF
   *  onChange/onBlur/value/name/ref. */
  children: (
    field: ControllerRenderProps<TFieldValues, TName> & { id: string },
    fieldState: ControllerFieldState
  ) => React.ReactElement;
}

export function Field<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, label, required, rules, defaultValue, children }: FieldProps<TFieldValues, TName>) {
  const fieldId = useId();
  const resolvedRules: FieldProps<TFieldValues, TName>['rules'] =
    rules ?? (required ? { required: uiText('field.required', 'This field is required') } : undefined);

  return (
    <Controller<TFieldValues, TName>
      name={name}
      control={control}
      rules={resolvedRules}
      defaultValue={defaultValue}
      render={({ field, fieldState }) => (
        <Box>
          {label && (
            <Text component="label" htmlFor={fieldId} fz="sm" fw={500} mb={4} display="block">
              {label}
              {required && (
                <Text component="span" c="danger.6" ml={4} aria-hidden="true">
                  {' *'}
                </Text>
              )}
            </Text>
          )}
          {children({ ...field, id: fieldId }, fieldState)}
        </Box>
      )}
    />
  );
}
