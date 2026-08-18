import React from 'react';
import { useTranslation } from "react-i18next";
import { Group } from '@mantine/core';

import MapToolButton from './MapToolButton';
import './drawing-toolbar.css';

const DRAW_TOOLS = [
  { value: "Point", title: "addPoint", "defaultTitle": "Adicionar ponto", icon: "pi pi-circle-fill" },
  { value: "LineString", title: "addLine", "defaultTitle": "Adicionar linha", icon: "pi pi-minus" },
  { value: "Polygon", title: "addPolygon", "defaultTitle": "Adicionar polígono", icon: "fas fa-draw-polygon" },
  { value: "Copy", title: "copyFeature", "defaultTitle": "Copiar geometria", icon: "pi pi-copy" },
  { value: "Select", title: "selectElement", "defaultTitle": "Selecionar elemento", icon: "fas fa-mouse-pointer" },
  { value: "Modify", title: "editElement", "defaultTitle": "Editar elemento", icon: "pi pi-pencil" }
];

/**
 * The location-marking toolbar shared by Print (PrintPanel2, PrintPanelItem)
 * and IntersectLayers: the drawing tools on the left (filled = active,
 * aria-pressed for keyboard users), delete and zoom-all on the right.
 */
export default function DrawingToolbar({ availableTools, activeTool, onSelectTool, onDeleteSelected, onZoomAll, deleteTitle }) {
  const { t } = useTranslation();

  return (
    <Group justify="space-between" wrap="nowrap" className="drawing-toolbar">
      <Group gap={4} wrap="nowrap">
        {DRAW_TOOLS.filter(opt => {
          if (!availableTools || availableTools.length === 0) return true;
          return availableTools.includes(opt.value.toLowerCase());
        }).map(opt => (
          <MapToolButton
            key={opt.value}
            size="md"
            variant={opt.value === activeTool ? 'filled' : 'default'}
            active={opt.value === activeTool}
            icon={opt.icon}
            title={t(opt.title, opt.defaultTitle)}
            onClick={(e) => onSelectTool(e, opt.value)}
          />
        ))}
      </Group>
      <Group gap={4} wrap="nowrap">
        <MapToolButton
          size="md"
          variant="filled"
          color="danger"
          icon="pi pi-trash"
          title={deleteTitle}
          onClick={() => onDeleteSelected()}
        />
        <MapToolButton
          size="md"
          variant="default"
          icon="pi pi-search-plus"
          title={t("viewAllElements", "Ver todos os elementos")}
          onClick={() => onZoomAll()}
        />
      </Group>
    </Group>
  );
}
