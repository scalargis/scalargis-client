import React, { useState, useEffect, Component } from "react";
import { Button } from 'primereact/button';
import { confirmPopup } from 'primereact/confirmpopup';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';
import { MultiSelect } from 'primereact/multiselect';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { getItemStyle, getFieldListStyle } from "./utils";


function RecordSelector(props) {

  const [records, setRecords] = useState(props?.data ? [...props.data] : []);

  const [availableRecords, setAvailableRecords] = useState(props.list || []);
  const [selectedRecords, setSelectedRecords] = useState(null);
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    setAvailableRecords([...props.list]);
  }, [props.list]);

  useEffect(() => {
    setRecords([...props.data]);
  }, [props.data]);


  const addRecords = () => {
    if (!availableRecords) return;

    let new_records = availableRecords.filter(v => selectedRecords.includes(v.id));
    new_records = [...new_records, ...props.data];
    props.onChange(new_records);

    setSelectedRecords(null);
  }
  
  const itemTemplate = (option) => {
    return (
      <div>
        <div>{`[${option.code}] ${option.title}`}</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="p-card p-p-2">
        <div className="p-field p-col-12 p-pl-0">
          <MultiSelect value={selectedRecords || []} 
            options={(availableRecords || []).filter(p => !(records || []).map(f=>f.id).includes(p.id))} 
            optionLabel="title" optionValue="id" display="chip" showClear
            itemTemplate={itemTemplate}
            filter filterBy="code,title" filterValue={filterValue} 
            onFilterValueChange={(e) => setFilterValue(e.value)}
            emptyFilterMessage="Não foram encontrados registos"
            onChange={(e) => setSelectedRecords(e.value)} placeholder="Selecionar" />
        </div>              
        <div className="p-grid">
          <div className="p-col"></div>
          <div className="p-col">
              <Button label="Adicionar" type="button" 
                disabled={(!selectedRecords || selectedRecords.length === 0)}
              onClick={addRecords} />
          </div>
          <div className="p-col"></div>
        </div>
      </div>
    </React.Fragment>
  );
}


const ListChilds = props => {

  const { type } = props;
  const list = props.data;

  if (!list || list.length === 0) {
    return (
      <div>
        <Message severity="info" text="Selecione uma ou mais opções e clique em 'Adicionar'" />
      </div>
    )
  } else {
    return (
      <DragDropContext
        onDragEnd={(result) => {
          // dropped outside the list
          if (!result.destination) return;
    
          const new_list = [...list];
          var element = new_list[result.source.index];
          new_list.splice(result.source.index, 1);
          new_list.splice(result.destination.index, 0, element);
    
          props.onChange(new_list);
        }}
        //onDragUpdate={}
      >
        <Droppable droppableId="droppable" type={type}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              style={getFieldListStyle(snapshot.isDraggingOver)}
            >
    
              {list.map((item, index) => (
                <Draggable
                  key={item.id.toString()}
                  draggableId={item.id.toString()}
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
                        <span style={{paddingLeft: "15px"}}>{item.code}</span>
                        <span {...provided.dragHandleProps}>
                          <i className="fas fa-arrows-alt" style={{ float: "left", "paddingTop": 3 }}></i>
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Button type="text" icon="pi pi-times" 
                          className="p-button-rounded p-button-text p-button-danger"
                          tooltip="Remover"
                          tooltipOptions={{position: 'bottom'}}                            
                          onClick={ (e) => {
                            e.preventDefault();
                            confirmPopup({
                                target: e.currentTarget,
                                message: 'Tem a certeza que pretende remover?',
                                icon: 'pi pi-exclamation-triangle',
                                acceptLabel: 'Sim',
                                rejectLabel: 'Não',
                                accept: () => {                                      
                                  const new_prints = list.filter(p => p.id !== item.id);
                                  props.onChange(new_prints);
                                }
                            });
                          }} />                               
                        </div>
                      </div>
    
                      <div className="p-fluid p-pt-2">
                        <div className="p-field p-grid p-mb-0">
                          <div class="p-col-12">
                            <div className="p-grid">
                              <label className="p-col-12 p-md-2"><strong>Título: </strong></label>
                              <div className="p-col-12 p-md-10">
                                  <span>{item.title}</span>
                              </div>
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
  }
  
};

class PrintGroupChildsEditor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: props.data || {},
      printsList: props.printsList || [],
      groupsList: props.groupsList || [],
      showGroupForm: false,
      showFieldForm: false,
    };

    this.onChange = props.onChange.bind(this);
    this.onPrintsChange = this.onPrintsChange.bind(this);
    this.onGroupsChange = this.onGroupsChange.bind(this); 
  }

  componentWillReceiveProps(props) {
    this.setState({ data: props.data });
  }

  /*
  componentDidUpdate() {
  }
  */

  onGroupsChange(groups) {
    console.log(groups);
    this.onChange({...this.state.data, groups: [...groups]});
  }

  onPrintsChange(prints) {
    console.log(prints);
    this.onChange({...this.state.data, prints: [...prints]});
  } 


  render() {
    return (

      <div className="p-fluid p-formgrid p-grid">

        <div className="p-field p-col-12 p-md-6">
          <Panel header="Plantas">
            <div class="p-col-12">
              <div className="p-grid p-mb-4">
                <div className="p-col-12">
                  <RecordSelector 
                    data={this.state.data.prints}
                    list={this.state.printsList}
                    onChange={(data) => {
                      this.onPrintsChange(data);
                    }}
                  />
                </div>               
              </div>
              <div className="p-grid">
                <div className="p-col-12">
                  <div className="p-card p-p-2">
                    <ListChilds
                      data={this.state.data.prints}
                      type="PRINTS"
                      onChange={(data) => {
                        this.onPrintsChange(data);                     
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>           
          </Panel>          
        </div>

        <div className="p-field p-col-12 p-md-6">
          <Panel header="Grupos">
            <div class="p-col-12">
              <div className="p-grid p-mb-4">
                <div className="p-col-12">
                  <RecordSelector 
                    data={this.state.data.groups}
                    list={this.state.groupsList}
                    onChange={(data) => {
                      this.onGroupsChange(data);
                    }}
                  />
                </div>               
              </div>
              <div className="p-grid">
                <div className="p-col-12">
                  <div className="p-card p-p-2">
                    <ListChilds
                      data={this.state.data.groups}
                      type="GROUPS"
                      onChange={(data) => {
                        this.onGroupsChange(data);                      
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>           
          </Panel>
        </div>
        
      </div>

    );
  }
}

export default PrintGroupChildsEditor;