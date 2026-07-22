import React, { useState, useEffect, useMemo, useRef } from "react";
import { ActionIcon, Button, Group, Input, Modal, Select, Table } from '@mantine/core';
import { CodeEditor, DataGrid, ConfirmPopover } from '@scalargis/ui';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useForm, Controller } from 'react-hook-form';

import { utils } from '@scalargis/components';

const LayoutEditor = props => {

  const { getWindowSize } = utils;

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

  const fieldError = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].message) return errors[name].message;

      if (errors[name].type === 'required') {
        return 'Campo obrigatório';
      } else if (errors[name].type === 'maxLength') {
        return 'O número de caracteres é superior à dimensão máxima permitida';
      } else if (errors[name].type === 'pattern') {
        return 'Formato inválido';
      }
    }
    return undefined;
  };

  const onSave = (formData) => {
    props.onSave(formData);
  }

  return (
    <Modal title="Edição de Layout" opened={props.show} size={isMobile ? '90%' : '45vw'} onClose={() => { props.onHide(); }}>
      <form>
        <div className="grid formgrid">
          <div className="field col-12 md:col-6">
            <Controller name="format" control={control} rules={{ required: 'Campo obrigatório.' }}
              render={({ field }) => (
                <Select
                  id="format"
                  label="Formato"
                  data={props.pageFormatList.map(val=>{return {label: val, value: val}})}
                  value={field.value || null}
                  onChange={(value) => field.onChange(value)}
                  error={fieldError(errors, 'format')} />
              )}
            />
          </div>
          <div className="field col-12 md:col-6">
            <Controller name="orientation" control={control} rules={{ required: 'Campo obrigatório.' }}
              render={({ field }) => (
                <Select
                  id="orientation"
                  label="Orientação"
                  data={props.pageOrientationList.map(val=>{return {label: val, value: val}})}
                  value={field.value || null}
                  onChange={(value) => field.onChange(value)}
                  error={fieldError(errors, 'orientation')} />
              )}
            />
          </div>
          <div className="field col-12">
            <Input.Label>Configuração</Input.Label>

              <Controller
                control={control}
                name="config"
                render={({ field }) => {

                  return <CodeEditor
                    language="json"
                    value={field.value}
                    onChange={field.onChange}
                    height="400px"
                    aria-label="Configuração"
                  />
                }}
              />
          </div>

        </div>

        <Group justify="flex-end" gap="xs" className="mt-4">
          <Button type="button" variant="subtle" leftSection={<i className="pi pi-times" />}
            onClick={() => props.onHide()}>Fechar</Button>
          <Button type="button" leftSection={<i className="pi pi-check" />}
            onClick={handleSubmit((d) => onSave(d))}>Gravar</Button>
        </Group>
      </form>
    </Modal>
  );
}


const pickLayout = (r) => (({ id, format, orientation, config }) => ({ id, format, orientation, config }))(r);

