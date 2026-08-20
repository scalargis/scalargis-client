import React, { useState, useEffect, Component } from "react";
import { ActionIcon, Button, Checkbox, Group, TextInput, Tooltip, Alert } from '@mantine/core';
import { CollapsiblePanel, ConfirmPopover, Dialog, useIsMobile, IconInfoCircle, IconX, IconCheck, IconTrash, IconPencil, IconList, IconPlusCircle } from '@scalargis/ui';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useForm, Controller } from 'react-hook-form';
import { ReorderGroups, ReorderFields, getItemStyle, getGroupListStyle, getFieldListStyle } from "./utils";


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

const InfoMessage = ({ text }) => (
  <Alert color="informative" py="xs" className="w-full">
    <Group justify="center" gap="xs" wrap="nowrap">
      <IconInfoCircle />
      <span>{text}</span>
    </Group>
  </Alert>
);

const FieldFormEditor = props => {
  const isMobile = useIsMobile();

  const [field, setField] = useState(props.data ? {...props.data} : {});

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

  const onSave = (formData) => {
    props.onSave(formData);
  }

  useEffect(() => {
    setField({...props.data});
  }, [props.data]);

  return (
    <Dialog title="Edição de Campo" opened={props.show} size={isMobile ? '90%' : '45vw'} onClose={() => { props.onHide(); }}>
      <form>
        <div className="grid formgrid">
          <div className="field col-12">
            <Group gap="xs" align="flex-end" wrap="nowrap">
              <TextInput id="key" label="Chave" style={{ flex: 1 }}
                error={fieldError(errors, 'key')}
                {...register("key", { required: 'Campo obrigatório.',  pattern: /^(?![0-9])[a-zA-Z0-9$_]+$/i })} />
              <Tooltip multiline w={340}
                label={<span>O campo <i>chave</i> é de preenchimento obrigatório e serve como identificador único de cada campo.
                  Deverá ser preenchido com uma cadeia de caracteres, sem espaços.</span>}>
                <ActionIcon type="button" variant="subtle" size="input-md" aria-label="Ajuda sobre o campo chave"
                  onClick={(e)=>e.preventDefault()}>
                  <IconInfoCircle />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>
          <div className="field col-12">
            <TextInput id="title" label="Título" className="w-full"
              error={fieldError(errors, 'title')}
              {...register("title", { required: 'Campo obrigatório.' })} />
          </div>
          <div className="field col-12">
            <TextInput id="header" label="Cabeçalho" className="w-full" {...register("header")} />
          </div>
          <div className="grid formgrid col-12">
            <div className="field col-6">
              <Controller name="required" control={control}
                render={({ field }) => (
                  <Checkbox size="md" id="required" label="Preenchimento obrigatório"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.currentTarget.checked)} />
                )}
              />
            </div>
            <div className="field col-6">
              <Controller name="showLabel" control={control}
                render={({ field }) => (
                  <Checkbox size="md" id="showLabel" label="Mostrar título"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.currentTarget.checked)} />
                )}
              />
            </div>
          </div>

          <div className="field col-12"><hr /></div>

          <div className="field col-6">
            <Controller name="active" control={control}
              render={({ field }) => (
                <Checkbox size="md" id="active" label="Activo"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)} />
              )}
            />
          </div>
        </div>

        <Group justify="flex-end" gap="xs" className="mt-4">
          <Button type="button" variant="subtle" leftSection={<IconX />}
            onClick={() => props.onHide()}>Fechar</Button>
          <Button type="button" leftSection={<IconCheck />}
            onClick={handleSubmit((d) => onSave(d))}>Gravar</Button>
        </Group>
      </form>
    </Dialog>
  );
}

