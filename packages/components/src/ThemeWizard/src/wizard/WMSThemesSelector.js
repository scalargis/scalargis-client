import React, { useEffect, useState } from 'react';
import { Tree } from 'primereact/tree';
import layerNode from './layerNode';

const WMSThemesSelector = ({ themes, selected, setSelected, readOnly, expandAllGroups }) => {
  const [expandedKeys, setExpandedKeys] = useState({});
  const [isSelectAll, setIsSelectAll] = useState(false);
  const nodes = themes.map(l => layerNode(l));

  function expandNode(node) {
    let newExpandedKeys = { ...expandedKeys };
    if (node.children && node.children.length) {
      newExpandedKeys[node.key] = true;
      for (let child of node.children) {
        expandNode(child);
      }
    }
    setExpandedKeys(newExpandedKeys);
  }

  function selectAll(checked, items, selection, lvl = 0) {
    if (!checked) return setSelected({});
    items.forEach((n, i) => {
      selection[n.key] = { checked, partial: false };
      if (n.children) selectAll(checked, n.children, selection, lvl+1);
    })
    if (lvl === 0) setSelected(selection);
  }

  // Select/deselect all
  useEffect(() => {
    if (!setSelected) return;
    selectAll(isSelectAll, nodes, {});
  }, [isSelectAll]);

  // Expand all on
  /*
  useEffect(() => {
    for (let node of nodes) {
      expandNode(node);
    }
  }, []);
  */  
  // Expand all on
  useEffect(() => {
    if (expandAllGroups) {
      let newExpandedKeys = {};
      const getGroupsKeys =  function (node) {
        if (node.children && node.children.length) {
          newExpandedKeys[node.key] = true;
          for (let child of node.children) {
            getGroupsKeys(child);
          }
        }
      }
      for (let node of nodes) {
        getGroupsKeys(node);
      }      
      setExpandedKeys(newExpandedKeys);
    } else {
      for (let node of nodes) {
        expandNode(node);
      }
    }
  }, [themes]);   

  if (!nodes.length) return null;

  return (
    <React.Fragment>

      { !!setSelected && nodes.length ? (
        <h5>
          &nbsp;
          <a style={{float: 'right', cursor: 'pointer'}}
            onClick={e => setIsSelectAll(!isSelectAll)}>
            Selecionar/Remover Todos
          </a>
        </h5>
      ) : null }

      <Tree
        value={nodes}
        expandedKeys={expandedKeys}
        filter={readOnly || nodes.length === 0 ? false : true}
        filterMode={readOnly ? null :  "lenient"}
        selectionMode={readOnly ? null : "checkbox"}
        selectionKeys={readOnly ? null : selected}
        onSelectionChange={e => { 
          /*console.log(e.value);*/
          const sel = {};
          Object.keys(e.value).forEach(key => {
            const selItem = e.value[key];
            if (selItem.checked || selItem.partialChecked) sel[key] = {...selItem};
          });
          setSelected(sel);
        }}
        onToggle={e => { /*console.log(e.value);*/ setExpandedKeys(e.value);}} 
      />

    </React.Fragment>
  );
}

export default WMSThemesSelector;