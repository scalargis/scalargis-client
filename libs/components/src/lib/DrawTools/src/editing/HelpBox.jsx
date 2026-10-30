import React, { useState } from 'react';
import i18next from 'i18next';
import { Paper, Switch, Text } from '@mantine/core';

const STORAGE_KEY = 'scalargis.drawtools.help';

const HELP_TEXTS = {
  symbol: ['drawingHelpSymbol', 'Clique no mapa para colocar o símbolo.'],
  text: ['drawingHelpText', 'Clique no mapa para colocar o texto.'],
  point: ['drawingHelpPoint', 'Clique no mapa para adicionar um ponto.'],
  line: ['drawingHelpLine', 'Clique para cada vértice. Duplo clique termina a linha.'],
  polygon: ['drawingHelpPolygon', 'Clique para cada vértice. Duplo clique termina o polígono.'],
  select: ['drawingHelpSelect', 'Clique num desenho para o editar. Arraste um vértice para o mover. Shift e clique num vértice apaga-o.'],
  transform: ['drawingHelpTransform', 'Clique num desenho. Arraste o desenho para o mover, um canto para o escalar e o círculo para o rodar. Pontos, símbolos e textos só se movem.'],
  square: ['drawingHelpSquare', 'Defina o lado em metros e a rotação. Clique no mapa para colocar o centro do quadrado.'],
  rectangle: ['drawingHelpRectangle', 'Defina a largura e a altura em metros e a rotação. Clique no mapa para colocar o centro do retângulo.'],
  grid: ['drawingHelpGrid', 'Defina linhas, colunas, tamanho da célula em metros e a rotação. Clique no mapa para colocar o centro da grelha.'],
  none: ['drawingHelpNone', 'Escolha uma ferramenta.']
};

const SNAP_TOOLS = ['symbol', 'text', 'point', 'line', 'polygon', 'select', 'transform'];

const readEnabled = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch (e) {
    return true;
  }
};

const writeEnabled = (value) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off');
  } catch (e) {
    return;
  }
};

/** Help text for the active drawing tool, with a toggle kept in localStorage. */
export default function HelpBox({ tool }) {
  const [enabled, setEnabled] = useState(readEnabled);
  const [key, fallback] = HELP_TEXTS[tool] || HELP_TEXTS.none;
  const showSnap = SNAP_TOOLS.includes(tool);

  const toggle = (event) => {
    const value = event.currentTarget.checked;
    setEnabled(value);
    writeEnabled(value);
  };

  return (
    <Paper withBorder p="xs" className="draw-help">
      <Switch
        size="xs"
        checked={enabled}
        onChange={toggle}
        label={i18next.t('drawingHelpShow', 'Mostrar ajuda')}
      />
      {enabled ? <Text size="xs" mt={6}>{i18next.t(key, fallback)}</Text> : null}
      {enabled && showSnap ? <Text size="xs" mt={4}>{i18next.t('drawingHelpSnap', 'Ative Atrair para o cursor aderir aos vértices e às arestas dos desenhos e das camadas vetoriais visíveis.')}</Text> : null}
    </Paper>
  );
}
