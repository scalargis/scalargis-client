import React, { useContext, useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { ActionIcon, Badge, Group, Select, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DataGrid, notify, Dialog } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';


const initialSearchParams = {
  page: 1,
  pageSize: 10,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', name: '', title: '', is_active: null, is_shared: null }
};

// ?? not ||: is_active/is_shared are booleans, and false must not collapse into ''.
const sameFilters = (a, b) =>
  Object.keys(initialSearchParams.filters).every((k) => (a?.[k] ?? '') === (b?.[k] ?? ''));


function ViewersList(props) {

  const { core } = useContext(AppContext);

  const [visible, { open: openViewers, close: closeViewers }] = useDisclosure(false);

  const [fetching, setFetching] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [records, setRecords] = useState([]);

  const [searchParams, setSearchParams] = useState({ ...initialSearchParams });
  const [filterDraft, setFilterDraft] = useState(initialSearchParams.filters);

  const API_URL = core.API_URL;

  useEffect(() => {
    if (!visible) return;

    loadData();
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible) return;
    if (sameFilters(filterDraft, searchParams.filters)) return;

    const handler = setTimeout(() => {
      setSearchParams((sp) => ({ ...sp, filters: { ...filterDraft }, page: 1 }));
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [filterDraft, searchParams.filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = () => {
      setFetching(true);

      const provider = dataProvider(API_URL + '/portal');

      const _filter = {};
      Object.entries(searchParams.filters || {}).forEach(([key, value]) => {
        // false is a real filter value; only '' and null mean "not set".
        if (value !== '' && value != null) {
          _filter[key] = value;
        }
      });

      const params = {
        pagination: { page: searchParams.page, perPage: searchParams.pageSize },
        sort: {
          field: searchParams.sortStatus.columnAccessor,
          order: searchParams.sortStatus.direction === 'desc' ? 'Desc' : 'Asc'
        },
        filter: _filter
      }

      provider.getList(`${props.elementType}/${props.id}/viewers`, params).then(d => {
        setTotalRecords(d.total);
        setRecords(d.data);
        setFetching(false);

        openViewers();
      }).catch(e => {
        setFetching(false);
        notify.error('Pesquisa de Visualizadores', 'Ocorreu um erro na pesquisa');
      });

  }

  const onHide = () => {
    closeViewers();
    setSearchParams({ ...initialSearchParams });
    setFilterDraft({ ...initialSearchParams.filters });
    setFetching(false);
    setTotalRecords(0);
    setRecords([]);
  }

  // Selects commit immediately (only text filters ride the debounce).
  const onBoolFilterChange = (key, value) => {
    const parsed = value == null ? null : value === 'true';
    const filters = { ...filterDraft, [key]: parsed };
    setFilterDraft(filters);
    setSearchParams((sp) => ({ ...sp, filters, page: 1 }));
  }

  const columns = useMemo(
    () => [
      {
        accessor: 'id',
        title: 'Id',
        sortable: true,
        width: 100,
        cellsStyle: () => ({ wordBreak: 'break-word' }),
        filter: (
          <TextInput
            label="Id"
            placeholder="Id"
            size="sm"
            value={filterDraft.id}
            onChange={(e) => setFilterDraft({ ...filterDraft, id: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.id !== ''
      },
      {
        accessor: 'name',
        title: 'Nome',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-word' }),
        filter: (
          <TextInput
            label="Nome"
            placeholder="Nome"
            size="sm"
            value={filterDraft.name}
            onChange={(e) => setFilterDraft({ ...filterDraft, name: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.name !== ''
      },
      {
        accessor: 'title',
        title: 'Título',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-word' }),
        filter: (
          <TextInput
            label="Título"
            placeholder="Título"
            size="sm"
            value={filterDraft.title}
            onChange={(e) => setFilterDraft({ ...filterDraft, title: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.title !== ''
      },
      {
        accessor: 'is_active',
        title: 'Ativo',
        width: 140,
        textAlign: 'center',
        render: (record) =>
          record.is_active === true
            ? <Badge color="success">Ativo</Badge>
            : <Badge color="danger">Inativo</Badge>,
        filter: (
          <Select
            label="Ativo"
            placeholder="Todos"
            size="sm"
            data={[{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }]}
            value={filterDraft.is_active == null ? null : String(filterDraft.is_active)}
            onChange={(value) => onBoolFilterChange('is_active', value)}
            clearable
          />
        ),
        filtering: filterDraft.is_active != null
      },
      {
        accessor: 'is_shared',
        title: 'Tipo',
        width: 150,
        textAlign: 'center',
        render: (record) =>
          record.is_shared === true
            ? <Badge color="warning">Partilha</Badge>
            : <Badge color="informative">Principal</Badge>,
        filter: (
          <Select
            label="Tipo"
            placeholder="Todos"
            size="sm"
            data={[{ value: 'false', label: 'Principal' }, { value: 'true', label: 'Partilha' }]}
            value={filterDraft.is_shared == null ? null : String(filterDraft.is_shared)}
            onChange={(value) => onBoolFilterChange('is_shared', value)}
            clearable
          />
        ),
        filtering: filterDraft.is_shared != null
      }
    ],
    [filterDraft]
  );

  return (
    <React.Fragment>
      <ActionIcon variant="outline" aria-label="Ver visualizadores" loading={fetching && !visible}
        onClick={() => loadData()}>
        <i className="pi pi-bars" />
      </ActionIcon>

      <Dialog title={props.header || ''} opened={visible} size="75vw" onClose={onHide}>
        <Group justify="space-between" wrap="wrap" className="mb-2">
          <span>Lista Visualizadores</span>
          <span>Total de registos: {totalRecords}</span>
        </Group>
        <DataGrid
          idAccessor="id"
          records={records}
          totalRecords={totalRecords}
          fetching={fetching}
          page={searchParams.page}
          onPageChange={(page) => setSearchParams((sp) => ({ ...sp, page }))}
          recordsPerPage={searchParams.pageSize}
          sortStatus={searchParams.sortStatus}
          onSortStatusChange={(sortStatus) => setSearchParams((sp) => ({ ...sp, sortStatus, page: 1 }))}
          columns={columns}
          noRecordsText="Não foram encontrados registos"
        />
      </Dialog>
    </React.Fragment>
  )
}

export default connect(state => ({}))(ViewersList);
