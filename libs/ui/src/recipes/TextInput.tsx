import { useEffect, useRef, useState } from 'react';
import { TextInput as TextInputBase , TextInputProps as TextInputBaseProps } from '@mantine/core';

export interface TextInputProps
  extends Omit<TextInputBaseProps, 'value' | 'defaultValue' | 'onChange'> {
  /** Last committed value (controlled from outside) */
  value?: string | number | null;
  /** Called with the typed text, only if it changed */
  onCommit: (value: string) => void;
   /**
   * If true, commits on every text change (in addition to Enter and blur).
   * If false (default), commits only on Enter or when the field loses focus.
   */
  commitOnChange?: boolean;
  /**
   * Restricts the entered text to numbers.
   * 'integer' only accepts digits; 'decimal' also accepts a separator (. or ,).
   */
  numeric?: 'integer' | 'decimal';
  /** Allows a leading '-' sign (only with numeric). */
  allowNegative?: boolean;
}

const toStr = (v: string | number | null | undefined) => (v == null ? '' : String(v));

const PATTERNS = {
  integer: /^\d*$/,
  decimal: /^\d*[.,]?\d*$/,
};

function isAllowed(text: string, numeric?: 'integer' | 'decimal', allowNegative?: boolean) {
  if (!numeric) return true;
  const body = allowNegative && text.startsWith('-') ? text.slice(1) : text;
  return PATTERNS[numeric].test(body);
}

export function TextInput({
  value,
  onCommit,
  commitOnChange = false,
  numeric,
  allowNegative,
  onBlur,
  onKeyDown,
  ...rest
}: TextInputProps) {
  const external = toStr(value);
  const [draft, setDraft] = useState(external);
  const lastCommitted = useRef(external);

  // Syncs when the external value changes
  useEffect(() => {
    setDraft(external);
    lastCommitted.current = external;
  }, [external]);

  const commit = (text: string) => {
    if (text === lastCommitted.current) return; // avoids redundant commits
    lastCommitted.current = text;
    onCommit(text);
  };

  return (
    <TextInputBase
      {...rest}
      inputMode={numeric === 'integer' ? 'numeric' : numeric ? 'decimal' : rest.inputMode}
      value={draft}
      onChange={(e) => {
        const text = e.currentTarget.value;
        if (!isAllowed(text, numeric, allowNegative)) return; // ignore invalid characters
        setDraft(text);
        if (commitOnChange) commit(text);
      }}
      onBlur={(e) => {
        commit(draft);
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(draft);
        onKeyDown?.(e);
      }}
    />
  );
}