const GroupFormEditor = props => {
  const isMobile = useIsMobile();

  const [group, setGroup] = useState(props.data ? {...props.data} : {});

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

  const onSave = (formData) => {
    props.onSave(formData);
  }

  useEffect(() => {
    setGroup({...props.data});
  }, [props.data]);

  return (
  <Dialog title="Edição de Grupo" opened={props.show} size={isMobile ? '90%' : '45vw'} onClose={() => { props.onHide(); }}>
    <form>
      <div className="grid formgrid">
        <div className="field col-12">
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <TextInput id="key" label="Chave" style={{ flex: 1 }}
              error={fieldError(errors, 'key')}
              {...register("key", { required: 'Campo obrigatório.',  pattern: /^(?![0-9])[a-zA-Z0-9$_]+$/i })} />
            <Tooltip multiline w={340}
              label={<span>O campo <i>chave</i> é de preenchimento obrigatório e serve como identificador único de cada grupo.
                Deverá ser preenchido com uma cadeia de caracteres, sem espaços.</span>}>
              <ActionIcon type="button" variant="subtle" size="input-md" aria-label="Ajuda sobre o campo chave"
                onClick={(e)=>e.preventDefault()}>
                <IconInfoCircle />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>
        <div className="field col-12">
          <TextInput id="title" label="Título" className="w-full"
            error={fieldError(errors, 'title')}
            {...register("title", { required: 'Campo obrigatório.' })} />
        </div>

        <div className="field col-12"><hr /></div>

        <div className="field col-12">
          <Controller name="active" control={control}
            render={({ field }) => (
              <Checkbox size="md" id="active" label="Activo"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)} />
            )}
          />
        </div>
      </div>

      <Group justify="flex-end" gap="xs" className="mt-4">
        <Button type="button" variant="subtle" leftSection={<IconX />}
          onClick={() => props.onHide()}>Fechar</Button>
        <Button type="button" leftSection={<IconCheck />}
          onClick={handleSubmit((d) => onSave(d))}>Gravar</Button>
      </Group>
    </form>
  </Dialog>
  );

};


