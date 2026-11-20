import React, { useContext, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Badge, Button, Group, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify, IconPencil, IconTrash, IconPlus, IconX, IconSearch } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import PageSection from '../common/PageSection';
import useListSearch from '../common/useListSearch';
import { InUseDialog } from './SharedLayerUsage';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'code', direction: 'asc' },
  filters: { q: '', code: '', title: '' }
};


function SharedLayerList() {
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const [refusal, setRefusal] = useState(null);

  const { filterDraft, setFilterDraft, clearFilters, reload, currentSearchParams, gridProps } = useListSearch({
    initialSearchParams,
    restoredSearchParams: location?.state?.searchParams,
    fetchList: (params) => dataProvider(API_URL + '/portal').getList('shared-layers', params),
    errorTitle: 'Pesquisa de Camadas Partilhadas'
  });

  const { selectedRecords, onSelectedRecordsChange, ...listProps } = gridProps;

  const openRecord = (path) => {
    navigate(path, { state: { from: location.pathname, previousSearchParams: currentSearchParams() } });
  }

  const deleteRecord = (record) => {
    confirm({
      message: `Deseja eliminar a camada partilhada ${record.code}?`,
      header: 'Confirmação',
      severity: 'danger',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        dataProvider(API_URL + '/portal').delete('shared-layers', { id: record.id }).then(() => {
          notify.success('Eliminar Registo', 'Registo eliminado com sucesso');
          reload();
        }).catch(e => {
          if (e?.status === 409 && e.body?.error === 'in_use') {
            setRefusal({ text: `A camada ${record.code} está em uso e não pode ser eliminada.`, viewers: e.body.viewers || [] });
          } else {
            notify.error('Eliminar Registo', 'Ocorreu um erro ao eliminar o registo');
          }
        });
      }
    });
  }

  const textFilter = (key, label) => ({
    filter: (
      <TextInput
        label={label}
        placeholder={label}
        size="sm"
        value={filterDraft[key]}
        onChange={(e) => setFilterDraft({ ...filterDraft, [key]: e.currentTarget.value })}
      />
    ),
    filtering: filterDraft[key] !== ''
  });

  const columns = useMemo(
    () => [
      { accessor: 'id', title: 'Id', sortable: true, width: 100 },
      {
        accessor: 'code', title: 'Código', sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        ...textFilter('code', 'Código')
      },
      {
        accessor: 'title', title: 'Título', sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-word' }),
        ...textFilter('title', 'Título')
      },
      {
        accessor: 'type', title: 'Tipo', width: 120,
        render: (record) => record.type ? <Badge variant="light" color="secondary">{record.type}</Badge> : null
      },
      { accessor: 'usage_count', title: 'Usado em', width: 110, textAlign: 'center' },
      {
        accessor: 'actions',
        title: '',
        width: 110,
        exportable: false,
        render: (record) => (
          <Group gap="xs" wrap="nowrap">
            <ActionIcon color="success" aria-label="Editar" onClick={() => openRecord(`/shared-layers/edit/${record.id}`)}>
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
      title="Camadas partilhadas"
      toolbar={
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <Button color="success" leftSection={<IconPlus />} onClick={() => openRecord('/shared-layers/create')}>Novo</Button>
            <TextInput
              aria-label="Pesquisar"
              placeholder="Pesquisar código ou título"
              leftSection={<IconSearch />}
              value={filterDraft.q}
              onChange={(e) => setFilterDraft({ ...filterDraft, q: e.currentTarget.value })}
            />
          </Group>
          <Button variant="outline" color="secondary" leftSection={<IconX />} onClick={clearFilters}>Limpar</Button>
        </Group>
      }
    >
      <DataGrid
        idAccessor="id"
        {...listProps}
        columns={columns}
        noRecordsText="Não foram encontrados registos."
      />
      <InUseDialog refusal={refusal} onClose={() => setRefusal(null)} />
    </PageSection>
  );

}

export default SharedLayerList;
