import React, { useContext, useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Button, Group, Select, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', username: '', email: '', name: '', active: true }
};

// ?? not ||: the active filter is a boolean, and false must not collapse into ''.
const sameFilters = (a, b) =>
  Object.keys(initialSearchParams.filters).every((k) => (a?.[k] ?? '') === (b?.[k] ?? ''));


function UserList(props) {
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
    navigate('/security/users/create', { state });
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate(`/security/users/edit/${record.id}`, { state });
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
        provider.deleteMany('users', params).then(d => {
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
        provider.delete('users', params).then(d => {
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
      // active: false is a real filter value; only '' and null mean "not set".
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

    setFetching(true);

    provider.getList('users', params).then(d => {
      setSelectedRecords([]);
      setRecords(d.data);
      setTotalRecords(d.total);
      setFetching(false);
    }).catch(e => {
      setFetching(false);
      notify.error('Pesquisa de Utilizadores', 'Ocorreu um erro na pesquisa');
    });
  }

  const onFilterClear = () => {
    setFilterDraft({ ...initialSearchParams.filters });
    setSearchParams({ ...initialSearchParams });
  }

  // Select commits immediately (only text filters ride the debounce), taking
  // any pending text draft along with it.
  const onActiveFilterChange = (value) => {
    const active = value == null ? null : value === 'true';
    const filters = { ...filterDraft, active };
    setFilterDraft(filters);
    setSearchParams((sp) => ({ ...sp, filters, page: 1 }));
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
        accessor: 'username',
        title: 'Username',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        filter: (
          <TextInput
            label="Username"
            placeholder="Username"
            size="sm"
            value={filterDraft.username}
            onChange={(e) => setFilterDraft({ ...filterDraft, username: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.username !== ''
      },
      {
        accessor: 'email',
        title: 'Email',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        filter: (
          <TextInput
            label="Email"
            placeholder="Email"
            size="sm"
            value={filterDraft.email}
            onChange={(e) => setFilterDraft({ ...filterDraft, email: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.email !== ''
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
        accessor: 'active',
        title: 'Ativo',
        sortable: true,
        width: 130,
        textAlign: 'center',
        render: (record) =>
          record.active ? (
            <i className="pi pi-check" style={{ fontWeight: 'bold', color: 'var(--mantine-color-success-filled)' }} />
          ) : (
            <i className="pi pi-times" style={{ fontWeight: 'bold', color: 'var(--mantine-color-danger-filled)' }} />
          ),
        filter: (
          <Select
            label="Ativo"
            placeholder="Todos"
            size="sm"
            data={[{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }]}
            value={filterDraft.active == null ? null : String(filterDraft.active)}
            onChange={onActiveFilterChange}
            clearable
          />
        ),
        filtering: filterDraft.active != null
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
                <i className="pi pi-pencil" />
              </ActionIcon>
              <ActionIcon color="warning" aria-label="Eliminar" onClick={() => deleteRecord(record)}>
                <i className="pi pi-trash" />
              </ActionIcon>
            </Group>
          )
      }
    ],
    [filterDraft]
  );

  return (
    <React.Fragment>
      <div className="col-12"><h3>Utilizadores</h3></div>

      <div className="grid viewer-list">
          <div className="card col-12">
            <Group justify="space-between" wrap="wrap" className="mb-4">
              <Group gap="xs">
                <Button color="success" leftSection={<i className="pi pi-plus" />} onClick={newRecord}>Novo</Button>
                <Button color="danger" leftSection={<i className="pi pi-trash" />} onClick={deleteSelectedRecords}
                  disabled={!selectedRecords.length}>Eliminar</Button>
              </Group>
              <Button variant="outline" color="secondary" leftSection={<i className="pi pi-times" />} onClick={onFilterClear}>Limpar</Button>
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
              selectedRecords={selectedRecords}
              onSelectedRecordsChange={setSelectedRecords}
              isRecordSelectable={(record) => !record.read_only}
              columns={columns}
              noRecordsText="Não foram encontrados registos."
            />
        </div>
      </div>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(UserList);
