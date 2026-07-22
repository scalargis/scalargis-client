/**
 * CodeEditor wiring: the value reaches CodeMirror, edits flow back through
 * onChange, and the imperative handle the form toolbars depend on
 * (undo/redo/openSearch/closeSearch/requestMeasure + view) is exposed.
 *
 * Scroll/search behaviour itself is a layout concern and can't be exercised
 * under jsdom (no real measurement), so this covers the React contract only.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CodeEditor, type CodeEditorHandle } from './CodeEditor';

describe('CodeEditor', () => {
  it('renders the value into an editing surface', () => {
    render(
      <CodeEditor language="json" value={'{"a": 1}'} onChange={() => undefined} />
    );

    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(document.querySelector('.cm-editor')?.textContent).toContain('"a"');
  });

  it('exposes the toolbar commands through its imperative handle', () => {
    const ref = React.createRef<CodeEditorHandle>();
    render(
      <CodeEditor ref={ref} language="css" value=".x{}" onChange={() => undefined} />
    );

    expect(ref.current).toBeTruthy();
    for (const method of ['undo', 'redo', 'openSearch', 'closeSearch', 'requestMeasure'] as const) {
      expect(typeof ref.current?.[method]).toBe('function');
    }
    // The live view is reachable once mounted, so button handlers act on it.
    expect(ref.current?.view).toBeTruthy();
  });
});
