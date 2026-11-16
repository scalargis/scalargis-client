import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

const NEW_RECORD = { status: 'ready', record: {}, error: null };
const LOADING = { status: 'loading', record: null, error: null };

/** Loads the record of one key with status loading, ready, or failed; no key is a new record, and only the newest load writes. */
export default function useRecord(key, fetchRecord) {
  const [state, setState] = useState(() => (key ? LOADING : NEW_RECORD));
  const latest = useRef(fetchRecord);
  latest.current = fetchRecord;
  const request = useRef(0);

  const load = useCallback(() => {
    const id = ++request.current;
    if (!key) {
      setState(NEW_RECORD);
      return;
    }
    setState(LOADING);
    Promise.resolve()
      .then(() => latest.current(key))
      .then((record) => {
        if (id !== request.current) return;
        setState(record ? { status: 'ready', record, error: null } : { status: 'failed', record: null, error: { status: 404 } });
      })
      .catch((error) => {
        if (id !== request.current) return;
        setState({ status: 'failed', record: null, error: error || {} });
      });
  }, [key]);

  useEffect(() => {
    load();
    return () => { request.current++; };
  }, [load]);

  return { ...state, reload: load };
}

/** Voltar to the list that opened the record, or to the list at basePath, and the move to the edit URL after a create. */
export function useRecordNavigation(basePath) {
  const location = useLocation();
  const navigate = useNavigate();

  const goBack = () => {
    const from = location.state?.from;
    if (!from) {
      navigate(`${basePath}/list`);
      return;
    }
    const previous = location.state.previousSearchParams;
    navigate(from, previous ? { state: { searchParams: { ...previous } } } : undefined);
  };

  const openCreated = (id) => {
    navigate(`${basePath}/edit/${id}`, { replace: true, state: location.state });
  };

  return { goBack, openCreated };
}
