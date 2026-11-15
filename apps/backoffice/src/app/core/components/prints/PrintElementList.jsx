import React, { useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Button, Group, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify, IconPencil, IconTrash, IconPlus, IconX } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import PageSection from '../common/PageSection';
import useListSearch from '../common/useListSearch';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', code: '', name: '' }
};


function PrintElementList(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { filterDraft, setFilterDraft, clearFilters, selectedRecords, reload, currentSearchParams, gridProps } = useListSearch({
    initialSearchParams,
    restoredSearchParams: location?.state?.searchParams,
    fetchList: (params) => dataProvider(API_URL + '/portal').getList('prints/elements', params),
    errorTitle: 'Pesquisa de Elementos de Impressão'
  });

  const newRecord = () => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
    }
    navigate('/prints/elements/create', { state });
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: currentSearchParams()
    }
    navigate(`/prints/elements/edit/${record.id}`, { state });
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
        provider.deleteMany('prints/elements', params).then(d => {
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
        provider.delete('prints/elements', params).then(d => {
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
        accessor: 'actions',
        title: '',
        width: 110,
        exportable: false,
        render: (record) => (
          <Group gap="xs" wrap="nowrap" justify="flex-end">
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
      title="Emissão de Plantas - Elementos"
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

export default connect(state => ({ filters: state.filters }))(PrintElementList);
