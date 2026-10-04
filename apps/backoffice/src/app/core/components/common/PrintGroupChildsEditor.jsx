import React, { useState, useEffect, Component } from "react";
import { ActionIcon, Alert, Button, Group, MultiSelect, Paper } from '@mantine/core';
import { CollapsiblePanel, ConfirmPopover, IconInfoCircle, IconX } from '@scalargis/ui';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getItemStyle, getFieldListStyle } from "./utils";


function RecordSelector(props) {

  const [records, setRecords] = useState(props?.data ? [...props.data] : []);

  const [availableRecords, setAvailableRecords] = useState(props.list || []);
  const [selectedRecords, setSelectedRecords] = useState(null);

  useEffect(() => {
    setAvailableRecords([...props.list]);
  }, [props.list]);

  useEffect(() => {
    setRecords([...props.data]);
  }, [props.data]);


  // MultiSelect exchanges string values; ids are numbers everywhere else.
  const addRecords = () => {
    if (!availableRecords || !selectedRecords) return;

    const ids = selectedRecords.map(Number);
    let new_records = availableRecords.filter(v => ids.includes(v.id));
    new_records = [...new_records, ...props.data];
    props.onChange(new_records);

    setSelectedRecords(null);
  }

  const options = (availableRecords || [])
    .filter(p => !(records || []).map(f=>f.id).includes(p.id))
    .map(p => ({ value: String(p.id), label: p.title || '', code: p.code }));

  return (
    <Paper p="xs">
        <div className="field col-12 pl-0">
          <MultiSelect
            data={options}
            value={selectedRecords || []}
            onChange={(value) => setSelectedRecords(value.length ? value : null)}
            placeholder="Selecionar"
            renderOption={({ option }) => <div>{`[${option.code}] ${option.label}`}</div>}
            filter={({ options, search }) => {
              const query = (search || '').toLowerCase().trim();
              if (!query) return options;
              return options.filter((o) =>
                `${o.code} ${o.label}`.toLowerCase().includes(query)
              );
            }}
            nothingFoundMessage="Não foram encontrados registos"
            searchable clearable />
        </div>
        <div className="grid">
          <div className="col"></div>
          <div className="col">
              <Button type="button"
                disabled={(!selectedRecords || selectedRecords.length === 0)}
              onClick={addRecords}>Adicionar</Button>
          </div>
          <div className="col"></div>
        </div>
      </Paper>
  );
}


const ListChilds = props => {

  const { type } = props;
  const list = props.data;

  if (!list || list.length === 0) {
    return (
      <div>
        <Alert color="informative" py="xs">
          <Group justify="center" gap="xs" wrap="nowrap">
            <IconInfoCircle />
            <span>Selecione uma ou mais opções e clique em 'Adicionar'</span>
          </Group>
        </Alert>
      </div>
    )
  } else {
    return (
      <DragDropContext
        onDragEnd={(result) => {
          // dropped outside the list
          if (!result.destination) return;

          const new_list = [...list];
          const element = new_list[result.source.index];
          new_list.splice(result.source.index, 1);
          new_list.splice(result.destination.index, 0, element);

          props.onChange(new_list);
        }}
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
                      className="shadow-1"
                    >
                    <div style={{marginBottom: 5 }}>
                      <div style={{ float: "left", paddingTop: 6 }}>
                        <span style={{paddingLeft: "15px"}}>{item.code}</span>
                        <span {...provided.dragHandleProps}>
                          <i className="fas fa-arrows-alt" style={{ float: "left", "paddingTop": 3 }}></i>
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <ConfirmPopover
                          message="Tem a certeza que pretende remover?"
                          severity="danger"
                          acceptLabel="Sim"
                          rejectLabel="Não"
                          onConfirm={() => {
                            const new_prints = list.filter(p => p.id !== item.id);
                            props.onChange(new_prints);
                          }}
                        >
                          <ActionIcon type="button" variant="subtle" color="danger" aria-label="Remover" title="Remover">
                            <IconX />
                          </ActionIcon>
                        </ConfirmPopover>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="field grid mb-0">
                          <div className="col-12">
                            <div className="grid">
                              <label className="col-12 md:col-2"><strong>Título: </strong></label>
                              <div className="col-12 md:col-10">
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

  static getDerivedStateFromProps(props, state) {
    if (props.data !== state.data) {
      return { data: props.data };
    }
    return null;
  }

  onGroupsChange(groups) {
    this.onChange({...this.state.data, groups: [...groups]});
  }

  onPrintsChange(prints) {
    this.onChange({...this.state.data, prints: [...prints]});
  }


  render() {
    return (

      <div className="formgrid grid">

        <div className="field col-12 md:col-6">
          <CollapsiblePanel header="Plantas" toggleable={false}>
            <div className="col-12">
              <div className="grid mb-4">
                <div className="col-12">
                  <RecordSelector
                    data={this.state.data.prints}
                    list={this.state.printsList}
                    onChange={(data) => {
                      this.onPrintsChange(data);
                    }}
                  />
                </div>
              </div>
              <div className="grid">
                <div className="col-12">
                  <Paper p="xs">
                    <ListChilds
                      data={this.state.data.prints}
                      type="PRINTS"
                      onChange={(data) => {
                        this.onPrintsChange(data);
                      }}
                    />
                  </Paper>
                </div>
              </div>
            </div>
          </CollapsiblePanel>
        </div>

        <div className="field col-12 md:col-6">
          <CollapsiblePanel header="Grupos" toggleable={false}>
            <div className="col-12">
              <div className="grid mb-4">
                <div className="col-12">
                  <RecordSelector
                    data={this.state.data.groups}
                    list={this.state.groupsList}
                    onChange={(data) => {
                      this.onGroupsChange(data);
                    }}
                  />
                </div>
              </div>
              <div className="grid">
                <div className="col-12">
                  <Paper p="xs">
                    <ListChilds
                      data={this.state.data.groups}
                      type="GROUPS"
                      onChange={(data) => {
                        this.onGroupsChange(data);
                      }}
                    />
                  </Paper>
                </div>
              </div>
            </div>
          </CollapsiblePanel>
        </div>

      </div>

    );
  }
}

export default PrintGroupChildsEditor;
