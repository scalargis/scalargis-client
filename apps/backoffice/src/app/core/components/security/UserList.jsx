import React, { useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Button, Group, Select, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify, IconCheck, IconX, IconPencil, IconTrash, IconPlus } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import PageSection from '../common/PageSection';
import useListSearch from '../common/useListSearch';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', username: '', email: '', name: '', active: true }
};


function UserList(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { filterDraft, setFilterDraft, commitFilters, clearFilters, selectedRecords, reload, currentSearchParams, gridProps } = useListSearch({
    initialSearchParams,
    restoredSearchParams: location?.state?.searchParams,
    fetchList: (params) => dataProvider(API_URL + '/security').getList('users', params),
    errorTitle: 'Pesquisa de Utilizadores'
  });

  const newRecord = () => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
    }
    navigate('/security/users/create', { state });
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
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
          reload();
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
          reload();
        }).catch(e => {
          notify.error('Eliminar Registo', 'Ocorreu um erro ao eliminar o registo');
        });
      }
    });
  }

  const onFilterClear = () => {
    clearFilters();
  }

  const onActiveFilterChange = (value) => {
    const active = value == null ? null : value === 'true';
    const filters = { ...filterDraft, active };
    commitFilters(filters);
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
            <IconCheck title="Ativo" style={{ fontWeight: 'bold', color: 'var(--mantine-color-success-filled)' }} />
          ) : (
            <IconX title="Inativo" style={{ fontWeight: 'bold', color: 'var(--mantine-color-danger-filled)' }} />
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
      title="Utilizadores"
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
        {...gridProps}
        isRecordSelectable={(record) => !record.read_only}
        columns={columns}
        noRecordsText="Não foram encontrados registos."
      />
    </PageSection>
  );

}

export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(UserList);
