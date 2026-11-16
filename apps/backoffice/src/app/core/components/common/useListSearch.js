import { useCallback, useEffect, useRef, useState } from 'react';
import { notify } from '@scalargis/ui';

/** Keeps the filters that hold a value; false is a value, '' and null are not. */
export const activeFilters = (filters) =>
  Object.fromEntries(Object.entries(filters || {}).filter(([, value]) => value !== '' && value != null));

const sameFilters = (keys, a, b) => keys.every((k) => (a?.[k] ?? '') === (b?.[k] ?? ''));

/** Search, debounce, records, and load of a backoffice list; only the newest load writes. */
export default function useListSearch({
  initialSearchParams,
  restoredSearchParams,
  fetchList,
  toFilter = activeFilters,
  errorTitle,
  enabled = true,
  debounceFilters = true
}) {
  const [searchParams, setSearchParams] = useState(() =>
    restoredSearchParams ? { ...restoredSearchParams } : { ...initialSearchParams }
  );
  const [filterDraft, setFilterDraft] = useState(searchParams.filters);
  const [fetching, setFetching] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);

  const latest = useRef(null);
  latest.current = { searchParams, fetchList, toFilter, errorTitle };
  const request = useRef(0);

  const reload = useCallback(() => {
    const { searchParams: sp, fetchList: fetch, toFilter: filter, errorTitle: title } = latest.current;
    const id = ++request.current;
    setFetching(true);
    return fetch({
      pagination: { page: sp.page, perPage: sp.pageSize },
      sort: {
        field: sp.sortStatus.columnAccessor,
        order: sp.sortStatus.direction === 'desc' ? 'Desc' : 'Asc'
      },
      filter: filter(sp.filters)
    }).then((d) => {
      if (id !== request.current) return null;
      setSelectedRecords([]);
      setRecords(d.data);
      setTotalRecords(d.total);
      setFetching(false);
      return d;
    }).catch(() => {
      if (id !== request.current) return null;
      setFetching(false);
      notify.error(title, 'Ocorreu um erro na pesquisa');
      return null;
    });
  }, []);

  const currentSearchParams = useCallback(() => ({ ...latest.current.searchParams }), []);

  useEffect(() => {
    if (enabled) reload();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || !debounceFilters) return;
    if (sameFilters(Object.keys(initialSearchParams.filters), filterDraft, searchParams.filters)) return;
    const handler = setTimeout(() => {
      setSearchParams((sp) => ({ ...sp, filters: { ...filterDraft }, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [filterDraft, searchParams.filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitFilters = (filters) => {
    setFilterDraft(filters);
    setSearchParams((sp) => ({ ...sp, filters, page: 1 }));
  };

  const clearFilters = () => {
    setFilterDraft({ ...initialSearchParams.filters });
    setSearchParams({ ...initialSearchParams });
  };

  const reset = () => {
    request.current++;
    clearFilters();
    setFetching(false);
    setRecords([]);
    setTotalRecords(0);
    setSelectedRecords([]);
  };

  const gridProps = {
    records,
    totalRecords,
    fetching,
    page: searchParams.page,
    onPageChange: (page) => setSearchParams((sp) => ({ ...sp, page })),
    recordsPerPage: searchParams.pageSize,
    sortStatus: searchParams.sortStatus,
    onSortStatusChange: (sortStatus) => setSearchParams((sp) => ({ ...sp, sortStatus, page: 1 })),
    selectedRecords,
    onSelectedRecordsChange: setSelectedRecords
  };

  return {
    searchParams,
    setSearchParams,
    filterDraft,
    setFilterDraft,
    commitFilters,
    clearFilters,
    reset,
    records,
    totalRecords,
    selectedRecords,
    reload,
    currentSearchParams,
    gridProps
  };
}
