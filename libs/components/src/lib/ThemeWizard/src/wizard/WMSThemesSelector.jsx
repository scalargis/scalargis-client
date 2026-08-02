import React, { useMemo } from 'react';
import layerNode from './layerNode';
import ThemesTree from './ThemesTree';


const WMSThemesSelector = ({ themes, selected, setSelected, readOnly }) => {
  const nodes = useMemo(() => (themes || []).map((l) => layerNode(l)), [themes]);

  if (!nodes.length) return null;

  return (
    <ThemesTree
      nodes={nodes}
      selected={selected}
      setSelected={setSelected}
      readOnly={readOnly}
      withFilter={!readOnly}
    />
  );
}

export default WMSThemesSelector;
