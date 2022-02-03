import React from "react";
import DragSlot from "./DragSlot";
import Node from "./Node";

class Tree extends React.Component {

  toggle(id) {
    const { items, checked, toggle } = this.props;
    var index = checked.indexOf(id);
    if (index === -1) toggle(id);
    items.map(child => {
      index = checked.indexOf(child.id);
      if (child.id !== id && index > -1) toggle(child.id);
      return child;
    });
  }

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
                toggle={exclusive ? this.toggle.bind(this) : actions.toggle}
                disabled={disabled}
                olmap={olmap}
                actions={actions}
                onDragStart={this.props.onDragStart}
              />
              <DragSlot i={i+1}
                parent={id}
                action={actions.moveTheme}
                deep={deep}
              />
            </React.Fragment>
          ))}
        </ul>
      </div>
    );
  }
}

export default Tree;
