import { useEffect, useRef } from 'react';

/** Runs the load of a type step once when the wizard opens it with a URL to load. */
export function useServiceAutoLoad(data, type, load) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const pending = data?.dataType === type && !!data?.url;
  useEffect(() => {
    if (pending) loadRef.current();
  }, [pending]);
}
