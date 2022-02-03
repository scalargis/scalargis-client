import React, { useState, useEffect, Component } from "react";
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import {Checkbox} from 'primereact/checkbox';
import { Tooltip } from 'primereact/tooltip';
import { confirmPopup } from 'primereact/confirmpopup';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useForm, Controller } from 'react-hook-form';
import { ReorderGroups, ReorderFields, getItemStyle, getGroupListStyle, getFieldListStyle } from "./utils";


const FieldFormEditor = props => {
  const [field, setField] = useState(props.data ? {...props.data} : {});

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

  const getFormErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].type === 'maxLength') {
         return <small className="p-error">O número de caracteres é superior à dimensão máxima permitida</small>
      } else if (errors[name].type === 'pattern') {
        return <small className="p-error">Formato não permitido</small>
      } else {
        return <small className="p-error">{errors[name].message}</small>
      }
    }      
  };  

  const onSave = (formData) => {
    props.onSave(formData);
  }

  useEffect(() => {
    setField({...props.data});
  }, [props.data]);


  const renderFooter = (name) => {
    return (
        <div>
            <Button 
              label="Fechar"
              icon="pi pi-times"
              onClick={() => props.onHide()} className="p-button-text" />
            <Button 
              label="Gravar"
              icon={"pi pi-check"}
              onClick={handleSubmit((d) => onSave(d))}
              autoFocus />
        </div>
    );
  }

  return (
    <Dialog header={"Edição de Campo"} visible={props.show} style={{ width: '50vw' }} footer={renderFooter} onHide={() => { props.onHide(); }}>
      <form>
        <div className="p-fluid p-formgrid p-grid">
          <div className="p-field p-col-12">
            <label htmlFor="key">Chave</label>
            <div className="p-inputgroup">
              <InputText  id="key" type="text" {...register("key", { required: 'Campo obrigatório.',  pattern: /^(?![0-9])[a-zA-Z0-9$_]+$/i })} className={classNames({ 'p-invalid': errors.key })} />            
              <Tooltip target=".tooltip-form-field-key" autoHide={false}>
                  <div className="p-d-flex p-ai-center">
                      <span style={{minWidth: '5rem'}}>
                        O campo <i>chave</i> é de preenchimento obrigatório e serve como identificador único de cada campo.
                        Deverá ser preenchido com uma cadeia de caracteres, sem espaços.
                      </span>
                  </div>
              </Tooltip>
              <Button type="text" icon="pi pi-info-circle" className="tooltip-form-field-key p-button-rounded p-button-text" onClick={(e)=>e.preventDefault()} />
            </div>
            {getFormErrorMessage(errors, 'key')}
          </div>
          <div className="p-field p-col-12">
            <label htmlFor="title">Título</label>
            <InputText  id="title" type="text" {...register("title", { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.title })} />
            {getFormErrorMessage(errors, 'title')}
          </div>
          <div className="p-field p-col-12">
            <Controller name="required" control={control}
              render={({ field }) => {                      
                return <Checkbox id="required" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
              }}                    
            />          
            <label htmlFor="required" className="p-checkbox-label" style={{display: "inline"}}>Preenchimento obrigatório</label>
          </div>
          
          <div className="p-field p-col-12"><hr /></div>
          
          <div className="p-field p-col-12">
            <Controller name="active" control={control}
              render={({ field }) => {                      
                return <Checkbox id="active" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
              }}                    
            />          
            <label htmlFor="active" className="p-checkbox-label" style={{display: "inline"}}>Activo</label>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

const GroupFormEditor = props => {
  const [group, setGroup] = useState(props.data ? {...props.data} : {});

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

  const getFormErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].type === 'maxLength') {
         return <small className="p-error">O número de caracteres é superior à dimensão máxima permitida</small>
      } else if (errors[name].type === 'pattern') {
        return <small className="p-error">Formato não permitido</small>
      } else {
        return <small className="p-error">{errors[name].message}</small>
      }
    }      
  };  

  const onSave = (formData) => {
    props.onSave(formData);
  }  

  useEffect(() => {
    setGroup({...props.data});
  }, [props.data]);


  const renderFooter = (name) => {
    return (
        <div>
            <Button 
              label="Fechar"
              icon="pi pi-times"
              onClick={() => props.onHide()} className="p-button-text" />
            <Button 
              label="Gravar"
              icon={"pi pi-check"}
              onClick={handleSubmit((d) => onSave(d))}
              autoFocus />
        </div>
    );
  }

  return (
  <Dialog header={"Edição de Grupo"} visible={props.show} style={{ width: '50vw' }} footer={renderFooter} onHide={() => { props.onHide(); }}>
    <form>
      <div className="p-fluid p-formgrid p-grid">
        <div className="p-field p-col-12">
          <label htmlFor="key">Chave</label>
          <div className="p-inputgroup">
            <InputText  id="key" type="text" {...register("key", { required: 'Campo obrigatório.',  pattern: /^(?![0-9])[a-zA-Z0-9$_]+$/i })} className={classNames({ 'p-invalid': errors.key })} />            
            <Tooltip target=".tooltip-form-field-key" autoHide={false}>
                <div className="p-d-flex p-ai-center">
                    <span style={{minWidth: '5rem'}}>
                      O campo <i>chave</i> é de preenchimento obrigatório e serve como identificador único de cada grupo.
                      Deverá ser preenchido com uma cadeia de caracteres, sem espaços.
                    </span>
                </div>
            </Tooltip>
            <Button type="text" icon="pi pi-info-circle" className="tooltip-form-field-key p-button-rounded p-button-text" onClick={(e)=>e.preventDefault()} />
          </div>
          {getFormErrorMessage(errors, 'key')}
        </div>
        <div className="p-field p-col-12">
          <label htmlFor="title">Título</label>
          <InputText  id="title" type="text" {...register("title", { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.title })} />
          {getFormErrorMessage(errors, 'title')}
        </div>

        <div className="p-field p-col-12"><hr /></div>

        <div className="p-field p-col-12">
          <Controller name="active" control={control}
            render={({ field }) => {                      
              return <Checkbox id="active" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
            }}                    
          />          
          <label htmlFor="active" className="p-checkbox-label" style={{display: "inline"}}>Activo</label>
        </div>
      </div>
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

    let new_fields = {...group.data.fields};
    if (new_fields[fieldEdition.key]) delete new_fields[fieldEdition.key];
    new_fields = {[key]: (({ active, title, header, required }) => ({ active, title, header, required }))(field), ...new_fields};

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
            <div className="p-fluid">
              <div className="p-col-12">
                  <Message severity="info" text="Clique em '+' para adicionar um campo" />
              </div>
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
                      className="p-shadow-1"
                    >
                      <div style={{marginBottom: 5 }}>
                        <div style={{ float: "left", paddingTop: 6 }}>
                          <span style={{paddingLeft: "15px"}}>{field.id}</span>
                          <span {...provided.dragHandleProps}>
                            <i className="fas fa-arrows-alt" style={{ float: "left", "paddingTop": 3 }}></i>
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Button type="text" icon="pi pi-trash" 
                            className="p-button-rounded p-button-text p-button-danger"
                            tooltip="Eliminar campo"
                            tooltipOptions={{position: 'bottom'}}                            
                            onClick={ (e) => {
                              e.preventDefault();
                              confirmPopup({
                                  target: e.currentTarget,
                                  message: 'Tem a certeza que pretende eliminar?',
                                  icon: 'pi pi-exclamation-triangle',
                                  acceptLabel: 'Sim',
                                  rejectLabel: 'Não',
                                  accept: () => {                                      
                                    const new_fields = {...group.data.fields};
                                    delete new_fields[field.id];
                                    props.onChange(group.id, new_fields);
                                  }
                              });
                            }} />
                            <Button type="text" icon="pi pi-pencil" 
                              className="p-button-rounded p-button-text p-button-warning"
                              tooltip="Editar campo"
                              tooltipOptions={{position: 'bottom'}}                              
                              onClick={ (e) => {
                                e.preventDefault();
                                setFieldEdition({...field, groupId: group.id, key: field.id});
                                setShowFieldForm(true);                                     
                              }} />                                
                          </div>
                        </div>

                        { showFieldForm && 
                          <FieldFormEditor data={fieldEdition} show={showFieldForm} onHide={onFieldFormHide} onSave={onFieldFormSave} />
                        }

                        <div className="p-fluid p-pt-2">
                          <div className="p-field p-grid p-mb-0">
                            <div class="p-col-10">
                              <div className="p-grid">
                                <label className="p-col-12 p-md-2"><strong>Título: </strong></label>
                                <div className="p-col-12 p-md-10">
                                    <span>{field.title}</span>
                                </div>
                              </div>
                            </div>
                            <div class="p-col-2">
                              <div className="p-grid">
                                <div className="p-field-checkbox">
                                    <Checkbox checked={field.active} disabled/>
                                    <label>Ativo</label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="p-field p-grid">
                            <div class="p-col-12">
                              <div className="p-grid">
                                <label className="p-col-12 p-md-2"><strong>Cabeçalho: </strong></label>
                                <div className="p-col-12 p-md-10">
                                    <span>{field.header}</span>
                                </div>
                              </div>                       
                            </div>
                          </div>
                          <div className="p-field p-grid">
                            <div class="p-col-12">
                              <div className="p-field-checkbox">
                                  <Checkbox checked={field.required} disabled/>
                                  <label>Preenchimento obrigatório</label>
                              </div>
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

    let new_fields = {...fields};
    if (fieldEdition.key !== key) delete new_fields[fieldEdition.key];
    new_fields[key] =  (({ active, title, header, required }) => ({ active, title, header, required }))(field);

    props.onChange(new_fields);

    setShowFieldForm(false);
  }

  return (


  <DragDropContext
    onDragEnd={props.onDragEnd}
    //onDragUpdate={this.onDragUpdate}
  >
    <Droppable droppableId="droppable" type="FIELDS">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={getFieldListStyle(snapshot.isDraggingOver)}
        >
          {Object.keys(fields || {}).length === 0 &&
            <div className="p-fluid">
              <div className="p-col-12">
                  <Message severity="info" text="Clique em 'Novo Campo' para adicionar um campo" />
              </div>
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
                  className="p-shadow-1"
                >
                <div style={{marginBottom: 5 }}>
                  <div style={{ float: "left", paddingTop: 6 }}>
                    <span style={{paddingLeft: "15px"}}>{field.id}</span>
                    <span {...provided.dragHandleProps}>
                      <i className="fas fa-arrows-alt" style={{ float: "left", "paddingTop": 3 }}></i>
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Button type="text" icon="pi pi-trash" 
                      className="p-button-rounded p-button-text p-button-danger"
                      tooltip="Eliminar campo"
                      tooltipOptions={{position: 'bottom'}}                            
                      onClick={ (e) => {
                        e.preventDefault();
                        confirmPopup({
                            target: e.currentTarget,
                            message: 'Tem a certeza que pretende eliminar?',
                            icon: 'pi pi-exclamation-triangle',
                            acceptLabel: 'Sim',
                            rejectLabel: 'Não',
                            accept: () => {                                      
                              const new_fields = {...fields};
                              delete new_fields[field.id];
                              props.onChange(new_fields);
                            }
                        });
                      }} />
                      <Button type="text" icon="pi pi-pencil" 
                        className="p-button-rounded p-button-text p-button-warning"
                        tooltip="Editar campo"
                        tooltipOptions={{position: 'bottom'}}                              
                        onClick={ (e) => {
                          e.preventDefault();
                          setFieldEdition({...field.data, key: field.id});
                          setShowFieldForm(true);                                     
                        }} />                                
                    </div>
                  </div>

                  { showFieldForm && 
                    <FieldFormEditor data={fieldEdition} show={showFieldForm} onHide={onFieldFormHide} onSave={onFieldFormSave} />
                  }

                  <div className="p-fluid p-pt-2">
                    <div className="p-field p-grid p-mb-0">
                      <div class="p-col-10">
                        <div className="p-grid">
                          <label className="p-col-12 p-md-2"><strong>Título: </strong></label>
                          <div className="p-col-12 p-md-10">
                              <span>{field.data.title}</span>
                          </div>
                        </div>
                      </div>
                      <div class="p-col-2">
                        <div className="p-grid">
                          <div className="p-field-checkbox">
                              <Checkbox checked={field.data.active} disabled/>
                              <label>Ativo</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-field p-grid">
                      <div class="p-col-12">
                        <div className="p-grid">
                          <label className="p-col-12 p-md-2"><strong>Cabeçalho: </strong></label>
                          <div className="p-col-12 p-md-10">
                              <span>{field.data.header}</span>
                          </div>
                        </div>                       
                      </div>
                    </div>
                    <div className="p-field p-grid">
                      <div class="p-col-12">
                        <div className="p-field-checkbox">
                            <Checkbox checked={field.data.required} disabled/>
                            <label>Preenchimento obrigatório</label>
                        </div>
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

  componentWillReceiveProps(props) {
    this.setState({ data: props.data });
  }

  /*
  componentDidUpdate() {
  }
  */

  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.type === "GROUPS") {
      const groups = ReorderGroups(
        //this.state.data,
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
    let new_data = {...this.state.data.groups};
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

      let new_data = {...this.state.data.groups};
      if (new_data[groupId].fields[key]) delete new_data[groupId].fields[key];
      new_data[groupId].fields = {[key]: (({ active, title, header, required }) => ({ active, title, header, required }))(field), ...new_data[groupId].fields};

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
      new_data = {[key]: (({ active, title, header, required }) => ({ active, title, header, required }))(field), ...new_data};

      this.setState({
        ...this.state,
        showFieldForm: false
      });

      this.onChange({...this.state.data, fields: new_data});
    }
  }  


  render() {
    return (

      <div className="p-fluid p-formgrid p-grid">

        { this.state.showFieldForm && 
          <FieldFormEditor data={this.fieldEdition} show={this.state.showFieldForm} onHide={this.onFieldFormHide} onSave={this.onFieldFormSave} />
        }

        <div className="p-field p-col-12 p-md-6">
          <Panel header="Campos">

            <div class="p-col-12">

              <div>
                <div className="p-grid">
                  <div className="p-col-12 p-md-8">
                  </div>
                  <div className="p-col-12 p-md-4 p-mt-2 p-mb-2" >
                    <Button
                      type="button"
                      label="Novo Campo"
                      icon="pi pi-list" 
                      className="p-button-outlined"
                      onClick={()=> {
                        this.fieldEdition = { key: null, active: true, title: null, header: null};
                        this.setState({
                          ...this.state,              
                          showFieldForm: true
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              <Fields fields={this.state.data.fields || {}} onDragEnd={this.onDragEnd} onChange={this.onFieldsChange} />

            </div>

          </Panel>
        </div>

        <div className="p-field p-col-12 p-md-6">
          <Panel header="Grupos">

          <div class="p-col-12">

            <div>
              { this.state.showGroupForm && 
                <GroupFormEditor data={this.groupEdition} show={this.state.showGroupForm} onHide={this.onGroupFormHide} onSave={this.onGroupFormSave} />
              }

              <div className="p-grid">
                <div className="p-col-12 p-md-8">
                </div>           
                <div className="p-col-12 p-md-4 p-mt-2 p-mb-2" >
                  <Button
                    type="button"
                    label="Novo Grupo"
                    icon="pi pi-list" 
                    className="p-button-outlined"
                    onClick={()=> {
                      this.groupEdition = { key: null, active: true, title: null, fields: {}};
                      this.setState({
                        ...this.state,              
                        showGroupForm: true
                      });
                    }}                 
                  />
                </div>
              </div>
            </div>

            <DragDropContext
              onDragEnd={this.onDragEnd}
              //onDragUpdate={this.onDragUpdate}          
            >
              <Droppable droppableId="droppable" type="GROUPS">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    style={getGroupListStyle(snapshot.isDraggingOver)}
                  >
                    {Object.keys(this.state.data.groups || {}).length === 0 &&
                      <div className="p-fluid">
                        <div className="p-col-12">
                            <Message severity="info" text="Clique em 'Novo Grupo' para adicionar um grupo" />
                        </div>
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
                            className="p-shadow-1"
                          >
                            <div>
                              <div style={{ float: "left", paddingTop: "6px" }}>
                                <span style={{paddingLeft: "15px"}}>{group.id}</span>
                                <div {...provided.dragHandleProps} style={{ float: "left", paddingTop: '3px' }}>
                                  <i className="fas fa-arrows-alt" style={{ float: "left" }}></i>
                                </div>
                              </div>
                              <div style={{ textAlign: "right"}}>
                                <Button type="text" icon="pi pi-plus-circle" 
                                  className="p-button-rounded p-button-text p-button-warning p-mr-2"
                                  tooltip="Adicionar campo"
                                  tooltipOptions={{position: 'bottom'}}
                                  onClick={ (e) => {
                                    e.preventDefault();
                                    this.fieldEdition = { groupId: group.id, key: null, active: true, title: null, header: null, required: false};
                                    this.setState({
                                      ...this.state,              
                                      showFieldForm: true
                                    });
                                  }} />

                                <Button type="text" icon="pi pi-trash" 
                                  className="p-button-rounded p-button-text p-button-danger"
                                  tooltip="Eliminar grupo"
                                  tooltipOptions={{position: 'bottom'}}
                                  onClick={ (e) => {
                                    e.preventDefault();
                                    confirmPopup({
                                        target: e.currentTarget,
                                        message: 'Tem a certeza que pretende eliminar?',
                                        icon: 'pi pi-exclamation-triangle',
                                        acceptLabel: 'Sim',
                                        rejectLabel: 'Não',
                                        accept: () => { 
                                          const new_data = {...this.state.data.groups};
                                          if (new_data[group.id]) delete new_data[group.id];
                                          this.onChange({...this.state.data, groups: new_data});
                                        }
                                    });
                                  }} />                            
                                <Button type="text" icon="pi pi-pencil" 
                                  className="p-button-rounded p-button-text p-button-warning"
                                  tooltip="Editar grupo"
                                  tooltipOptions={{position: 'bottom'}}
                                  onClick={ (e) => {
                                    e.preventDefault();
                                    this.groupEdition = {key: group.id, ...group.data}
                                    this.setState({
                                      ...this.state,
                                      showGroupForm: true
                                    }); 
                                  }} />
                              </div>                        
                            </div>

                            <div><hr className="p-mt-1 p-pb-3" /></div>

                            <div className="p-fluid">
                              <div className="p-grid">
                                <div class="p-col-10">
                                  <div className="p-grid">
                                    <label className="p-col-12 p-md-2"><strong>Título: </strong></label>
                                    <div className="p-col-12 p-md-10">
                                        <span>{group.data.title}</span>
                                    </div>
                                  </div>
                                </div>
                                <div class="p-col-2">
                                  <div className="p-grid">
                                    <div className="p-field-checkbox">
                                        <Checkbox checked={true} disabled/>
                                        <label>Ativo</label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="p-grid">
                                <label className="p-col-12"><strong>Campos:</strong></label>
                                <div className="p-col-12">
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


          </Panel>
        </div>
        
      </div>

    );
  }
}

export default FormFieldsEditor;