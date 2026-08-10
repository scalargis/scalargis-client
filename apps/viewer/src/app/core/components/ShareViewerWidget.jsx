import React, { useState } from 'react';
import { connect, useDispatch } from 'react-redux'
import { useTranslation} from "react-i18next";

import { ActionIcon, Alert, Button, Group, Modal, Switch, Textarea, TextInput, UnstyledButton } from '@mantine/core';

import { getViewerSessionConfig } from '../model/MapModel';


function ShareViewerWidget({ auth, core, type, viewer, record }) {

  const { utils } = core;
  const { getWindowSize, getViewerPublicUrl } = utils;

  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [allow_add_layers, setAllowAddLayers] = useState(true);
  const [allow_user_session, setAllowUserSession] = useState(false);
  const [allow_anonymous, setAllowAnonymous] = useState(true);

  const { t } = useTranslation();

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  // Enable redux actions
  const dispatch = useDispatch();
  const { viewer_save_record, viewer_save_response } = core.actions;

  let allow_sharing = true;
  if (viewer?.allow_sharing === false) {
    allow_sharing = false;
  };
  if (viewer?.config_json?.allow_sharing === false) {
    allow_sharing = false;
  } else if (viewer?.config_json?.allow_sharing === true) {
    allow_sharing = true;
  }

  function openForm() {
    dispatch(viewer_save_response(null));
    setId(null);
    setName(null);
    setTitle(viewer.title);
    setDescription(viewer.description);
    setSlug(null);
    if (record?.config_json?.allow_add_layers === false) {
      setAllowAddLayers(false);
    }
    if (auth?.data?.token) {
      let anonymous = viewer.allow_anonymous == null ? true : viewer.allow_anonymous;
      if (record?.config_json?.allow_anonymous === false) {
        anonymous = false;
      }
      setAllowAnonymous(anonymous);
    } else {
      setAllowAnonymous(true);
    }
    if (record?.config_json?.allow_user_session === true) {
      setAllowUserSession(true);
    }
    setShowForm(true);
  }

  function submit(e) {
    e?.preventDefault?.();

    if (!title || title.length===0) {
      return false;
    }

    //Get current session viewer config
    const newconfig = getViewerSessionConfig(viewer);

    const record = {
      id,
      name,
      title,
      description,
      slug,
      allow_add_layers,
      allow_user_session,
      allow_anonymous,
      config_json: JSON.stringify(newconfig),
      parent_id: viewer.id
    }
    dispatch(viewer_save_record(core, record, null, null))
  }

  const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return false;
  };

  if (!allow_sharing) return null;

  return (
    <React.Fragment>
      { type != 'menu' ?
        <UnstyledButton onClick={e => openForm()} title={t("shareMap", "Partilhar mapa")}>
          <span className="layout-topbar-item-text">{t("share", "Partilhar")}</span>
          <span className="layout-topbar-icon pi pi-share-alt"/>
        </UnstyledButton> :
        <UnstyledButton className="sg-menuitem" onClick={e => openForm()}>
          <span className="pi pi-share-alt"></span><span>{t("share", "Partilhar")}</span>
        </UnstyledButton> }

      <Modal
        opened={showForm}
        onClose={() => setShowForm(false)}
        title={t("shareMap", "Partilhar mapa")}
        size={isMobile ? '90%' : '35vw'}
        closeOnClickOutside={false}
      >
          <form onSubmit={submit}>
            <div className="p-fluid">
              <div className="grid field">
                <label className="col-12 md:col-4">{t("title", "Título")}</label>
                <div className="col-12 md:col-8">
                  <TextInput
                    error={(!title || title.length === 0) || undefined}
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

              { record?.config_json?.show_allow_add_layers !== false && <div className="grid field">
                <label className="col-12 md:col-4">{t("allowAddThemes", "Permitir adicionar temas ao mapa")}?</label>
                <div className="col-12 md:col-8">
                  <Switch
                    size="md"
                    checked={!!allow_add_layers}
                    onChange={(e) => setAllowAddLayers(!allow_add_layers)}
                  />
                </div>
              </div> }

              { auth?.data?.token && record?.config_json?.show_allow_user_session !== false && <div className="grid field">
                <label className="col-12 md:col-4">{t("allowSaveSession", "Permitir gravar sessão")}?</label>
                <div className="col-12 md:col-8">
                  <Switch
                    size="md"
                    checked={!!allow_user_session}
                    onChange={(e) => setAllowUserSession(!allow_user_session)}
                  />
                </div>
              </div> }

              { auth?.data?.token && record?.config_json?.show_allow_anonymous !== false && <div className="grid field">
                <label className="col-12 md:col-4">{t("allowAnonymousAccess", "Permitir acesso anónimo")}?</label>
                <div className="col-12 md:col-8">
                  <Switch
                    size="md"
                    checked={!!allow_anonymous}
                    onChange={(e) => setAllowAnonymous(!allow_anonymous)}
                  />
                </div>
              </div> }
            </div>

            { viewer.save_response &&
            <div className="grid">
                <label className="col-12 pb-0"><strong>Url</strong></label>
                <div className="col-12 md:col-10 align-content-center">
                    <a style={{wordBreak: "break-all"}} href={getViewerPublicUrl(viewer.save_response.uuid)}
                      target="_blank" rel="noopener noreferrer">{getViewerPublicUrl(viewer.save_response.uuid)}</a>
                </div>
                <div className="col-12 md:col-2 pr-3 text-right">
                    <ActionIcon
                        type="button"
                        variant="outline"
                        radius="xl"
                        size="md"
                        title={t("copyUrl", "Copiar Url")}
                        aria-label={t("copyUrl", "Copiar Url")}
                        onClick={(e) => { e.preventDefault(); e.currentTarget.blur(); copyToClipboard(getViewerPublicUrl(viewer.save_response.uuid)) }}
                    >
                        <i className="pi pi-copy" aria-hidden="true" />
                    </ActionIcon>
                </div>
            </div>
            }

            <Group justify="flex-end" mt="md">
              <Button
                type="submit"
                leftSection={<i className="pi pi-check" />}
                loading={viewer.save_loading}
              >{t("getLink", "Obter Link")}</Button>
            </Group>

            { viewer.save_error &&
              <div className="mt-3">
                <Alert color="danger" py="xs">
                  <Group justify="center" gap="xs" wrap="nowrap">
                    <i className="pi pi-times-circle" />
                    <span>{t("unavailableService", "Serviço Indisponível")}</span>
                  </Group>
                </Alert>
              </div>
            }

            { viewer.save_response && !!viewer.save_response.message &&
              <div className="mt-3">
                <Alert color="danger" py="xs">
                  <Group justify="center" gap="xs" wrap="nowrap">
                    <i className="pi pi-times-circle" />
                    <span>{t("unexpectedError", "Ocorreu um erro inesperado")}</span>
                  </Group>
                </Alert>
              </div>
            }
          </form>
      </Modal>

    </React.Fragment>
  )
}

export default connect(state => ({ auth: state.root.auth, viewer: state.root.viewer }))(ShareViewerWidget)