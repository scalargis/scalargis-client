import React, { useState } from 'react';
import { useTranslation} from "react-i18next";
import { connect, useDispatch } from 'react-redux';

import { Alert, Button, Group, Switch, Textarea, TextInput, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Dialog, IconCheck, IconSave, IconXCircle } from '@scalargis/ui';

import { getViewerSessionConfig } from '../model/MapModel';


function SaveViewerWidget({ auth, core, type, viewer }) {

  const { utils } = core;

  const [showForm, { open, close }] = useDisclosure(false);
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [allow_add_layers, setAllowAddLayers] = useState(true);
  const [allow_user_session, setAllowUserSession] = useState(false);
  const [allow_anonymous, setAllowAnonymous] = useState(true);

  const { t } = useTranslation();

  // Enable redux actions
  const dispatch = useDispatch();
  const { viewer_save_record, viewer_add_notification } = core.actions;

  function openForm() {
    setId(viewer.id);
    setName(viewer.name);
    setTitle(viewer.title);
    setDescription(viewer.description);
    setIsActive(viewer.is_active === null ? true : viewer.is_active);
    setAllowAddLayers(viewer.allow_add_layers);
    setAllowUserSession(viewer.allow_user_session == null ? false : viewer.allow_user_session);
    setAllowAnonymous(viewer.allow_anonymous == null ? true : viewer.allow_anonymous);
    open();
  }

  // Render user
  if (!auth?.data?.token || !viewer.is_owner) return null;

  function submit(e) {
    e?.preventDefault?.();

    if (!name || name.length==0 || !title || title.length==0) {
      return false;
    }

    //Get current session viewer config
    const newconfig = getViewerSessionConfig(viewer);

    const record = {
      id,
      name,
      title,
      description,
      is_active,
      allow_add_layers,
      allow_user_session,
      allow_anonymous,
      config_json: JSON.stringify(newconfig)
    }
    dispatch(viewer_save_record(core, record, null, null, (res) => {
      if (res?.success) {
        const msg = {
          severity: "success",
          summary: t("saveMap","Gravar mapa"),
          detail: `${t("successActionMsg", "Operação realizada com sucesso")}.`
        }
        dispatch(viewer_add_notification({group: "viewer", message: msg}));
      }
    }));
  }

  // Render save button
  return (
    <React.Fragment>
      { type != 'menu' ?
      <UnstyledButton onClick={e => openForm()} title={t("saveMap", "Gravar mapa")}>
        <span className="layout-topbar-item-text">{t("save", "Gravar")}</span>
        <IconSave className="layout-topbar-icon" />
      </UnstyledButton> :
        <UnstyledButton className="sg-menuitem" onClick={e => openForm()}>
          <IconSave /><span>{t("save", "Gravar")}</span>
        </UnstyledButton> }

      <Dialog
        opened={showForm}
        onClose={close}
        title={t("saveMap", "Gravar mapa")}
        closeOnClickOutside={false}
      >
          <form onSubmit={submit}>

            <div className="p-fluid">

              <div className="grid field">
                <label className="col-12 md:col-4">{t("name", "Nome")}</label>
                <div className="col-12 md:col-8">
                  <TextInput
                    error={(!name || name.length == 0) || undefined}
                    value={name ?? ''}
                    placeholder="Nome do Visualizador"
                    onChange={e => setName(e.target.value)}
                  />
                  { (!name || name.length == 0) &&
                  <small className="sg-error block">{t("requiredField", "Campo de preenchimento obrigatório")}</small> }
                </div>
              </div>

              <div className="grid field">
                <label className="col-12 md:col-4">{t("title", "Título")}</label>
                <div className="col-12 md:col-8">
                  <TextInput
                    error={(!title || title.length == 0) || undefined}
                    value={title ?? ''}
                    placeholder={t("title", "Título")}
                    onChange={e => setTitle(e.target.value)}
                  />
                  { (!title || title.length == 0) &&
                  <small className="sg-error block">{t("requiredField", "Campo de preenchimento obrigatório")}</small> }
                </div>
              </div>

              <div className="grid field">
                <label className="col-12 md:col-4">{t("description", "Descrição")}</label>
                <div className="col-12 md:col-8">
                  <Textarea rows={3}
                    value={description ?? ''}
                    placeholder={t("description", "Descrição")}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid field">
                <label className="col-12 md:col-4">{t("isActive", "Está ativo")}?</label>
                <div className="col-12 md:col-8">
                  <Switch
                    size="md"
                    checked={!!is_active}
                    onChange={(e) => setIsActive(!is_active)}
                  />
                </div>
              </div>

              <div className="grid field">
                <label className="col-12 md:col-4">{t("allowSaveSession", "Permitir gravar sessão")}?</label>
                <div className="col-12 md:col-8">
                  <Switch
                    size="md"
                    checked={!!allow_user_session}
                    onChange={(e) => setAllowUserSession(!allow_user_session)}
                  />
                </div>
              </div>

              <div className="grid field">
                <label className="col-12 md:col-4">{t("allowAnonymousAccess", "Permitir acesso anónimo")}?</label>
                <div className="col-12 md:col-8">
                  <Switch
                    size="md"
                    checked={!!allow_anonymous}
                    onChange={(e) => setAllowAnonymous(!allow_anonymous)}
                  />
                </div>
              </div>

            </div>

            <Group justify="flex-end" mt="md">
              <Button
                type="submit"
                leftSection={<IconCheck />}
                loading={viewer.save_loading}
              >{t("save", "Gravar")}</Button>
            </Group>

            { viewer.save_error &&
              <div className="mt-3">
                <Alert color="danger" py="xs">
                  <Group justify="center" gap="xs" wrap="nowrap">
                    <IconXCircle />
                    <span>{t("unavailableService", "Serviço Indisponível")}</span>
                  </Group>
                </Alert>
              </div>
            }

            { viewer.save_response && !!viewer.save_response.message &&
              <div className="mt-3">
                <Alert color="danger" py="xs">
                  <Group justify="center" gap="xs" wrap="nowrap">
                    <IconXCircle />
                    <span>{t("unexpectedError", "Ocorreu um erro inesperado")}</span>
                  </Group>
                </Alert>
              </div>
            }

          </form>
      </Dialog>

    </React.Fragment>
  )
}

export default connect(state => ({ auth: state.root.auth, viewer: state.root.viewer }))(SaveViewerWidget)