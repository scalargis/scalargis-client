import React, { useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Badge, Button, Group, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify, IconPencil, IconTrash, IconPlus, IconX } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import ViewersList from './ViewersList';
import PageSection from '../common/PageSection';
import useListSearch from '../common/useListSearch';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', code: '', title: '', groups: '', prints: '', viewers: '' }
};


function PrintGroupList(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { filterDraft, setFilterDraft, clearFilters, selectedRecords, reload, currentSearchParams, gridProps } = useListSearch({
    initialSearchParams,
    restoredSearchParams: location?.state?.searchParams,
    fetchList: (params) => dataProvider(API_URL + '/portal').getList('prints/groups', params),
    errorTitle: 'Pesquisa de Grupos de Plantas'
  });

  const newRecord = () => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
    }
    navigate('/prints/groups/create', { state })
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
    }
    navigate(`/prints/groups/edit/${record.id}`, { state });
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
        provider.deleteMany('prints/groups', params).then(d => {
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
        provider.delete('prints/groups', params).then(d => {
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
        accessor: 'code',
        title: 'Código',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        filter: (
          <TextInput
            label="Código"
            placeholder="Código"
            size="sm"
            value={filterDraft.code}
            onChange={(e) => setFilterDraft({ ...filterDraft, code: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.code !== ''
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
        accessor: 'groups',
        title: 'Grupos',
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        render: (record) => (
          <React.Fragment>
            { record.groups && record.groups.map( (item) => <Badge variant="light" color="secondary" key={item.id} mr="xs" mb="xs">{item.code}</Badge> ) }
          </React.Fragment>
        ),
        filter: (
          <TextInput
            label="Grupos"
            placeholder="Grupo"
            size="sm"
            value={filterDraft.groups}
            onChange={(e) => setFilterDraft({ ...filterDraft, groups: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.groups !== ''
      },
      {
        accessor: 'prints',
        title: 'Plantas',
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        render: (record) => (
          <React.Fragment>
            { record.prints && record.prints.map( (item) => <Badge variant="light" color="secondary" key={item.id} mr="xs" mb="xs">{item.code}</Badge> ) }
          </React.Fragment>
        ),
        filter: (
          <TextInput
            label="Plantas"
            placeholder="Planta"
            size="sm"
            value={filterDraft.prints}
            onChange={(e) => setFilterDraft({ ...filterDraft, prints: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.prints !== ''
      },
      {
        accessor: 'viewers',
        title: 'Visualizadores',
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        textAlign: 'center',
        render: (record) =>
          record?.viewers?.length
            ? <ViewersList id={record.id} elementType="groups" header={`Grupo - [${record.code}] ${record.title}`} />
            : null,
        filter: (
          <TextInput
            label="Visualizadores"
            placeholder="Visualizador"
            size="sm"
            value={filterDraft.viewers}
            onChange={(e) => setFilterDraft({ ...filterDraft, viewers: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.viewers !== ''
      },
      {
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
      }
    ],
    [filterDraft]
  );

  return (
    <PageSection
      title="Emissão de Plantas - Grupos"
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

export default connect(state => ({ loading: state.loading, filters: state.filters }))(PrintGroupList);
