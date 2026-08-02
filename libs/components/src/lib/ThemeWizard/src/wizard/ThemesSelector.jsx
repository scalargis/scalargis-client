import React, { useMemo } from 'react';
import layerNode from './layerNode';
import ThemesTree from './ThemesTree';


const ThemesSelector = ({ themes, selected, setSelected, readOnly, hide }) => {
  const nodes = useMemo(() => (themes || []).map((l) => layerNode(l)), [themes]);

  if (!nodes.length) return null;
  if (hide) return null;

  return (
    <ThemesTree
      nodes={nodes}
      selected={selected}
      setSelected={setSelected}
      readOnly={readOnly}
      withFilter={!readOnly && nodes.length >= 10}
    />
  );
}

export default ThemesSelector;
