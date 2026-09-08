/**
 * FileUpload contract: the standing drop area by default, and the Prime shape
 * (Choose opens the picker, no standing drop area) when showDropArea is false.
 */
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { adsBaseTheme } from '../theme/ads-mantine-theme';
import { FileUpload } from './FileUpload';

function renderUpload(ui: React.ReactElement) {
  return render(<MantineProvider theme={adsBaseTheme}>{ui}</MantineProvider>);
}

describe('FileUpload', () => {
  it('shows the drop area by default', () => {
    renderUpload(<FileUpload chooseLabel="Choose" />);
    const dropzone = document.querySelector('.ads-fileupload__dropzone') as HTMLElement;
    expect(dropzone).toBeTruthy();
    expect(dropzone.style.display).not.toBe('none');
  });

  it('hides the drop area but keeps Choose when showDropArea is false', () => {
    renderUpload(<FileUpload chooseLabel="Choose" showDropArea={false} />);
    expect(screen.getByRole('button', { name: 'Choose' })).toBeTruthy();
    const dropzone = document.querySelector('.ads-fileupload__dropzone') as HTMLElement;
    expect(dropzone.style.display).toBe('none');
  });
});
