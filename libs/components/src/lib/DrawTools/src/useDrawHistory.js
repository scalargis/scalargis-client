import { useCallback, useRef, useState } from 'react';

/** Keeps the drawings history. `commit` pushes an item and sets the drawings in Redux. */
export default function useDrawHistory({ initial, dispatch, actions }) {
  const history = useRef(null);
  if (history.current === null) {
    history.current = { items: [[...initial]], index: 0, key: null };
  }
  const env = useRef({ dispatch, actions });
  env.current = { dispatch, actions };
  const [, setVersion] = useState(0);

  const apply = useCallback((drawings) => {
    const { dispatch: dsp, actions: act } = env.current;
    dsp(act.viewer_set_drawings(drawings));
    setVersion(v => v + 1);
  }, []);

  const commit = useCallback((drawings, key = null) => {
    const h = history.current;
    const item = [...drawings];
    if (key !== null && key === h.key) {
      h.items[h.index] = item;
    } else {
      h.items = h.items.slice(0, h.index + 1);
      h.items.push(item);
      h.index = h.items.length - 1;
    }
    h.key = key;
    apply(drawings);
  }, [apply]);

  const undo = useCallback(() => {
    const h = history.current;
    h.key = null;
    if (h.index === 0) return false;
    h.index -= 1;
    apply([...h.items[h.index]]);
    return true;
  }, [apply]);

  const redo = useCallback(() => {
    const h = history.current;
    h.key = null;
    if (h.index + 1 >= h.items.length) return false;
    h.index += 1;
    apply([...h.items[h.index]]);
    return true;
  }, [apply]);

  const clear = useCallback(() => {
    history.current = { items: [[]], index: 0, key: null };
    apply([]);
  }, [apply]);

  const seal = useCallback(() => {
    history.current.key = null;
  }, []);

  return { commit, undo, redo, clear, seal };
}
