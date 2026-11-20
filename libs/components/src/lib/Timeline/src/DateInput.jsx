import React, { useEffect, useRef } from 'react';
import { TextInput } from '@mantine/core';

export default function DateInput({ value, onCommit, onEdit, ...props }) {
  const input = useRef(null);
  const editing = useRef(false);
  useEffect(() => {
    if (input.current && !editing.current) input.current.value = value;
  }, [value]);
  return <TextInput {...props} ref={input} defaultValue={value}
    onFocus={() => { editing.current = true; onEdit(); }}
    onBlur={event => {
      editing.current = false;
      const committed = onCommit(event.currentTarget.value);
      event.currentTarget.value = committed ?? value;
    }}
    onKeyDown={event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.currentTarget.value = value;
        event.currentTarget.blur();
      }
    }} />;
}