const GroupFields = props => {
  const { group, groupNum } = props;

  const [fieldEdition, setFieldEdition] = useState();
  const [showFieldForm, setShowFieldForm] = useState(false);

  function onFieldFormHide () {
    setShowFieldForm(false);
    setFieldEdition(null);
  }

  function onFieldFormSave (field) {
    const key = field.key;

    //Check key already exists
    if (fieldEdition.key !== key && group.data.fields[key]) return;

    const new_fields = {};
    Object.keys(group.data.fields).forEach((k) => {
      if (fieldEdition.key === k) {
        new_fields[field.key] = (({ active, title, header, showLabel, required }) => ({ active, title, header, showLabel, required }))(field);
      } else {
        new_fields[k] = (({ active, title, header, showLabel, required }) => ({ active, title, header, showLabel, required }))(group.data.fields[k]);
      }
    });

    props.onChange(group.id, new_fields);

    setShowFieldForm(false);
  }

  return (
    <Droppable droppableId={`droppable${group.id}`} type={`${groupNum}`}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={getFieldListStyle(snapshot.isDraggingOver)}
        >
          {Object.keys(group.data.fields || {}).length === 0 &&
            <div className="col-12">
                <InfoMessage text="Clique em '+' para adicionar um campo" />
            </div>
          }

          {Object.entries(group.data.fields).map((g,i) => {
              return {id: g[0], ...g[1]}
            }).map((field, index) => {
              return (
                <Draggable
                  key={`${groupNum}${index}`}
                  draggableId={`${groupNum}${index}`}
                  index={index}
                  style={{ "border": "solid 1px lightgray", marginTop: 3 }}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={getItemStyle(
                        snapshot.isDragging,
                        provided.draggableProps.style
                      )}
                      className="shadow-1"
                    >
                      <div style={{marginBottom: 5 }}>
                        <div style={{ float: "left", paddingTop: 6 }}>
                          <span style={{paddingLeft: "15px"}}>{field.id}</span>
                          <span {...provided.dragHandleProps}>
                            <i className="fas fa-arrows-alt" style={{ float: "left", "paddingTop": 3 }}></i>
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <ConfirmPopover
                            message="Tem a certeza que pretende eliminar?"
                            severity="danger"
                            acceptLabel="Sim"
                            rejectLabel="Não"
                            onConfirm={() => {
                              const new_fields = {...group.data.fields};
                              delete new_fields[field.id];
                              props.onChange(group.id, new_fields);
                            }}
                          >
                            <ActionIcon type="button" variant="subtle" color="danger" aria-label="Eliminar campo" title="Eliminar campo">
                              <IconTrash />
                            </ActionIcon>
                          </ConfirmPopover>
                          <ActionIcon type="button" variant="subtle" color="warning" aria-label="Editar campo" title="Editar campo"
                            onClick={ (e) => {
                              e.preventDefault();
                              setFieldEdition({...field, groupId: group.id, key: field.id});
                              setShowFieldForm(true);
                            }}>
                            <IconPencil />
                          </ActionIcon>
                          </div>
                        </div>

                        { showFieldForm &&
                          <FieldFormEditor data={fieldEdition} show={showFieldForm} onHide={onFieldFormHide} onSave={onFieldFormSave} />
                        }

                        <div className="pt-2">
                          <div className="grid field mb-0">
                            <div className="col-12 md:col-10">
                              <div className="grid">
                                <label className="col-12 md:col-2"><strong>Título: </strong></label>
                                <div className="col-12 md:col-10">
                                    <span>{field.title}</span>
                                </div>
                              </div>
                            </div>
                            <div className="col-12 md:col-2 mt-2">
                              <Checkbox label="Ativo" checked={!!field.active} disabled readOnly />
                            </div>
                          </div>
                          <div className="grid field">
                            <div className="col-12">
                              <div className="grid">
                                <label className="col-12 md:col-2"><strong>Cabeçalho: </strong></label>
                                <div className="col-12 md:col-10">
                                    <span>{field.header}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="grid field">
                            <div className="col-12 md:col-7">
                              <Checkbox label="Preenchimento obrigatório" checked={!!field.required} disabled readOnly />
                            </div>
                            <div className="col-12 md:col-5">
                              <Checkbox label="Mostrar título" checked={!!field.showLabel} disabled readOnly />
                            </div>
                          </div>
                        </div>

                    </div>
                  )}
                </Draggable>
              );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};


const Fields = props => {
  const { fields } = props;

  const [fieldEdition, setFieldEdition] = useState();
  const [showFieldForm, setShowFieldForm] = useState(false);

  function onFieldFormHide () {
    setShowFieldForm(false);
    setFieldEdition(null);
  }

  function onFieldFormSave (field) {
    const key = field.key;

    //Check key already exists
    if (fieldEdition.key !== key && fields[key]) return;

    const new_fields = {};
    Object.keys(fields).forEach((k) => {
      if (fieldEdition.key === k) {
        new_fields[field.key] = (({ active, title, header, showLabel, required }) => ({ active, title, header, showLabel, required }))(field);
      } else {
        new_fields[k] = (({ active, title, header, showLabel, required }) => ({ active, title, header, showLabel, required }))(fields[k]);
      }
    });

    props.onChange(new_fields);

    setShowFieldForm(false);
  }

  return (

    <DragDropContext
      onDragEnd={props.onDragEnd}
    >
      <Droppable droppableId="droppable" type="FIELDS">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            style={getFieldListStyle(snapshot.isDraggingOver)}
          >
            {Object.keys(fields || {}).length === 0 &&
              <div className="col-12">
                  <InfoMessage text="Clique em 'Novo Campo' para adicionar um campo" />
              </div>
            }

            {Object.entries(fields).map((f,i) => {
              return {id: f[0], data: f[1]}
            }).map((field, index) => (
              <Draggable
                key={field.id}
                draggableId={field.id}
                index={index}
                style={{ "border": "solid 1px lightgray", marginTop: 3 }}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={getItemStyle(
                      snapshot.isDragging,
                      provided.draggableProps.style
                    )}
                    className="shadow-1"
                  >
                  <div style={{marginBottom: 5 }}>
                    <div style={{ float: "left", paddingTop: 6 }}>
                      <span style={{paddingLeft: "15px"}}>{field.id}</span>
                      <span {...provided.dragHandleProps}>
                        <i className="fas fa-arrows-alt" style={{ float: "left", "paddingTop": 3 }}></i>
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <ConfirmPopover
                        message="Tem a certeza que pretende eliminar?"
                        severity="danger"
                        acceptLabel="Sim"
                        rejectLabel="Não"
                        onConfirm={() => {
                          const new_fields = {...fields};
                          delete new_fields[field.id];
                          props.onChange(new_fields);
                        }}
                      >
                        <ActionIcon type="button" variant="subtle" color="danger" aria-label="Eliminar campo" title="Eliminar campo">
                          <IconTrash />
                        </ActionIcon>
                      </ConfirmPopover>
                      <ActionIcon type="button" variant="subtle" color="warning" aria-label="Editar campo" title="Editar campo"
                        onClick={ (e) => {
                          e.preventDefault();
                          setFieldEdition({...field.data, key: field.id});
                          setShowFieldForm(true);
                        }}>
                        <IconPencil />
                      </ActionIcon>
                      </div>
                    </div>

                    { showFieldForm &&
                      <FieldFormEditor data={fieldEdition} show={showFieldForm} onHide={onFieldFormHide} onSave={onFieldFormSave} />
                    }

                    <div className="pt-2">
                      <div className="grid field mb-0">
                        <div className="col-12 md:col-10">
                          <div className="grid">
                            <label className="col-12 md:col-2"><strong>Título: </strong></label>
                            <div className="col-12 md:col-10">
                                <span>{field.data.title}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-12 md:col-2 mt-2">
                          <Checkbox label="Ativo" checked={!!field.data.active} disabled readOnly />
                        </div>
                      </div>
                      <div className="grid field">
                        <div className="col-12">
                          <div className="grid">
                            <label className="col-12 md:col-2"><strong>Cabeçalho: </strong></label>
                            <div className="col-12 md:col-10">
                                <span>{field.data.header}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid field">
                        <div className="col-12 md:col-6">
                          <Checkbox label="Preenchimento obrigatório" checked={!!field.data.required} disabled readOnly />
                        </div>
                        <div className="col-12 md:col-6">
                          <Checkbox label="Mostrar título" checked={!!field.data.showLabel} disabled readOnly />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>

  );
};

class FormFieldsEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: props.data || {},
      showGroupForm: false,
      showFieldForm: false,
    };

    this.onDragEnd = this.onDragEnd.bind(this);

    this.onChange = props.onChange.bind(this);
    this.onFieldsChange = this.onFieldsChange.bind(this);
    this.onGroupFieldsChange = this.onGroupFieldsChange.bind(this);

    this.groupEdition = {};
    this.onGroupFormHide = this.onGroupFormHide.bind(this);
    this.onGroupFormSave = this.onGroupFormSave.bind(this);

    this.fieldEdition = {};
    this.onFieldFormHide = this.onFieldFormHide.bind(this);
    this.onFieldFormSave = this.onFieldFormSave.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.data !== state.data) {
      return { data: props.data };
    }
    return null;
  }

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.type === "GROUPS") {
      const groups = ReorderGroups(
        this.state.data.groups,
        result.source.index,
        result.destination.index
      );

      this.onChange({...this.state.data, groups: groups});
    } else if (result.type === "FIELDS") {
      const fields = ReorderFields(
        this.state.data.fields,
        result.source.index,
        result.destination.index
      );

      this.onChange({...this.state.data, fields: fields });
    } else {
      const fields = ReorderFields(
        this.state.data.groups[result.type].fields,
        result.source.index,
        result.destination.index
      );

      const data = JSON.parse(JSON.stringify(this.state.data.groups));
      data[result.type].fields = fields;

      this.onChange({...this.state.data, groups: data });
    }
  }

  onGroupFormHide() {
    this.setState({
      ...this.state,
      showGroupForm: false
    });
  }

  onGroupFormSave(group) {
    const key = group.key;

    //Check key already exists
    if (this.groupEdition.key !== key && this.state.data.groups[key]) return;

    let new_data = {...this.state.data.groups};
    if (new_data[key]) delete new_data[key];
    new_data = {[key]: (({ active, title, fields }) => ({ active, title, fields }))(group), ...new_data};

    this.setState({
      ...this.state,
      showGroupForm: false
    });

    this.onChange({ ...this.state.data, groups: new_data });
  }

  onGroupFieldsChange(groupId, fields) {
    const new_data = {...this.state.data.groups};
    if (new_data[groupId]) {
      new_data[groupId].fields = fields;
      this.onChange({...this.state.data, groups: new_data});
    }
  }

  onFieldsChange(fields) {
    this.onChange({...this.state.data, fields: {...fields}});
  }

  onFieldFormHide() {
    this.setState({
      ...this.state,
      showFieldForm: false
    });
  }

  onFieldFormSave(field) {
    const groupId = field.groupId;
    const key = field.key;

    if (groupId) {
      //Field belongs to a group

      //Check key already exists
      if (this.fieldEdition.key !== key && this.state.data.groups[groupId].fields[key]) return;

      const new_data = {...this.state.data.groups};
      if (new_data[groupId].fields[key]) delete new_data[groupId].fields[key];
      new_data[groupId].fields = {[key]: (({ active, title, header, showLabel, required }) => ({ active, title, header, showLabel, required }))(field), ...new_data[groupId].fields};

      this.setState({
        ...this.state,
        showFieldForm: false
      });

      this.onChange({...this.state.data, groups: new_data});
    } else {
      //Check key already exists
      if (this.fieldEdition.key !== key && this.state.data.fields[key]) return;

      let new_data = {...this.state.data.fields};
      if (new_data[key]) delete new_data[key];
      new_data = {[key]: (({ active, title, header, showLabel, required }) => ({ active, title, header, showLabel, required }))(field), ...new_data};

      this.setState({
        ...this.state,
        showFieldForm: false
      });

      this.onChange({...this.state.data, fields: new_data});
    }
  }


  render() {
    return (

      <div className="grid formgrid">

        { this.state.showFieldForm &&
          <FieldFormEditor data={this.fieldEdition} show={this.state.showFieldForm} onHide={this.onFieldFormHide} onSave={this.onFieldFormSave} />
        }

        <div className="field col-12 md:col-6">
          <CollapsiblePanel header="Campos" toggleable={false}>

            <div className="col-12">

              <div>
                <div className="grid">
                  <div className="col-12 md:col-8">
                  </div>
                  <div className="col-12 md:col-4 mt-2 mb-2 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      leftSection={<IconList />}
                      onClick={()=> {
                        this.fieldEdition = { key: null, active: true, title: null, header: null, showLabel: false};
                        this.setState({
                          ...this.state,
                          showFieldForm: true
                        });
                      }}
                    >Novo Campo</Button>
                  </div>
                </div>
              </div>

              <Fields fields={this.state.data.fields || {}} onDragEnd={this.onDragEnd} onChange={this.onFieldsChange} />

            </div>

          </CollapsiblePanel>
        </div>

        <div className="field col-12 md:col-6">
          <CollapsiblePanel header="Grupos" toggleable={false}>

          <div className="col-12">

            <div>
              { this.state.showGroupForm &&
                <GroupFormEditor data={this.groupEdition} show={this.state.showGroupForm} onHide={this.onGroupFormHide} onSave={this.onGroupFormSave} />
              }

              <div className="grid">
                <div className="col-12 md:col-8">
                </div>
                <div className="col-12 md:col-4 mt-2 mb-2 text-center" >
                  <Button
                    type="button"
                    variant="outline"
                    leftSection={<IconList />}
                    onClick={()=> {
                      this.groupEdition = { key: null, active: true, title: null, fields: {}};
                      this.setState({
                        ...this.state,
                        showGroupForm: true
                      });
                    }}
                  >Novo Grupo</Button>
                </div>
              </div>
            </div>

            <DragDropContext
              onDragEnd={this.onDragEnd}
            >
              <Droppable droppableId="droppable" type="GROUPS">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    style={getGroupListStyle(snapshot.isDraggingOver)}
                  >
                    {Object.keys(this.state.data.groups || {}).length === 0 &&
                      <div className="col-12">
                          <InfoMessage text="Clique em 'Novo Grupo' para adicionar um grupo" />
                      </div>
                    }

                    {Object.entries(this.state.data.groups).map((g,i) => {
                      return {id: g[0], data: g[1]}
                    }).map((group, index) => (
                      <Draggable
                        key={group.id}
                        draggableId={group.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style
                            )}
                            className="shadow-1"
                          >
                            <div>
                              <div style={{ float: "left", paddingTop: "6px" }}>
                                <span style={{paddingLeft: "15px"}}>{group.id}</span>
                                <div {...provided.dragHandleProps} style={{ float: "left", paddingTop: '3px' }}>
                                  <i className="fas fa-arrows-alt" style={{ float: "left" }}></i>
                                </div>
                              </div>
                              <div style={{ textAlign: "right"}}>
                                <ActionIcon type="button" variant="subtle" color="warning" className="mr-2"
                                  aria-label="Adicionar campo" title="Adicionar campo"
                                  onClick={ (e) => {
                                    e.preventDefault();
                                    this.fieldEdition = { groupId: group.id, key: null, active: true, title: null, header: null, showLabel: false, required: false};
                                    this.setState({
                                      ...this.state,
                                      showFieldForm: true
                                    });
                                  }}>
                                  <IconPlusCircle />
                                </ActionIcon>

                                <ConfirmPopover
                                  message="Tem a certeza que pretende eliminar?"
                                  severity="danger"
                                  acceptLabel="Sim"
                                  rejectLabel="Não"
                                  onConfirm={() => {
                                    const new_data = {...this.state.data.groups};
                                    if (new_data[group.id]) delete new_data[group.id];
                                    this.onChange({...this.state.data, groups: new_data});
                                  }}
                                >
                                  <ActionIcon type="button" variant="subtle" color="danger" aria-label="Eliminar grupo" title="Eliminar grupo">
                                    <IconTrash />
                                  </ActionIcon>
                                </ConfirmPopover>
                                <ActionIcon type="button" variant="subtle" color="warning" aria-label="Editar grupo" title="Editar grupo"
                                  onClick={ (e) => {
                                    e.preventDefault();
                                    this.groupEdition = {key: group.id, ...group.data}
                                    this.setState({
                                      ...this.state,
                                      showGroupForm: true
                                    });
                                  }}>
                                  <IconPencil />
                                </ActionIcon>
                              </div>
                            </div>

                            <div><hr className="mt-1 pb-3" /></div>

                            <div>
                              <div className="grid">
                                <div className="col-12 md:col-10">
                                  <div className="grid">
                                    <label className="col-12 md:col-2"><strong>Título: </strong></label>
                                    <div className="col-12 md:col-10">
                                        <span>{group.data.title}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-12 md:col-2 mt-2">
                                  <Checkbox label="Ativo" checked disabled readOnly />
                                </div>
                              </div>
                              <div className="grid">
                                <label className="col-12"><strong>Campos:</strong></label>
                                <div className="col-12">
                                  <GroupFields groupNum={group.id} group={group} onChange={this.onGroupFieldsChange} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            </div>


          </CollapsiblePanel>
        </div>

      </div>

    );
  }
}

export default FormFieldsEditor;
