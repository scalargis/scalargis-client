import React from "react";
import DragSlot from "./DragSlot";
import Node from "./Node";

class Tree extends React.Component {

  state = { detailsOpen: false }

  render() {
    const {
      id,
      core,
      record,
      config,
      layers,
      deep,
      checked,
      opened,
      exclusive,
      disabled,
      olmap,
      actions
    } = this.props;
    const items = this.props.items || [];
    return (
      <div>
        <ul>
          <DragSlot i={0}
            parent={id}
            action={actions.moveTheme}
            deep={deep}
          />
          {items.map((child, i) => (
            <React.Fragment key={child.id}>
              <Node
                i={i}
                parent={id}
                data={child}
                record={record}
                config={config}
                layers={layers}
                core={core}
                deep={deep}
                opened={opened}
                radioName={exclusive ? id : ""}
                checked={checked}
                toggle={actions.toggle}
                items={exclusive ? items : null}
                disabled={disabled}
                olmap={olmap}
                actions={actions}
                onDragStart={this.props.onDragStart}
                isDraggable={this.props.isDraggable}
                setDraggable={this.props.setDraggable}
              />
              {!child.hidden && <DragSlot i={i+1}
                parent={id}
                action={actions.moveTheme}
                deep={deep}
              />}
            </React.Fragment>
          ))}
        </ul>
      </div>
    );
  }
}

export default Tree;
