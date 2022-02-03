import React, { useState } from 'react'

export default function DragSlot({ i, parent, action, deep }) {

  const [over, setOver] = useState(false)
  
  function onDragEnter(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    setOver(true);
  }
  
  function onDragLeave(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    setOver(false);
  }
  
  function onDrop(ev, a, parent) {
    ev.stopPropagation();
    setOver(false);
    let from = ev.dataTransfer.getData("index");
    from = from.split(',');
    let to = [a, parent];
    action(from[0], from[1], parseInt(to[0], 10), to[1]);
  };

  function onDragOver(ev) {
    ev.preventDefault();
  };

  //if (deep === 0) return null;
  return (
    <li className={"drag-slot" + (over ? " drag-over" : "")} 
      data-deep={deep}
      onDrop={e => onDrop(e, i, parent) }
      onDragOver={e => onDragOver(e)}
      onDragLeave={e => onDragLeave(e)}
      onDragEnter={e => onDragEnter(e)}></li>
  )
}