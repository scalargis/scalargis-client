import React, { useContext, useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { ActionIcon, Badge, Button, Group, MultiSelect, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { CollapsiblePanel, DataGrid, exportGridCSV, notify, IconPencil, IconUpload } from '@scalargis/ui';

import AppContext from '../../../AppContext'
import dataProvider from '../../../service/DataProvider';
import PageSection from '../common/PageSection';


const initialSearchParams = {
  page: 1,
  pageSize: 5,
  sortStatus: { columnAccessor: 'id', direction: 'asc' },
  filters: { "status": [0] }
};

const status = [
  {
    value: 0,
    name: 'Por abrir'
  },
  {
    value: 1,
    name: 'Lida'
  },
  {
    value: 2,
    name: 'Encerrado'
  }
];

// The @mantine/dates pickers exchange 'YYYY-MM-DD' strings; the filter model
// keeps Dates so the filter payload stays the pre-migration shape.
const toPickerDate = (value) => (value ? dayjs(value).format('YYYY-MM-DD') : null);
const fromPickerDate = (value) => (value ? dayjs(value).toDate() : null);

function NotificationList(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const { core } = useContext(AppContext);

  const [viewersOptions, setViewersOptions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedRecords, setSelectedRecords] = useState([]);

  const [filter] = useState(props.filter || { "status": [0] });
  const [searchParams, setSearchParams] = useState({ ...initialSearchParams });

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...filter}
  });

  useEffect(() => {
    Promise.all([
      dataProvider(API_URL + '/portal').getSimpleList('notifications/viewers/list', {}).catch((error) => error)
    ]).then((result) => {
      setViewersOptions(result[0].data || []);
    }).catch((error) => {
      console.log(error)
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const editRecord = (record) => {
    const state = {
      from: location.pathname,
      previousSearchParams: {...searchParams}
    }
    navigate(`/notifications/edit/${record.id}`, { state });
  }

  const loadData = () => {
    const provider = dataProvider(API_URL + '/portal');

    const _filter = {};
    Object.entries(searchParams.filters || {}).forEach(([key, value]) => {
      if (key && value) {
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

    provider.getList('notifications', params).then(d => {
      setSelectedRecords([]);
      setRecords(d.data);
      setTotalRecords(d.total);
      setFetching(false);
    }).catch(e => {
      setFetching(false);
      notify.error('Pesquisa de Notificações', 'Ocorreu um erro na pesquisa');
    });
  }

  const onFilterSubmit = (formData) => {
    setSearchParams((sp) => ({ ...sp, filters: { ...formData }, page: 1 }));
  }

  const onFilterClear = () => {
    setValue('id', null);
    setValue('author', null);
    setValue('viewer', null);
    setValue('start_date', null);
    setValue('end_date', null);
    setValue('message', null);
    setValue('status', null);

    setSearchParams((sp) => ({ ...sp, filters: {}, page: 1 }));
  }

  const columns = useMemo(
    () => [
      { accessor: 'id', title: 'Id', sortable: true, width: 90 },
      { accessor: 'date', title: 'Data', sortable: true, width: 130 },
      {
        accessor: 'viewer',
        title: 'Visualizador',
        sortable: true,
        width: 140,
        textAlign: 'center',
        render: (record) => record.viewer ? <Badge variant="light" color="secondary">{record.viewer}</Badge> : null
      },
      {
        accessor: 'name',
        title: 'Autor',
        sortable: true,
        cellsStyle: () => ({ wordBreak: 'break-all' }),
        render: (record) => (
          <>
            {record.name && <span>{record.name}</span>}
            {record.name && record.email ? <br /> : null}
            {record.email && <span style={{color: 'var(--mantine-color-dimmed)', fontSize: '.9rem'}}>{record.email}</span>}
          </>
        ),
        exportRender: (record) => (record.name + (record.email ? ` (${record.email})` : ''))
      },
      {
        accessor: 'message',
        title: 'Mensagem',
        render: (record) => {
          const message = record.message || '';
          return message.length > 50 ? `${message.slice(0, 50)}...` : message;
        }
      },
      {
        accessor: 'status',
        title: 'Estado',
        width: 90,
        textAlign: 'center',
        render: (record) => {
          const status = record.status || {}

          if (status.value === 0) {
            return <span className="badge badge-danger" title={`${status.label || 'Por abrir'}`}><i className="fas fa-envelope"></i></span>
          } else if (status.value === 1) {
            return <span className="badge badge-warning" title={`${status.label || 'Lida'} (${status.date})`}><i className="fas fa-envelope-open"></i></span>
          } else if (status.value === 2) {
            return <span className="badge badge-success" title={`${status.label || 'Encerrada'} (${status.date})`}><i className="fas fa-check"></i></span>
          }

          return null;
        },
        exportRender: (record) => record.status?.label
      },
      {
        accessor: 'actions',
        title: '',
        width: 120,
        exportable: false,
        render: (record) => (
          <ActionIcon variant="outline" color="secondary" aria-label="Editar" onClick={() => editRecord(record)}>
            <IconPencil />
          </ActionIcon>
        )
      }
    ],
    []
  );

  return (
    <PageSection
      title="Notificações"
      toolbar={
        <CollapsiblePanel header="Filtro" defaultOpened>
          <form onSubmit={handleSubmit(onFilterSubmit)}>

            <div className="formgrid grid">
              <div className="field col-12 md:col-2">
                  <TextInput id="id" label="Id" {...register('id')} />
              </div>
              <div className="field col-12 md:col-10">
                  <Controller
                      control={control}
                      name="viewer"
                      render={({ field }) => (
                        <MultiSelect
                          label="Visualizador"
                          data={viewersOptions.map(v => ({ value: String(v.id), label: v.name }))}
                          value={(field.value || []).map(String)}
                          onChange={(values) => field.onChange(values.length ? values.map(Number) : null)}
                          searchable clearable />
                      )}
                    />
              </div>
              <div className="field col-12 md:col-4">
                  <Controller
                      control={control}
                      name="start_date"
                      render={({ field }) => (
                        <DatePickerInput
                          label="Data envio (início)"
                          value={toPickerDate(field.value)}
                          onChange={(value) => field.onChange(fromPickerDate(value))}
                          valueFormat="DD/MM/YYYY" placeholder="dd/mm/aaaa"
                          clearable />
                      )}
                    />
              </div>
              <div className="field col-12 md:col-4">
                  <Controller
                      control={control}
                      name="end_date"
                      render={({ field }) => (
                        <DatePickerInput
                          label="Data envio (fim)"
                          value={toPickerDate(field.value)}
                          onChange={(value) => field.onChange(fromPickerDate(value))}
                          valueFormat="DD/MM/YYYY" placeholder="dd/mm/aaaa"
                          clearable />
                      )}
                    />
              </div>
              <div className="field col-12 md:col-4">
                  <TextInput id="author" label="Autor" {...register('author')} />
              </div>
              <div className="field col-12 md:col-4">
                  <TextInput id="message" label="Mensagem" {...register('message')} />
              </div>
              <div className="field col-12 md:col-4">
                  <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <MultiSelect
                          label="Estado"
                          data={status.map(s => ({ value: String(s.value), label: s.name }))}
                          value={(field.value || []).map(String)}
                          onChange={(values) => field.onChange(values.length ? values.map(Number) : null)}
                          clearable />
                      )}
                    />
              </div>
            </div>

            <div className="fluid grid justify-content-end">
              <div className="field col-12 md:col-1">
                <Button type="submit" fullWidth>Pesquisar</Button>
              </div>
              <div className="field col-12 md:col-1">
                <Button type="button" variant="default" fullWidth onClick={onFilterClear}>Limpar</Button>
              </div>
            </div>

            </form>
        </CollapsiblePanel>
      }
    >
      <Group justify="space-between" wrap="wrap">
        <span><b>Total:</b> {totalRecords}</span>
        <Button variant="outline" color="secondary" leftSection={<IconUpload />}
          onClick={() => exportGridCSV(records, columns, { filename: 'notificacoes.csv' })}
          disabled={!totalRecords}>Exportar</Button>
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
        noRecordsText="Não foram encontradas notificações."
      />
    </PageSection>
  );

}

export default connect(state => ({ loading: state.loading, filters: state.filters }))(NotificationList);
