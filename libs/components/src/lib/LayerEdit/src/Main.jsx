import React, { useState } from 'react';
import { useTranslation} from "react-i18next";
import { ActionIcon, Modal } from '@mantine/core';
import EditNode from './EditNode';

export default function Main(props) {

  const { config } = props;
  const { layer, actions, models, viewer } = config;
  const { getWindowSize, isComponentExcludedForLayer } = models.Utils;

  const [modalEditOpen, setModalEditOpen] = useState(null);

  const { t } = useTranslation();

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const exclude = isComponentExcludedForLayer(viewer, layer, "LayerEdit");

  if (exclude) return null;

  return (
    <React.Fragment>

      <ActionIcon
        variant="subtle"
        size="md"
        radius="xl"
        className="tool"
        title={t("personalizarTema", "Personalizar Tema")}
        aria-label={t("personalizarTema", "Personalizar Tema")}
        onClick={e => setModalEditOpen({...layer})}
      >
        <i className="pi pi-pencil" aria-hidden="true" />
      </ActionIcon>

      <Modal
        title={t("personalizarTema", "Personalizar Tema")}
        opened={!!modalEditOpen}
        size={isMobile ? '90%' : '50vw'}
        onClose={e => setModalEditOpen(false)}>
        <EditNode
          edit={modalEditOpen}
          onSave={(e, theme) => {
            setModalEditOpen(null);
            actions.applyThemeChanges(theme);
          }}
        />
      </Modal>
    </React.Fragment>
  )
}
