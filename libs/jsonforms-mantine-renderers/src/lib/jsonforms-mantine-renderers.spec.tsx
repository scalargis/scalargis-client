/* =====================================================================
   Smoke suite for the registered renderer set — deliberately lean (the
   visual/parity net is the /demo-ext/jsonforms-mantine twin page, run
   manually per the migration1 baseline procedure). What is locked here
   is only what a page can't show at a glance: tester dispatch for every
   control shape, the data contract ('' → undefined, empty array →
   undefined), the error/a11y wiring, and the clear-on-hide rule.
   ===================================================================== */

import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { JsonForms } from '@jsonforms/react';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { mantineCells, mantineRenderers } from './jsonforms-mantine-renderers';

interface HarnessProps {
  schema: JsonSchema;
  uischema?: UISchemaElement;
  initialData?: Record<string, unknown>;
  onData?: (data: Record<string, unknown>) => void;
}

function Harness({ schema, uischema, initialData = {}, onData }: HarnessProps) {
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  return (
    <MantineProvider>
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={data}
        renderers={mantineRenderers}
        cells={mantineCells}
        validationMode="ValidateAndShow"
        onChange={({ data: next }) => {
          setData(next);
          onData?.(next);
        }}
      />
    </MantineProvider>
  );
}

const control = (scope: string, options?: Record<string, unknown>): UISchemaElement =>
  ({ type: 'Control', scope, ...(options ? { options } : {}) } as UISchemaElement);

