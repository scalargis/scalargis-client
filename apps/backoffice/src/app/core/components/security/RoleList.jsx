import React, { useContext, useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Button, Group, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify, IconPencil, IconTrash, IconPlus, IconX } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import PageSection from '../common/PageSection';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', name: '', description: '' }
};

const sameFilters = (a, b) =>
  Object.keys(initialSearchParams.filters).every((k) => (a?.[k] || '') === (b?.[k] || ''));


function RoleList(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const [fetching, setFetching] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);

  // One object so the list⇄form navigation round-trip (previousSearchParams)
  // keeps working unchanged.
  const [searchParams, setSearchParams] = useState(() =>
    location?.state?.searchParams ? { ...location.state.searchParams } : { ...initialSearchParams }
  );
  // Text the user is typing; committed into searchParams after the debounce.
  const [filterDraft, setFilterDraft] = useState(searchParams.filters);

  const API_URL = core.API_URL;

  useEffect(() => {
    loadData();
  }, [searchParams]);

  useEffect(() => {
    if (sameFilters(filterDraft, searchParams.filters)) return;

    const handler = setTimeout(() => {
      setSearchParams((sp) => ({ ...sp, filters: { ...filterDraft }, page: 1 }));
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [filterDraft, searchParams.filters]);

  const newRecord = () => {
    const state = {
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate('/security/roles/create', { state });
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate(`/security/roles/edit/${record.id}`, { state });
  }

  const deleteSelectedRecords = () => {
    confirm({
      message: 'Deseja eliminar o(s) registo(s) selecionado(s)?',
      header: 'Confirmação',
      severity: 'danger',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const provider = dataProvider(API_URL + '/security');
        const params = {
          ids: selectedRecords.filter(v => !v.read_only).map(v => v.id)
        }
        provider.deleteMany('roles', params).then(d => {
          notify.success('Eliminar Registo(s)', 'Registo(s) eliminado(s) com sucesso');
          loadData();
        }).catch(e => {
          notify.error('Eliminar Registo(s)', 'Ocorreu um erro ao eliminar o(s) registo(s)');
        });
      }
    });
  }

  const deleteRecord = (record) => {
    confirm({
      message: 'Deseja eliminar o registo selecionado?',
      header: 'Confirmação',
      severity: 'danger',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const provider = dataProvider(API_URL + '/security');
        const params = {
          id: record.id
        }
        provider.delete('roles', params).then(d => {
          notify.success('Eliminar Registo', 'Registo eliminado com sucesso');
          loadData();
        }).catch(e => {
          notify.error('Eliminar Registo', 'Ocorreu um erro ao eliminar o registo');
        });
      }
    });
  }

  const loadData = () => {
    const provider = dataProvider(API_URL + '/security');

    const _filter = {};
    Object.entries(searchParams.filters || {}).forEach(([key, value]) => {
      if (value) {
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

    setFetching(true);

    provider.getList('roles', params).then(d => {
      setSelectedRecords([]);
      setRecords(d.data);
      setTotalRecords(d.total);
      setFetching(false);
    }).catch(e => {
      setFetching(false);
      notify.error('Pesquisa de Perfis', 'Ocorreu um erro na pesquisa');
    });
  }

  const onFilterClear = () => {
    setFilterDraft({ ...initialSearchParams.filters });
    setSearchParams({ ...initialSearchParams });
  }

  const columns = useMemo(
    () => [
      {
        accessor: 'id',
        title: 'Id',
        sortable: true,
        width: 120,
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
        cellsStyle: () => ({ wordBreak: 'break-all' }),
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
        accessor: 'description',
        title: 'Descrição',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        filter: (
          <TextInput
            label="Descrição"
            placeholder="Descrição"
            size="sm"
            value={filterDraft.description}
            onChange={(e) => setFilterDraft({ ...filterDraft, description: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.description !== ''
      },
      {
        accessor: 'actions',
        title: '',
        width: 110,
        exportable: false,
        render: (record) =>
          record.read_only ? (
            <ActionIcon variant="subtle" color="secondary" aria-label="Registo protegido" disabled>
              <i className="fas fa-lock" />
            </ActionIcon>
          ) : (
            <Group gap="xs" wrap="nowrap">
              <ActionIcon color="success" aria-label="Editar" onClick={() => editRecord(record)}>
                <IconPencil />
              </ActionIcon>
              <ActionIcon color="warning" aria-label="Eliminar" onClick={() => deleteRecord(record)}>
                <IconTrash />
              </ActionIcon>
            </Group>
          )
      }
    ],
    [filterDraft]
  );

  return (
    <PageSection
      title="Utilizadores - Perfis"
      toolbar={
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <Button color="success" leftSection={<IconPlus />} onClick={newRecord}>Novo</Button>
            <Button color="danger" leftSection={<IconTrash />} onClick={deleteSelectedRecords}
              disabled={!selectedRecords.length}>Eliminar</Button>
          </Group>
          <Button variant="outline" color="secondary" leftSection={<IconX />} onClick={onFilterClear}>Limpar</Button>
        </Group>
      }
    >
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
        selectedRecords={selectedRecords}
        onSelectedRecordsChange={setSelectedRecords}
        isRecordSelectable={(record) => !record.read_only}
        columns={columns}
        noRecordsText="Não foram encontrados registos."
      />
    </PageSection>
  );

}

export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(RoleList);
