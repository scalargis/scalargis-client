import React, { useMemo, useState } from 'react';
import { useTranslation } from "react-i18next";
import { Select } from '@mantine/core';
import layerNode from './layerNode';
import ThemesTree from './ThemesTree';

import { I18N_NAMESPACE } from './../i18n/index';


const WMTSThemesSelector = ({ themes, tileMatrixSet, data, setData, selected, setSelected, readOnly }) => {
  const [tilematrixset, setTilematrixset] = useState();
  const nodes = useMemo(() => (themes || []).map((l) => layerNode(l)), [themes]);
  const matrixItems = (tileMatrixSet || []).map( m => ({ label: m.Identifier, value: m.Identifier }));

  const { t } = useTranslation([I18N_NAMESPACE, "custom"]);

  function selectTileMatrixSet(value) {
    const dataitems = data.dataitems.map( t => { return {...t, wmts_tilematrixset: value }});
    setData({...data, dataitems: dataitems});
    setTilematrixset(value);
  }

  if (!nodes.length) return null;

  return (
    <div>
      <div className="flex mt-2 mb-2">
        <Select
          data={matrixItems}
          value={tilematrixset || null}
          clearable
          placeholder={t("selectTileMatrix", "Selecione a Grelha")}
          style={{ width: "100%"}}
          onChange={ value => selectTileMatrixSet(value)}
        />
      </div>

      <ThemesTree
        nodes={nodes}
        selected={selected}
        setSelected={setSelected}
        readOnly={readOnly}
        withFilter={!readOnly}
      />
    </div>
  );
}

export default WMTSThemesSelector;