const PrintLayoutsEditor = props => {

  const [records, setRecords] = useState(props.data ? [...props.data] : []);
  const [selectedRecords, setSelectedRecords] = useState([]);

  const [layoutEdition, setLayoutEdition] = useState();
  const [showLayoutForm, setShowLayoutForm] = useState(false);

  // Drag reorders keep stable keys; skip the re-key when our own change bubbles back.
  const skipReseed = useRef(false);

  useEffect(() => {
   if (skipReseed.current) { skipReseed.current = false; return; }
   if (props?.data) setRecords(props.data.map((l) => { return {...l, key: createKey()} }));
  }, [props.data]);

  const findIndexByKey = (key) => {
    let index = -1;
    for (let i = 0; i < records.length; i++) {
        if (records[i].key === key) {
            index = i;
            break;
        }
    }
    return index;
  }

  const createKey = () => {
      let key = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 5; i++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return key;
  }

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) return;

    const _records = [...records];
    const [moved] = _records.splice(result.source.index, 1);
    _records.splice(result.destination.index, 0, moved);
    skipReseed.current = true;
    setRecords(_records);
    props.onChange(_records.map(pickLayout));
  }

  const editRecord = (record) => {
    setLayoutEdition({...record});
    setShowLayoutForm(true);
  }

  const deleteRecord = (record) => {
    const _records = records.filter(val => val.key !== record.key);
    props.onChange(_records.map(pickLayout));
    setSelectedRecords([]);
  }

  const deleteSelectedRecords = () => {
    const _keys = selectedRecords.map((r) => r.key);
    const _records = records.filter(r => !_keys.includes(r.key));
    props.onChange(_records.map(pickLayout));
    setSelectedRecords([]);
  }


  const onLayoutFormHide = () => {
    setShowLayoutForm(false);
    setLayoutEdition(null);
  }

  const onLayoutFormSave = (data) => {
    const _records = [...records];
    const _record = {...data}

    if (data.key) {
      const index = findIndexByKey(data.key);
      _records[index] = _record;
    } else {
      _record.key = createKey();
      _records.push(_record);
    }

    props.onChange(_records.map(pickLayout));
    setSelectedRecords([]);
    setShowLayoutForm(false);
  }

  const columns = useMemo(
    () => [
      // Explicit widths keep the cells from collapsing when a row is lifted for
      // drag (mantine-datatable only sets td width when the column defines it).
      {
        accessor: 'move',
        title: '',
        width: 48,
        render: () => <i className="fas fa-arrows-alt" aria-hidden="true" />
      },
      { accessor: 'format', title: 'Formato', width: 180 },
      { accessor: 'orientation', title: 'Orientação', width: '100%' },
      {
        accessor: 'actions',
        title: '',
        width: 120,
        render: (record) => (
          <Group gap="xs" wrap="nowrap" justify="flex-end">
            <ActionIcon type="button" color="success" aria-label="Editar" onClick={() => editRecord(record)}>
              <i className="pi pi-pencil" />
            </ActionIcon>
            <ConfirmPopover
              message="Tem a certeza que pretende eliminar?"
              severity="danger"
              acceptLabel="Sim"
              rejectLabel="Não"
              onConfirm={() => deleteRecord(record)}
            >
              <ActionIcon type="button" color="warning" aria-label="Eliminar">
                <i className="pi pi-trash" />
              </ActionIcon>
            </ConfirmPopover>
          </Group>
        )
      }
    ],
    [records, selectedRecords]
  );

  return (
    <div>
      { showLayoutForm &&
        <LayoutEditor data={layoutEdition}
          pageFormatList={props.pageFormatList}
          pageOrientationList={props.pageOrientationList}
          show={showLayoutForm}
          onHide={onLayoutFormHide}
          onSave={onLayoutFormSave} />
      }

      <div className="grid">
        <div className="card col-12">
          <Group justify="flex-end" gap="xs" className="mb-4">
            <Button type="button" color="success" leftSection={<i className="pi pi-plus" />}
              onClick={() => {
                editRecord({ key: '' });
              }}>Novo</Button>
            <ConfirmPopover
              message="Tem a certeza que pretende eliminar todos os layouts selecionados?"
              severity="danger"
              acceptLabel="Sim"
              rejectLabel="Não"
              onConfirm={deleteSelectedRecords}
            >
              <Button type="button" color="danger" leftSection={<i className="pi pi-trash" />}
                disabled={!selectedRecords.length}>Eliminar</Button>
            </ConfirmPopover>
          </Group>

          <DragDropContext onDragEnd={onDragEnd}>
            <DataGrid
              idAccessor="key"
              records={records}
              selectedRecords={selectedRecords}
              onSelectedRecordsChange={setSelectedRecords}
              columns={columns}
              noRecordsText="Não foram encontrados registos."
              tableWrapper={({ children }) => (
                <Droppable droppableId="layouts-droppable">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {children}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
              rowFactory={({ record, index, rowProps, children }) => (
                <Draggable key={String(record.key)} draggableId={String(record.key)} index={index}>
                  {(provided) => (
                    <Table.Tr
                      {...rowProps}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {children}
                    </Table.Tr>
                  )}
                </Draggable>
              )}
            />
          </DragDropContext>
        </div>
      </div>
    </div>
  )

}

export default PrintLayoutsEditor;
