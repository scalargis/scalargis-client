import React from "react";

class DraggableItem extends React.Component {

  onDragStart = (ev, id, parent) => {
    ev.stopPropagation();
    const data = [id, parent].join(',');
    ev.dataTransfer.setData("index", data);
    this.props.onDragStart();
  };

  render() {
    if (this.props.draggable === false || this.props.hidden) {
      const { id } = this.props;
      return (
        <li data-id={id} style={this.props.hidden === true ? {display: "none"} : {}}>
          {this.props.children}
        </li>
      );
    }

    const { i, parent, id } = this.props;
    return (
      <li data-id={id}
        draggable
        className="draggable"
        onDragStart={e => this.onDragStart(e, id, parent)}>
        {this.props.children}
      </li>
    );

  }

}

export default DraggableItem;