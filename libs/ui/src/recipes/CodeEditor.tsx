/* =====================================================================
   CodeEditor — the single CodeMirror 6 code editor for the Mantine stack.

   CodeMirror 6 is the one code editor from Phase 2 onward. Every backoffice form was repeating the same explicit
   extension list, the same `basicSetup={false}` wiring and the same
   `ref.current.view` dance for undo/redo/search — four copies drifting
   apart. This recipe owns all of it in one place.

   Why explicit extensions instead of CodeMirror's `basicSetup`: basicSetup
   is an opaque bundle, so an editor silently gains or loses features on a
   version bump. Listing the extensions makes the enabled feature set part
   of this file's contract — change it here, every editor changes with it.

   Scrolling: callers pass a bounded height (`height` for a fixed box, or
   `maxHeight` to grow-then-scroll). A bounded editor owns its own scroller,
   which is what makes search's scrollIntoView land on the match. An
   unbounded (`height:auto`) editor has no scroller and must scroll some
   ancestor — that is the configuration where "search doesn't jump to a
   match near the bottom" comes from, so it is not offered here.

   The imperative handle exposes the CodeMirror commands the toolbars need
   (undo/redo/openSearch/closeSearch) plus the `view`, so callers never
   reach through `ref.current.view` themselves.
   ===================================================================== */

import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';
import { undo, redo, history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import {
  openSearchPanel,
  closeSearchPanel,
  search,
  searchKeymap,
} from '@codemirror/search';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
} from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { keymap, lineNumbers, type EditorView } from '@codemirror/view';
import {
  EditorState,
  StateEffect,
  type Extension,
  type SelectionRange,
} from '@codemirror/state';

export type CodeEditorLanguage = 'json' | 'css';

/**
 * Search-scroll fix. Two problems with CodeMirror's default search scrolling in
 * these editors, both reproduced against the backoffice config editor:
 *
 *  1. findNext/findPrevious dispatch the selection move AND the scroll in one
 *     transaction; for a match far outside the rendered viewport that lands at
 *     the document end instead of the match ("goes to some but not all"). So we
 *     return a no-op effect from `scrollToMatch` (the search transaction itself
 *     does NOT scroll) and do the scroll on a later frame, once the selection
 *     change has rendered the target line.
 *  2. `EditorView.scrollIntoView` walks up and scrolls *ancestor* scrollers too,
 *     so centering a near-bottom match moved the whole page. So we scroll the
 *     editor's OWN scroller directly (never an ancestor) — the page scroll is
 *     left untouched — using nearest-style behaviour (only move when the match
 *     is outside the visible band).
 *
 * See delete_after_use/codemirror-search-scroll-bug.md.
 */
const noScrollEffect = StateEffect.define<null>();
const SCROLL_MARGIN = 40;

function deferredScrollToMatch(range: SelectionRange, view: EditorView) {
  // Two frames: the first lets CodeMirror render the moved selection so the
  // target line's geometry is real before we position it.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!view.dom.isConnected) return;
      const scroller = view.scrollDOM;
      const block = view.lineBlockAt(range.head);
      const viewTop = scroller.scrollTop;
      const viewBottom = viewTop + scroller.clientHeight;
      if (block.top < viewTop + SCROLL_MARGIN) {
        scroller.scrollTop = Math.max(0, block.top - SCROLL_MARGIN);
      } else if (block.bottom > viewBottom - SCROLL_MARGIN) {
        scroller.scrollTop = block.bottom - scroller.clientHeight + SCROLL_MARGIN;
      }
    })
  );
  return noScrollEffect.of(null);
}

/** Imperative surface for form toolbars (undo/redo/search buttons). */
export interface CodeEditorHandle {
  /** The live CodeMirror view, or undefined before the first mount. */
  readonly view: EditorView | undefined;
  undo(): void;
  redo(): void;
  openSearch(): void;
  closeSearch(): void;
  /** Force an immediate re-measure (e.g. right after a tab reveals the editor). */
  requestMeasure(): void;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeEditorLanguage;
  /** Fixed height (px, calc, …). The editor scrolls internally past it. */
  height?: string;
  /** Grow with content, scroll once this is reached. Pair with `minHeight`. */
  maxHeight?: string;
  minHeight?: string;
  readOnly?: boolean;
  /** Accessible name for the editing surface. */
  'aria-label'?: string;
}

const languageExtension: Record<CodeEditorLanguage, () => Extension> = { json, css };

/**
 * Everything not language-specific: line numbers, undo history, the search
 * panel, syntax highlighting, bracket matching, code folding, autocompletion,
 * a two-space tab, and the default/history/search key bindings (so Ctrl+F,
 * Ctrl+Z etc. work). Rebuilt only when the language changes.
 */
function buildExtensions(language: CodeEditorLanguage): Extension[] {
  return [
    languageExtension[language](),
    lineNumbers(),
    history(),
    search({ scrollToMatch: deferredScrollToMatch }),
    syntaxHighlighting(defaultHighlightStyle),
    bracketMatching(),
    foldGutter(),
    autocompletion(),
    EditorState.tabSize.of(2),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
  ];
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor(
    { value, onChange, language, height, maxHeight, minHeight, readOnly, ...rest },
    ref
  ) {
    const cmRef = useRef<ReactCodeMirrorRef>(null);

    const extensions = useMemo(() => buildExtensions(language), [language]);

    useImperativeHandle(
      ref,
      () => ({
        get view() {
          return cmRef.current?.view;
        },
        undo() {
          const view = cmRef.current?.view;
          if (view) undo(view);
        },
        redo() {
          const view = cmRef.current?.view;
          if (view) redo(view);
        },
        openSearch() {
          const view = cmRef.current?.view;
          if (view) openSearchPanel(view);
        },
        closeSearch() {
          const view = cmRef.current?.view;
          if (view) closeSearchPanel(view);
        },
        requestMeasure() {
          cmRef.current?.view?.requestMeasure();
        },
      }),
      []
    );

    return (
      <CodeMirror
        ref={cmRef}
        value={value || ''}
        onChange={onChange}
        extensions={extensions}
        height={height}
        maxHeight={maxHeight}
        minHeight={minHeight}
        readOnly={readOnly}
        theme="light"
        basicSetup={false}
        {...rest}
      />
    );
  }
);
