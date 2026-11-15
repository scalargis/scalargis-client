import React, { useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Badge, Button, Group, Select, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify, IconPencil, IconTrash, IconPlus, IconX } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import { isAdminOrManager } from '../../utils';
import PageSection from '../common/PageSection';
import useListSearch from '../common/useListSearch';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', name: '', title: '', description: '', is_shared: false }
};


function ViewerList(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const auth = core.store.getState().auth;
  const adminOrManager = isAdminOrManager(auth);

  const API_URL = core.API_URL;

  const { filterDraft, setFilterDraft, commitFilters, clearFilters, selectedRecords, reload, currentSearchParams, gridProps } = useListSearch({
    initialSearchParams,
    restoredSearchParams: location?.state?.searchParams,
    fetchList: (params) => dataProvider(API_URL + '/portal').getList('viewers', params),
    errorTitle: 'Pesquisa de Visualizadores'
  });

  const newRecord = () => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
    }
    navigate('/viewers/create', { state });
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
    }
    navigate(`/viewers/edit/${record.id}`, { state });
  }

  const deleteSelectedRecords = () => {
    confirm({
      message: 'Deseja eliminar o(s) registo(s) selecionado(s)?',
      header: 'Confirmação',
      severity: 'danger',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const provider = dataProvider(API_URL + '/portal');
        const params = {
          ids: selectedRecords.map(v => v.id)
        }
        provider.deleteMany('viewers', params).then(d => {
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
        const provider = dataProvider(API_URL + '/portal');
        const params = {
          id: record.id
        }
        provider.delete('viewers', params).then(d => {
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

  const onSharedFilterChange = (value) => {
    const is_shared = value == null ? null : value === 'true';
    const filters = { ...filterDraft, is_shared };
    commitFilters(filters);
  }

  const columns = useMemo(
    () => {
      const cols = [
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
          accessor: 'title',
          title: 'Título',
          sortable: true,
          cellsStyle: () => ({ wordBreak: 'break-all' }),
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
          accessor: 'keywords',
          title: 'Keywords',
          render: (record) => (
            <React.Fragment>
              { record.keywords && record.keywords.map( (item) => <Badge variant="light" color="secondary" key={item} mr="xs" mb="xs">{item}</Badge> ) }
            </React.Fragment>
          )
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
              onChange={onSharedFilterChange}
              clearable
            />
          ),
          filtering: filterDraft.is_shared != null
        }
      ];

      if (adminOrManager) {
        cols.push({
          accessor: 'owner',
          title: 'Dono',
          cellsStyle: () => ({ wordBreak: 'break-all' }),
          render: (record) => {
            if (record?.owner?.id > 0) {
              return record.owner.active
                ? <Badge variant="light" color="secondary" leftSection={<i className="fas fa-user-alt" />}>{record.owner.username}</Badge>
                : <Badge variant="light" color="secondary" leftSection={<i className="fas fa-user-alt-slash" />}>{record.owner.username}</Badge>;
            }
            return <Badge variant="light" color="secondary" leftSection={<i className="far fa-user" />}>Anónimo</Badge>;
          }
        });
      }

      cols.push({
        accessor: 'actions',
        title: '',
        width: 110,
        exportable: false,
        render: (record) => (
          <Group gap="xs" wrap="nowrap">
            <ActionIcon color="success" aria-label="Editar" onClick={() => editRecord(record)}>
              <IconPencil />
            </ActionIcon>
            <ActionIcon color="warning" aria-label="Eliminar" onClick={() => deleteRecord(record)}>
              <IconTrash />
            </ActionIcon>
          </Group>
        )
      });

      return cols;
    },
    [filterDraft, adminOrManager]
  );

  return (
    <PageSection
      title="Visualizadores"
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
        columns={columns}
        noRecordsText="Não foram encontrados registos."
      />
    </PageSection>
  );

}

export default connect(state => ({ loading: state.loading, filters: state.filters }))(ViewerList);