describe('mantineRenderers registry dispatch', () => {
  it('renders every basic control shape with an associated label', () => {
    render(
      <Harness
        schema={{
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            price: { type: 'number' },
            active: { type: 'boolean' },
            enabled: { type: 'boolean' },
            birth: { type: 'string', format: 'date' },
            start: { type: 'string', format: 'time' },
            when: { type: 'string', format: 'date-time' },
            rating: { type: 'number', minimum: 0, maximum: 10, default: 5 },
          },
        }}
        uischema={{
          type: 'VerticalLayout',
          elements: [
            control('#/properties/name'),
            control('#/properties/age'),
            control('#/properties/price'),
            control('#/properties/active'),
            control('#/properties/enabled', { toggle: true }),
            control('#/properties/birth'),
            control('#/properties/start'),
            control('#/properties/when'),
            control('#/properties/rating', { slider: true }),
          ],
        } as UISchemaElement}
      />
    );

    // Text, integer, number, date, time: labelled inputs.
    for (const label of ['Name', 'Age', 'Price', 'Birth', 'Start']) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    // Booleans: checkbox and switch roles with their labels.
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Enabled' })).toBeTruthy();
    // Date-time renders a picker button; slider a slider thumb.
    expect(screen.getByText('When')).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'Rating' })).toBeTruthy();
  });

  it('dispatches enum shapes: select, radio, checkbox array, multiselect array', () => {
    render(
      <Harness
        schema={{
          type: 'object',
          properties: {
            country: { type: 'string', enum: ['Portugal', 'Spain'] },
            priority: { type: 'string', enum: ['Low', 'High'] },
            status: {
              type: 'string',
              oneOf: [
                { const: 'draft', title: 'Draft' },
                { const: 'ok', title: 'Approved' },
              ],
            },
            tags: {
              type: 'array',
              uniqueItems: true,
              items: { type: 'string', enum: ['Urban', 'Rural'] },
            },
            features: {
              type: 'array',
              uniqueItems: true,
              items: { type: 'string', enum: ['Pool', 'Garage'] },
            },
          },
        }}
        uischema={{
          type: 'VerticalLayout',
          elements: [
            control('#/properties/country'),
            control('#/properties/priority', { format: 'radio' }),
            control('#/properties/status'),
            control('#/properties/tags'),
            control('#/properties/features', { format: 'dropdown' }),
          ],
        } as UISchemaElement}
      />
    );

    // Select/MultiSelect label queries are ambiguous by construction (the
    // dropdown listbox shares the label's aria-labelledby), so assert the
    // labelled input elements through their deterministic JSONForms ids.
    for (const field of ['country', 'status', 'features']) {
      const input = document.getElementById(`#/properties/${field}-input`);
      expect(input?.tagName).toBe('INPUT');
    }
    expect(screen.getByRole('radiogroup', { name: /Priority/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Low' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Urban' })).toBeTruthy();
  });

  it('round-trips text input and stores undefined for empty strings', async () => {
    let latest: Record<string, unknown> = {};
    render(
      <Harness
        schema={{ type: 'object', properties: { name: { type: 'string' } } }}
        onData={(d) => (latest = d)}
      />
    );

    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'Lisboa' } });
    await waitFor(() => expect(latest.name).toBe('Lisboa'));

    fireEvent.change(input, { target: { value: '' } });
    await waitFor(() => expect(latest.name).toBeUndefined());
  });

  it('checkbox-array toggling appends values and empties to undefined', async () => {
    let latest: Record<string, unknown> = {};
    render(
      <Harness
        schema={{
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              uniqueItems: true,
              items: { type: 'string', enum: ['Urban', 'Rural'] },
            },
          },
        }}
        onData={(d) => (latest = d)}
      />
    );

    const urban = screen.getByRole('checkbox', { name: 'Urban' });
    fireEvent.click(urban);
    await waitFor(() => expect(latest.tags).toEqual(['Urban']));

    fireEvent.click(urban);
    await waitFor(() => expect(latest.tags).toBeUndefined());
  });

  it('shows the validation error next to the field and marks it aria-invalid', async () => {
    render(
      <Harness
        schema={{
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string', minLength: 2 } },
        }}
        initialData={{ name: 'x' }}
      />
    );

    const input = screen.getByLabelText(/Name/);
    await waitFor(() => {
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(screen.getByText(/must NOT have fewer than 2 characters/)).toBeTruthy();
    });
    // Required is announced regardless of the visual asterisk option.
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('clears the value when a rule hides the control (ScalarGIS deviation)', async () => {
    let latest: Record<string, unknown> = {};
    render(
      <Harness
        schema={{
          type: 'object',
          properties: {
            show: { type: 'boolean' },
            details: { type: 'string' },
          },
        }}
        uischema={{
          type: 'VerticalLayout',
          elements: [
            control('#/properties/show'),
            {
              ...control('#/properties/details'),
              rule: {
                effect: 'SHOW',
                condition: {
                  scope: '#/properties/show',
                  schema: { const: true },
                },
              },
            },
          ],
        } as UISchemaElement}
        initialData={{ show: true, details: 'keep me?' }}
        onData={(d) => (latest = d)}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show' }));
    await waitFor(() => expect(latest.details).toBeUndefined());
  });

  it('renders layouts: categorization tabs switch panels, group renders a fieldset legend', async () => {
    render(
      <Harness
        schema={{
          type: 'object',
          properties: { a: { type: 'string' }, b: { type: 'string' } },
        }}
        uischema={{
          type: 'Categorization',
          elements: [
            {
              type: 'Category',
              label: 'First',
              elements: [
                {
                  type: 'Group',
                  label: 'Group A',
                  elements: [control('#/properties/a')],
                },
              ],
            },
            { type: 'Category', label: 'Second', elements: [control('#/properties/b')] },
          ],
        } as unknown as UISchemaElement}
      />
    );

    expect(screen.getByRole('tab', { name: 'First' })).toBeTruthy();
    expect(screen.getByText('Group A')).toBeTruthy();
    expect(screen.getByLabelText('A')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Second' }));
    await waitFor(() => expect(screen.getByLabelText('B')).toBeTruthy());
  });

  it('multi option renders a textarea (documented Prime-lib gap, fixed here)', () => {
    render(
      <Harness
        schema={{ type: 'object', properties: { notes: { type: 'string' } } }}
        uischema={{
          type: 'VerticalLayout',
          elements: [control('#/properties/notes', { multi: true })],
        } as UISchemaElement}
      />
    );

    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
  });
});
