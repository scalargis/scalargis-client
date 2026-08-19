import React, { useContext, useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { ActionIcon, Button, Group, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DataGrid, confirm, notify, Dialog, IconEye, IconPencil, IconTrash, IconPlus, IconX } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';


const initialSearchParams = {
  page: 1,
  pageSize: 20,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { id: '', code: '', name: '', notes: '' }
};

const sameFilters = (a, b) =>
  Object.keys(initialSearchParams.filters).every((k) => (a?.[k] || '') === (b?.[k] || ''));


function ParameterList(props) {
  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const parameters_table = props.parametersTable || 'site';

  const { core } = useContext(AppContext);

  const [fetching, setFetching] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [displayFieldValue, { open: openFieldValue, close: closeFieldValue }] = useDisclosure(false);
  const [fieldValue, setFieldValue] = useState();

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
    navigate(`/settings/parameters/create`, { state });
  }

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate(`/settings/parameters/edit/${record.id}`, { state });
  }

  const deleteSelectedRecords = () => {
    confirm({
      message: 'Deseja eliminar o(s) registo(s) selecionado(s)?',
      header: 'Confirmação',
      severity: 'danger',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const provider = dataProvider(API_URL + '/portal/settings');
        const params = {
          ids: selectedRecords.filter(v => !v.read_only).map(v => v.id)
        }
        provider.deleteMany(parameters_table, params).then(d => {
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
        const provider = dataProvider(API_URL + '/portal/settings');
        const params = {
          id: record.id
        }
        provider.delete(parameters_table, params).then(d => {
          notify.success('Eliminar Registo', 'Registo eliminado com sucesso');
          loadData();
        }).catch(e => {
          notify.error('Eliminar Registo', 'Ocorreu um erro ao eliminar o registo');
        });
      }
    });
  }

  const loadData = () => {
    const provider = dataProvider(API_URL + '/portal/settings');

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

    provider.getList(parameters_table, params).then(d => {
      setSelectedRecords([]);
      setRecords(d.data);
      setTotalRecords(d.total);
      setFetching(false);
    }).catch(e => {
      setFetching(false);
      notify.error('Pesquisa de Parâmetros', 'Ocorreu um erro na pesquisa');
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
        accessor: 'notes',
        title: 'Descrição',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        filter: (
          <TextInput
            label="Descrição"
            placeholder="Descrição"
            size="sm"
            value={filterDraft.notes}
            onChange={(e) => setFilterDraft({ ...filterDraft, notes: e.currentTarget.value })}
          />
        ),
        filtering: filterDraft.notes !== ''
      },
      {
        accessor: 'setting_value',
        title: 'Valor',
        width: 90,
        exportable: false,
        render: (record) =>
          (record.setting_value || '') === '' ? null : (
            <ActionIcon variant="subtle" aria-label="Ver valor" title="Ver valor"
              onClick={() => { setFieldValue(record.setting_value); openFieldValue(); }}>
              <IconEye />
            </ActionIcon>
          )
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
    <React.Fragment>
      <div className="col-12"><h3>Parâmetros</h3></div>

      <div className="grid viewer-list">
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
              isRecordSelectable={(record) => !record.read_only}
              columns={columns}
              noRecordsText="Não foram encontrados registos."
            />
            <Dialog title="Valor" opened={displayFieldValue} size="50vw"
              onClose={closeFieldValue}>
              {(() => {
                const raw = fieldValue ?? '';
                // Pretty-print JSON values (SITE_CONFIG etc.); fall back to the
                // HTML render for non-JSON (rich-text) settings.
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed && typeof parsed === 'object') {
                    return (
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '60vh', overflow: 'auto', margin: 0 }}>
                        {JSON.stringify(parsed, null, 2)}
                      </pre>
                    );
                  }
                } catch { /* not JSON */ }
                return <div dangerouslySetInnerHTML={{ __html: raw }} />;
              })()}
            </Dialog>
        </div>
      </div>
    </React.Fragment>
  );

}

export default connect(state => ({ loading: state.loading, auth: state.auth, filters: state.filters }))(ParameterList);
