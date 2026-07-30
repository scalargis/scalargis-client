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
import { ModalsProvider } from '@mantine/modals';
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
    // ModalsProvider because the array renderers confirm a row deletion
    // through the shared confirm() recipe, which opens a managed modal.
    <MantineProvider>
      <ModalsProvider>
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
      </ModalsProvider>
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

/* The array renderers are new in this lib — the Prime twin registered no
   array control at all, and its array layout was a `TODO:` stub, so both
   shapes below used to reach the user as an error message (D16/D17). */
describe('array renderers', () => {
  const tableSchema: JsonSchema = {
    type: 'object',
    properties: {
      layers: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string' },
            visible: { type: 'boolean' },
          },
        },
      },
    },
  };
  const tableUiSchema = {
    type: 'VerticalLayout',
    elements: [control('#/properties/layers')],
  } as UISchemaElement;

  it('renders an object array as a table: a column per property, a row per item', () => {
    render(
      <Harness
        schema={tableSchema}
        uischema={tableUiSchema}
        initialData={{ layers: [{ title: 'OSM', visible: true }, { title: 'Aerial' }] }}
      />
    );

    expect(screen.getByRole('columnheader', { name: /Title/ })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /Visible/ })).toBeTruthy();
    // Header row + one row per item.
    expect(screen.getAllByRole('row')).toHaveLength(3);
    // Each cell keeps the control's label: hidden by CSS, but still the
    // input's accessible name — and each row's label points at its own input.
    const titles = screen.getAllByLabelText(/Title/);
    expect(titles).toHaveLength(2);
    expect(titles[0]).not.toBe(titles[1]);
    expect(screen.queryByText(/No applicable renderer/)).toBeNull();
  });

  it('adds a row, and removes one only after the confirmation is accepted', async () => {
    render(
      <Harness
        schema={tableSchema}
        uischema={tableUiSchema}
        initialData={{ layers: [{ title: 'OSM' }] }}
      />
    );

    // JSONForms' own default for addTooltip is "Add to <label>".
    fireEvent.click(screen.getByRole('button', { name: /Add/ }));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));

    fireEvent.click(screen.getByRole('button', { name: 'Delete 1' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));
  });

  it('renders the empty array as a message, not an empty table', () => {
    render(<Harness schema={tableSchema} uischema={tableUiSchema} initialData={{ layers: [] }} />);

    expect(screen.getByText('No data')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('renders an array with an options.detail uischema as accordion panels', () => {
    render(
      <Harness
        schema={{
          type: 'object',
          properties: {
            contacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        }}
        uischema={{
          type: 'VerticalLayout',
          elements: [
            control('#/properties/contacts', {
              detail: {
                type: 'HorizontalLayout',
                elements: [control('#/properties/name'), control('#/properties/email')],
              },
            }),
          ],
        } as UISchemaElement}
        initialData={{ contacts: [{ name: 'Ana', email: 'ana@example.pt' }] }}
      />
    );

    // The stub this replaced printed its own name on the page.
    expect(screen.queryByText(/TODO/)).toBeNull();
    // Panel titled by the item's first primitive property, holding the detail.
    expect(screen.getByRole('button', { name: 'Ana' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
  });
});

describe('categorization stepper', () => {
  const stepperUiSchema = {
    type: 'Categorization',
    options: { variant: 'stepper', showNavButtons: true },
    elements: [
      { type: 'Category', label: 'Personal', elements: [control('#/properties/name')] },
      { type: 'Category', label: 'Notes', elements: [control('#/properties/notes')] },
    ],
  } as unknown as UISchemaElement;

  const stepperSchema: JsonSchema = {
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string' }, notes: { type: 'string' } },
  };

  it('marks the step whose fields are invalid instead of completing it, and still lets Next through', async () => {
    const { container } = render(
      <Harness schema={stepperSchema} uischema={stepperUiSchema} initialData={{}} />
    );

    const next = screen.getByRole('button', { name: 'Next' });
    expect((next as HTMLButtonElement).disabled).toBe(false);

    // Walk past the step with the missing required field: Mantine would
    // otherwise tick it as completed (D26).
    fireEvent.click(next);
    await waitFor(() => expect(screen.getByLabelText('Notes')).toBeTruthy());

    const steps = container.querySelectorAll('.mantine-Stepper-step');
    // Mantine paints a step behind the active one as completed; the invalid
    // one goes danger-coloured and swaps the tick for a warning icon (which
    // rides in a Transition, hence the wait).
    expect(steps[0].getAttribute('style')).toContain('danger');
    await waitFor(() =>
      expect(steps[0].querySelector('.pi-exclamation-triangle')).toBeTruthy()
    );
    expect(steps[1].getAttribute('style') ?? '').not.toContain('danger');
  });

  it('leaves a valid step unmarked', () => {
    const { container } = render(
      <Harness
        schema={stepperSchema}
        uischema={stepperUiSchema}
        initialData={{ name: 'Ana' }}
      />
    );

    const steps = container.querySelectorAll('.mantine-Stepper-step');
    expect(steps[0].querySelector('.pi-exclamation-triangle')).toBeNull();
    expect(steps[0].getAttribute('style') ?? '').not.toContain('danger');
  });
});
