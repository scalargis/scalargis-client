import React, { useContext, useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Badge, Button, Group, TextInput } from '@mantine/core';
import { DataGrid, confirm, notify, IconPencil, IconTrash, IconPlus, IconX } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import ViewersList from './ViewersList';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', code: '', title: '', groups: '', prints: '', viewers: '' }
};

const sameFilters = (a, b) =>
  Object.keys(initialSearchParams.filters).every((k) => (a?.[k] || '') === (b?.[k] || ''));


function PrintGroupList(props) {
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
    navigate('/prints/groups/create', { state })
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: {...searchParams}
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
        const provider = dataProvider(API_URL + '/portal');
        const params = {
          id: record.id
        }
        provider.delete('prints/groups', params).then(d => {
          notify.success('Eliminar Registo', 'Registo eliminado com sucesso');
          loadData();
        }).catch(e => {
          notify.error('Eliminar Registo', 'Ocorreu um erro ao eliminar o registo');
        });
      }
    });
  }

  const loadData = () => {
    const provider = dataProvider(API_URL + '/portal');

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

    provider.getList('prints/groups', params).then(d => {
      setSelectedRecords([]);
      setRecords(d.data);
      setTotalRecords(d.total);
      setFetching(false);
    }).catch(e => {
      setFetching(false);
      notify.error('Pesquisa de Grupos de Plantas', 'Ocorreu um erro na pesquisa');
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
            { record.groups && record.groups.map( (item) => <Badge variant="light" color="secondary" key={item.id} className="mr-2 mb-2">{item.code}</Badge> ) }
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
            { record.prints && record.prints.map( (item) => <Badge variant="light" color="secondary" key={item.id} className="mr-2 mb-2">{item.code}</Badge> ) }
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
    <React.Fragment>
      <div className="col-12"><h3>Emissão de Plantas - Grupos</h3></div>

      <div className="grid print-list">
        <div className="card col-12">
          <Group justify="space-between" wrap="wrap" className="mb-4">
            <Group gap="xs">
              <Button color="success" leftSection={<IconPlus />} onClick={newRecord}>Novo</Button>
              <Button color="danger" leftSection={<IconTrash />} onClick={deleteSelectedRecords}
                disabled={!selectedRecords.length}>Eliminar</Button>
            </Group>
            <Button variant="outline" color="secondary" leftSection={<IconX />} onClick={onFilterClear}>Limpar</Button>
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
            columns={columns}
            noRecordsText="Não foram encontrados registos."
          />
        </div>
      </div>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, filters: state.filters }))(PrintGroupList);
