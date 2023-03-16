import React, { useState, useEffect } from 'react';
import { Tree } from 'primereact/tree';
import { Dropdown } from 'primereact/dropdown';
import layerNode from './layerNode';

const WMTSThemesSelector = ({ themes, tileMatrixSet, data, setData, selected, setSelected, readOnly }) => {
  const [expandedKeys, setExpandedKeys] = useState({});
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [tilematrixset, setTilematrixset] =useState();
  const nodes = themes.map(l => layerNode(l));
  const matrixItems = tileMatrixSet.map( m => ({ label: m.Identifier, value: m.Identifier }));

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

  function selectTileMatrixSet(value) {
    const dataitems = data.dataitems.map( t => { return {...t, wmts_tilematrixset: value }});
    setData({...data, dataitems: dataitems});
    setTilematrixset(value);
  }

  // Select/deselect all
  useEffect(() => {
    if (!setSelected) return;
    selectAll(isSelectAll, nodes, {});
  }, [isSelectAll]);

  // Expand all on
  useEffect(() => {
    for (let node of nodes) {
      expandNode(node);
    }
  }, []);

  if (!nodes.length) return null;

  return (
    <div>
      <div className="p-d-flex p-mt-2 p-mb-2">
        <Dropdown options={matrixItems} value={tilematrixset} showClear placeholder="Selecione a Grelha" style={{ width: "100%"}}
        onChange={ e => selectTileMatrixSet(e.value)}/>    
      </div>

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
      />
    </div>
  );
}

export default WMTSThemesSelector;