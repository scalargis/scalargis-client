/**
 * Field contract: label associated to the input via a real htmlFor/id pair,
 * the required asterisk, and the error coming from RHF's `fieldState` — not
 * a hand-rolled useState idiom re-derived per field.
 */
import React from 'react';
import { MantineProvider, TextInput } from '@mantine/core';
import { useForm } from 'react-hook-form';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { Field } from './Field';

interface HarnessValues {
  email: string;
}

function Harness({
  required = false,
  noLabel = false,
  onSubmit = () => undefined,
}: {
  required?: boolean;
  noLabel?: boolean;
  onSubmit?: (data: HarnessValues) => void;
}) {
  const { control, handleSubmit } = useForm<HarnessValues>({ defaultValues: { email: '' } });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Field<HarnessValues> name="email" control={control} label={noLabel ? undefined : 'Email'} required={required}>
        {(field, fieldState) => <TextInput {...field} error={fieldState.error?.message} />}
      </Field>
      <button type="submit">Submit</button>
    </form>
  );
}

function renderField(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

describe('Field', () => {
  it('associates the label to the input via a real htmlFor/id pair', () => {
    renderField(<Harness />);
    const input = screen.getByLabelText('Email');
    expect(input.tagName).toBe('INPUT');
  });

  it('shows the required asterisk only when required', () => {
    const { unmount } = renderField(<Harness />);
    expect(screen.queryByText('*')).toBeNull();
    unmount();

    renderField(<Harness required />);
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('surfaces the default required error through fieldState on submit, not local state', async () => {
    renderField(<Harness required />);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    const error = await screen.findByText('This field is required');
    expect(error).toBeTruthy();
  });

  it('wires typed input back into the form value on submit', async () => {
    const onSubmit = vi.fn();
    renderField(<Harness onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // RHF's handleSubmit resolves on a later microtask, so await the call.
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com' }),
        expect.anything()
      )
    );
  });

  it('renders no label element when label is omitted', () => {
    renderField(<Harness noLabel />);
    expect(screen.queryByText('Email')).toBeNull();
    // The input itself still renders — Field degrades to a plain Controller wrapper.
    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
