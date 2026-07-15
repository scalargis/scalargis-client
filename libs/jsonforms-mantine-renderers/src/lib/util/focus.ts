import { useCallback, useState } from 'react';

/** Focus-within tracking for the description-on-focus behaviour
 *  (isDescriptionHidden) — same hook as the Prime lib. */
export const useFocus = (): [boolean, () => void, () => void] => {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  return [focused, onFocus, onBlur];
};
