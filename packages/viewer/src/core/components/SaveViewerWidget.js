import React, { useContext, useState } from 'react';
import { useTranslation} from "react-i18next";
import Cookies from 'universal-cookie';
import { connect, useDispatch } from 'react-redux';
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { InputSwitch } from 'primereact/inputswitch';
import { Dialog } from 'primereact/dialog';

import AppContext from '../../AppContext';
import { getWindowSize, showOnPortal } from '../utils';
import { getViewerSessionConfig } from '../model/MapModel';

const cookies = new Cookies();

function SaveViewerWidget({ type, viewer }) {

  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [is_active, setIsActive] = useState(true);
  const [allow_add_layers, setAllowAddLayers] = useState(true);
  const [allow_user_session, setAllowUserSession] = useState(false);
  const [allow_anonymous, setAllowAnonymous] = useState(true);

  const { t } = useTranslation();

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;
  
  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);
  const { viewer_save_record, viewer_add_notification } = core.actions;

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

  function openForm() {
    setId(viewer.id);
    setName(viewer.name);
    setTitle(viewer.title);
    setDescription(viewer.description);
    setIsActive(viewer.is_active === null ? true : viewer.is_active);
    setAllowAddLayers(viewer.allow_add_layers);
    setAllowUserSession(viewer.allow_user_session == null ? false : viewer.allow_user_session);
    setAllowAnonymous(viewer.allow_anonymous == null ? true : viewer.allow_anonymous);
    setShowForm(true);
  }
  
  // Render user
  if (!cookieData || !viewer.is_owner) return null;

  function submit(e) {
    e.preventDefault();

    if (!name || name.length==0 || !title || title.length==0) {
      return false;
    }

    //Get current session viewer config
    const newconfig = getViewerSessionConfig(viewer);

    let record = {
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
    dispatch(viewer_save_record(record, null, null, (res) => {
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
      <button className="p-link" onClick={e => openForm()}>
        <span className="layout-topbar-item-text">{t("save", "Gravar")}</span>
        <span className="layout-topbar-icon pi pi-save"/>
      </button> :
        <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => openForm()} >
          <span className="p-menuitem-icon pi pi-save"></span><span className="p-menuitem-text">{t("save", "Gravar")}</span>
        </a> }

      {showOnPortal(<Dialog
        header={t("saveMap", "Gravar mapa")}
        visible={showForm}
        style={{width: isMobile ? '90%' : '35vw' }} 
        modal 
        onHide={e => setShowForm(false)}>

          <form onSubmit={e => submit()}>

            <div className="p-fluid">

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("name", "Nome")}</label>
                <div className="p-col-12 p-md-8">
                  <InputText
                    className={(!name || name.length == 0 ? 'p-invalid' : '')}
                    value={name}
                    placeholder="Nome do Visualizador"
                    onChange={e => setName(e.target.value)}
                  />
                  { (!name || name.length == 0) &&
                  <small className="p-invalid p-d-block">{t("requiredField", "Campo de preenchimento obrigatório")}</small> }                  
                </div>
              </div>

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("title", "Título")}</label>
                <div className="p-col-12 p-md-8">
                  <InputText
                    className={(!title || title.length == 0 ? 'p-invalid' : '')}
                    value={title}
                    placeholder={t("title", "Título")}
                    onChange={e => setTitle(e.target.value)}
                  />
                  { (!title || title.length == 0) &&
                  <small className="p-invalid p-d-block">{t("requiredField", "Campo de preenchimento obrigatório")}</small> }                  
                </div>
              </div>

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("description", "Descrição")}</label>
                <div className="p-col-12 p-md-8">
                  <InputTextarea rows={3}
                    value={description}
                    placeholder={t("description", "Descrição")}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>              

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("isActive", "Está ativo")}?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={is_active}
                    onChange={(e) => setIsActive(!is_active)}
                  />
                </div>
              </div>

              {/*
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">Permitir adicionar temas ao mapa?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_add_layers}
                    onChange={(e) => setAllowAddLayers(!allow_add_layers)}
                  />
                </div>
              </div>
              */}

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("allowSaveSession", "Permitir gravar sessão")}?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_user_session}
                    onChange={(e) => setAllowUserSession(!allow_user_session)}
                  />
                </div>
              </div>

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("allowAnonymousAccess", "Permitir acesso anónimo")}?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_anonymous}
                    onChange={(e) => setAllowAnonymous(!allow_anonymous)}
                  />
                </div>
              </div>              

            </div>

            <div className="p-dialog-myfooter">
              <Button 
                color='green'
                icon={ viewer.save_loading ? "pi pi-spin pi-spinner": "pi pi-check" }
                label={t("save", "Gravar")} 
                onClick={submit}
                disabled={(viewer.save_loading)}
              />
            </div>

            { viewer.save_error && 
              <Message style={{ width: '100%' }} severity="error" text={t("unavailableService", "Serviço Indisponível")}></Message>
            }

            { viewer.save_response && !!viewer.save_response.message && 
              <Message style={{ width: '100%' }} severity="error" text={t("unexpectedError", "Ocorreu um erro inesperado")}></Message>
            }

          </form>
      </Dialog>)}

    </React.Fragment>
  )
}

export default connect(state => ({ viewer: state.root.viewer }))(SaveViewerWidget)