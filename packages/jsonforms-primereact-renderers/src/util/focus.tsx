import { useState, useCallback } from 'react';

export const useFocus = (): [boolean, () => void, () => void] => {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  return [focused, onFocus, onBlur];
};