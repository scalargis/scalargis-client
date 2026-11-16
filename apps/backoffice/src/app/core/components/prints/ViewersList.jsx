import React, { useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import { ActionIcon, Badge, Group, Select, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DataGrid, Dialog, IconMenu } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import useListSearch from '../common/useListSearch';


const initialSearchParams = {
  page: 1,
  pageSize: 10,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', name: '', title: '', is_active: null, is_shared: null }
};


function ViewersList(props) {

  const { core } = useContext(AppContext);

  const [visible, { open: openViewers, close: closeViewers }] = useDisclosure(false);

  const API_URL = core.API_URL;

  const { filterDraft, setFilterDraft, commitFilters, reset, reload, totalRecords, gridProps } = useListSearch({
    initialSearchParams,
    fetchList: (params) => dataProvider(API_URL + '/portal').getList(`${props.elementType}/${props.id}/viewers`, params),
    errorTitle: 'Pesquisa de Visualizadores',
    enabled: visible
  });

  const onOpen = () => {
    reload().then((d) => {
      if (d) openViewers();
    });
  }

  const onHide = () => {
    closeViewers();
    reset();
  }

  const onBoolFilterChange = (key, value) => {
    const parsed = value == null ? null : value === 'true';
    commitFilters({ ...filterDraft, [key]: parsed });
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
      <ActionIcon variant="outline" aria-label="Ver visualizadores" loading={gridProps.fetching && !visible}
        onClick={onOpen}>
        <IconMenu />
      </ActionIcon>

      <Dialog title={props.header || ''} opened={visible} size="75vw" onClose={onHide}>
        <Group justify="space-between" wrap="wrap" mb="xs">
          <span>Lista Visualizadores</span>
          <span>Total de registos: {totalRecords}</span>
        </Group>
        <DataGrid
          idAccessor="id"
          records={gridProps.records}
          totalRecords={gridProps.totalRecords}
          fetching={gridProps.fetching}
          page={gridProps.page}
          onPageChange={gridProps.onPageChange}
          recordsPerPage={gridProps.recordsPerPage}
          sortStatus={gridProps.sortStatus}
          onSortStatusChange={gridProps.onSortStatusChange}
          columns={columns}
          noRecordsText="Não foram encontrados registos"
        />
      </Dialog>
    </React.Fragment>
  )
}

export default connect(state => ({}))(ViewersList);
