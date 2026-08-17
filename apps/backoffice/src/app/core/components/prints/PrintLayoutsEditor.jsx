import React, { useMemo, useState } from "react";
import { ActionIcon, Button, Group, Input, Select } from '@mantine/core';
import { CodeEditor, DataGrid, ConfirmPopover, Dialog, useIsMobile } from '@scalargis/ui';
import { useForm, Controller } from 'react-hook-form';

const LayoutEditor = props => {

  const isMobile = useIsMobile();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {...(props.data ?? {})}
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

  return (
    <Dialog title="Edição de Layout" opened size={isMobile ? '90%' : '45vw'} onClose={() => { props.onHide(); }}>
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
            onClick={handleSubmit((d) => props.onSave(d))}>Gravar</Button>
        </Group>
      </form>
    </Dialog>
  );
}


const pickLayout = (r) => (({ id, format, orientation, config }) => ({ id, format, orientation, config }))(r);

// Unsaved layouts have no id, so the grid keys rows by object identity.
// Module scope on purpose: the cache survives the editor unmounting with its
// tab, so a re-mount reuses the same keys for the same (parent-owned) rows.
const layoutKeys = new WeakMap();
let layoutKeySeq = 0;
const layoutKey = (layout) => {
  if (!layoutKeys.has(layout)) layoutKeys.set(layout, `layout-${++layoutKeySeq}`);
  return layoutKeys.get(layout);
};

// Fully controlled: props.data is the single source of truth and every edit
// (reorder, add, edit, delete) flows out through props.onChange. The grid
// rows ARE the parent's layout objects — no copies, no key reseeding.
const PrintLayoutsEditor = props => {

  const data = props.data ?? [];

  const [selectedRecords, setSelectedRecords] = useState([]);

  // undefined = modal closed · null = new layout · object = the row being edited
  const [editing, setEditing] = useState();

  const onLayoutFormSave = (formData) => {
    const layout = pickLayout(formData);
    props.onChange(editing ? data.map((l) => (l === editing ? layout : l)) : [...data, layout]);
    setSelectedRecords([]);
    setEditing(undefined);
  }

  const deleteRecord = (record) => {
    props.onChange(data.filter((l) => l !== record));
    setSelectedRecords([]);
  }

  const deleteSelectedRecords = () => {
    props.onChange(data.filter((l) => !selectedRecords.includes(l)));
    setSelectedRecords([]);
  }

  const columns = useMemo(
    () => [
      { accessor: 'format', title: 'Formato', width: 180 },
      { accessor: 'orientation', title: 'Orientação', width: '100%' },
      {
        accessor: 'actions',
        title: '',
        width: 120,
        render: (record) => (
          <Group gap="xs" wrap="nowrap" justify="flex-end">
            <ActionIcon type="button" color="success" aria-label="Editar" onClick={() => setEditing(record)}>
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
    [data, selectedRecords]
  );

  return (
    <div>
      { editing !== undefined &&
        <LayoutEditor data={editing}
          pageFormatList={props.pageFormatList}
          pageOrientationList={props.pageOrientationList}
          onHide={() => setEditing(undefined)}
          onSave={onLayoutFormSave} />
      }

      <div className="grid">
        <div className="card col-12">
          <Group justify="flex-end" gap="xs" className="mb-4">
            <Button type="button" color="success" leftSection={<i className="pi pi-plus" />}
              onClick={() => setEditing(null)}>Novo</Button>
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

          <DataGrid
            idAccessor={layoutKey}
            records={data}
            onRowReorder={props.onChange}
            selectedRecords={selectedRecords}
            onSelectedRecordsChange={setSelectedRecords}
            columns={columns}
            noRecordsText="Não foram encontrados registos."
          />
        </div>
      </div>
    </div>
  )

}

export default PrintLayoutsEditor;
