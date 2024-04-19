import React, { useContext, useState } from 'react'
import { useTranslation} from "react-i18next";
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import { Message } from 'primereact/message'
import { InputSwitch } from 'primereact/inputswitch'
import { Dialog } from 'primereact/dialog'
import { getWindowSize, showOnPortal, getViewerPublicUrl } from '../utils'
import { getViewerSessionConfig } from '../model/MapModel'

const cookies = new Cookies();

function ShareViewerWidget({ type,viewer, record }) {
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
  const { core } = useContext(AppContext);
  const { viewer_save_record, viewer_save_response } = core.actions;

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

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
    if (cookieData) {
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
    e.preventDefault();

    if (!title || title.length===0) {
      return false;
    }

    //Get current session viewer config
    const newconfig = getViewerSessionConfig(viewer);

    let record = {
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
    dispatch(viewer_save_record(record, null, null))
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
        <button className="p-link" onClick={e => openForm()} title={t("shareMap", "Partilhar mapa")}>
          <span className="layout-topbar-item-text">{t("share", "Partilhar")}</span>
          <span className="layout-topbar-icon pi pi-share-alt"/>
        </button> :
        <a href="#" className="p-menuitem-link" role="menuitem" tabIndex="0" onClick={e => openForm()} >
          <span className="p-menuitem-icon pi pi-share-alt"></span><span className="p-menuitem-text">{t("share", "Partilhar")}</span>
        </a> }

      {showOnPortal(<Dialog
        header={t("shareMap", "Partilhar mapa")}
        visible={showForm}
        style={{width: isMobile ? '90%' : '35vw' }} 
        modal 
        onHide={e => setShowForm(false)}>

          <form onSubmit={e => submit()}>
            <div className="p-fluid">
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("title", "Título")}</label>
                <div className="p-col-12 p-md-8">
                  <InputText
                    className={(!title || title.length === 0 ? 'p-invalid' : '')}
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

              { record?.config_json?.show_allow_add_layers !== false && <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("allowAddThemes", "Permitir adicionar temas ao mapa")}?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_add_layers}
                    onChange={(e) => setAllowAddLayers(!allow_add_layers)}
                  />
                </div>
              </div> }

              { cookieData && record?.config_json?.show_allow_user_session !== false && <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("allowSaveSession", "Permitir gravar sessão")}?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_user_session}
                    onChange={(e) => setAllowUserSession(!allow_user_session)}
                  />
                </div>
              </div> }

              { cookieData && record?.config_json?.show_allow_anonymous !== false && <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">{t("allowAnonymousAccess", "Permitir acesso anónimo")}?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_anonymous}
                    onChange={(e) => setAllowAnonymous(!allow_anonymous)}
                  />
                </div>
              </div> }
            </div>

            { viewer.save_response &&  
            <div className="p-grid">
                <label className="p-col-12"><strong>Url</strong></label>
                <div className="p-col-12 p-md-10">
                    <a style={{wordBreak: "break-all"}} href={getViewerPublicUrl(viewer.save_response.uuid)}
                      target="_blank" rel="noopener noreferrer">{getViewerPublicUrl(viewer.save_response.uuid)}</a>
                </div>
                <div className="p-col-12 p-md-2">
                    <Button
                        style={{marginLeft:"0px", color: "#2196F"}} 
                        icon="pi pi-copy"
                        className="p-button p-component p-button-rounded p-button-outlined p-button-help p-button-icon-only"
                        onClick={(e) => { e.preventDefault(); e.currentTarget.blur(); copyToClipboard(getViewerPublicUrl(viewer.save_response.uuid)) }}
                        tooltip={t("copyUrl", "Copiar Url")} tooltipOptions={{position: 'top'}}
                    />
                </div>
            </div>
            }            

            <div className="p-dialog-myfooter">
              <Button 
                color='green'
                icon={ viewer.save_loading ? "pi pi-spin pi-spinner": "pi pi-check" }
                label={t("getLink", "Obter Link")} 
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

export default connect(state => ({ viewer: state.root.viewer }))(ShareViewerWidget)