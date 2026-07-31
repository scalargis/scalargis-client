import React from 'react';
import { useTranslation } from "react-i18next";
import { ActionIcon, Group } from '@mantine/core';

import './style.css';

const DRAW_TOOLS = [
  { value: "Point", title: "addPoint", "defaultTitle": "Adicionar ponto", icon: "fas fa-circle" },
  { value: "LineString", title: "addLine", "defaultTitle": "Adicionar linha", icon: "pi pi-minus" },
  { value: "Polygon", title: "addPolygon", "defaultTitle": "Adicionar polígono", icon: "fas fa-draw-polygon" },
  { value: "Copy", title: "copyFeature", "defaultTitle": "Copiar geometria", icon: "pi pi-copy" },
  { value: "Select", title: "selectElement", "defaultTitle": "Selecionar elemento", icon: "fas fa-mouse-pointer" },
  { value: "Modify", title: "editElement", "defaultTitle": "Editar elemento", icon: "pi pi-pencil" }
];

/**
 * The location-marking toolbar PrintPanel2 and PrintPanelItem share: the
 * drawing tools on the left (filled = active, aria-pressed for keyboard
 * users), delete and zoom-all on the right.
 */
export default function DrawingToolbar({ availableTools, activeTool, onSelectTool, onDeleteSelected, onZoomAll, deleteTitle }) {
  const { t } = useTranslation();

  return (
    <Group justify="space-between" wrap="nowrap" className="print-drawing-toolbar">
      <Group gap={4} wrap="nowrap">
        {DRAW_TOOLS.filter(opt => {
          if (!availableTools || availableTools.length === 0) return true;
          return availableTools.includes(opt.value.toLowerCase());
        }).map(opt => (
          <ActionIcon
            key={opt.value}
            size="md"
            variant={opt.value === activeTool ? 'filled' : 'default'}
            aria-pressed={opt.value === activeTool}
            title={t(opt.title, opt.defaultTitle)}
            aria-label={t(opt.title, opt.defaultTitle)}
            onClick={(e) => onSelectTool(e, opt.value)}
          >
            <i className={opt.icon} aria-hidden="true" />
          </ActionIcon>
        ))}
      </Group>
      <Group gap={4} wrap="nowrap">
        <ActionIcon
          size="md"
          variant="filled"
          color="danger"
          title={deleteTitle}
          aria-label={deleteTitle}
          onClick={() => onDeleteSelected()}
        >
          <i className="pi pi-trash" aria-hidden="true" />
        </ActionIcon>
        <ActionIcon
          size="md"
          variant="default"
          title={t("viewAllElements", "Ver todos os elementos")}
          aria-label={t("viewAllElements", "Ver todos os elementos")}
          onClick={() => onZoomAll()}
        >
          <i className="fas fa-search-plus" aria-hidden="true" />
        </ActionIcon>
      </Group>
    </Group>
  );
}
