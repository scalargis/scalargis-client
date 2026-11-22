import React, { useEffect, useState } from 'react';
import { TextInput as TextInputBase , TextInputProps as TextInputBaseProps } from '@mantine/core';


export interface TextInputProps
  extends Omit<TextInputBaseProps, 'value' | 'defaultValue' | 'onChange'> {
  /** Last committed value (controlled from outside) */
  value?: string | number | null;
  /** Called with the typed text on blur or Enter, only if it changed */
  onCommit: (value: string) => void;
}


/**
 * TextInput that keeps the value locally while typing
 * and only propagates the change when finished (blur or Enter).
 * Escape restores the last committed value.
 */
export function TextInput({ value, onCommit, ...rest }: TextInputProps) {
  const external = value == null ? '' : String(value);
  const [local, setLocal] = useState<string>(external);

  useEffect(() => {
    setLocal(external);
  }, [external]);

  const commit = () => {
    if (local !== external) onCommit(local);
  };

  return (
    <TextInputBase
      {...rest}
      value={local}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocal(e.currentTarget.value)}
      onBlur={commit}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          setLocal(external);
        }
      }}
    />
  );
}