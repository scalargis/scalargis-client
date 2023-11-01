export const ReorderGroups = (list, startIndex, endIndex) => {
  const result_array = Object.entries(list).map((f,i) => {
    return {id: f[0], ...f[1]}
  });
  const [removed] = result_array.splice(startIndex, 1);
  result_array.splice(endIndex, 0, removed);

  const result = {}
  result_array.forEach((r) => {
    result[r.id] = {active: r.active, title: r.title, fields: r.fields};
  });

  return result;  
};

export const ReorderFields = (list, startIndex, endIndex) => {
  const result = Object.entries(list).map((f,i) => {
    return {id: f[0], ...f[1]}
  });
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  const fields = {}
  result.forEach((r) => {
    fields[r.id] = {active: r.active, required: r.required, title: r.title, header: r.header, showLabel: r.showLabel};
  });

  return fields;
};

const grid = 4;
export const getItemStyle = (isDragging, draggableStyle) => {
  return {
    // some basic styles to make the items look a bit nicer
    userSelect: "none",
    padding: grid * 2,
    margin: `0 0 ${grid * 2}px 0`,

    // change background colour if dragging
    background: isDragging ? "lightblue" : "none",

    // styles we need to apply on draggables
    ...draggableStyle
  };
};

export const getGroupListStyle = isDraggingOver => ({
  background: isDraggingOver ? "lightgray" : "none",
  padding: 8,
  //width: 350
});

export const getFieldListStyle = isDraggingOver => ({
  background: isDraggingOver ? "lightgray" : "none",
  padding: 4,
  //width: 250
});