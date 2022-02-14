import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { InputSwitch } from 'primereact/inputswitch'
import { Dialog } from 'primereact/dialog'
/*
import { getWindowSize, showOnPortal } from '../utils'
import { getViewerSessionConfig } from '../model/MapModel'
*/

const cookies = new Cookies();
const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'websig_dgt';

export default function ShareViewer({region, as, config, actions, record, utils}) {
  const { viewer, dispatch, Models } = config;
  //const { type, region, as, config, actions, record, utils } = props;

  const { getViewerSessionConfig } = Models.MapModel;
  const {getWindowSize, showOnPortal } = utils;

  const { viewer_save_record, viewer_save_response } = actions;

  const [showForm, setShowForm] = useState(false);
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [allow_add_layers, setAllowAddLayers] = useState(true);
  const [allow_user_session, setAllowUserSession] = useState(false);
  const [allow_anonymous, setAllowAnonymous] = useState(true);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;

  const cookieData = cookies.get(cookieAuthName);

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
    setAllowAddLayers(viewer.allow_add_layers == null ? false : viewer.allow_add_layers);
    if (cookieData) {
      setAllowAnonymous(viewer.allow_anonymous == null ? true : viewer.allow_anonymous);
    } else {
      setAllowAnonymous(true);
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
      config_json: JSON.stringify(newconfig)
    }
    dispatch(viewer_save_record(record, null, null))
  }

  function getPublicUrl(uuid) {
    const appUrl = new URL(window.location.href);  
    return appUrl.origin + (process.env.REACT_APP_BASE_URL || '/') + uuid;
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

  return (
    allow_sharing ? <React.Fragment>
      <button className="p-link" onClick={e => openForm()} title="Partilhar mapa">
        <span className="layout-topbar-item-text">Partilhar</span>
        <span className="layout-topbar-icon pi pi-share-alt"/>
      </button>

      {showOnPortal(<Dialog
        header="Partilhar Mapa"
        visible={showForm}
        style={{width: isMobile ? '90%' : '35vw' }} 
        modal 
        onHide={e => setShowForm(false)}>

          <form onSubmit={e => submit()}>
            <div className="p-fluid">
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">Título</label>
                <div className="p-col-12 p-md-8">
                  <InputText
                    className={(!title || title.length === 0 ? 'p-invalid' : '')}
                    value={title}
                    placeholder="Título"
                    onChange={e => setTitle(e.target.value)}
                  />
                  { (!title || title.length == 0) &&
                  <small className="p-invalid p-d-block">Campo de preenchimento obrigatório</small> }
                </div>
              </div>

              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">Descrição</label>
                <div className="p-col-12 p-md-8">
                  <InputTextarea rows={3}
                    value={description}
                    placeholder="Descrição"
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>

              { (viewer.allow_add_layers == null || viewer.allow_add_layers) &&
              <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">Permitir adicionar temas ao mapa?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_add_layers}
                    onChange={(e) => setAllowAddLayers(!allow_add_layers)}
                  />
                </div>
              </div> }

              { cookieData && <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">Permitir gravar sessão?</label>
                <div className="p-col-12 p-md-8">
                  <InputSwitch
                    checked={allow_user_session}
                    onChange={(e) => setAllowUserSession(!allow_user_session)}
                  />
                </div>
              </div> }

              { cookieData && <div className="p-field p-grid">
                <label className="p-col-12 p-md-4">Permitir acesso anónimo?</label>
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
                    <a style={{wordBreak: "break-all"}} href={getPublicUrl(viewer.save_response.uuid)} 
                      target="_blank">{getPublicUrl(viewer.save_response.uuid)}</a>             
                </div>
                <div className="p-col-12 p-md-2">
                    <Button
                        style={{marginLeft:"0px", color: "#2196F"}} 
                        icon="pi pi-copy"
                        className="p-button p-component p-button-rounded p-button-outlined p-button-help p-button-icon-only"
                        onClick={(e) => { e.preventDefault(); e.currentTarget.blur(); copyToClipboard(getPublicUrl(viewer.save_response.uuid)) }}
                        tooltip="Copiar Url" tooltipOptions={{position: 'top'}}
                    />
                </div>
            </div>
            }            

            <div className="p-dialog-myfooter">
              <Button 
                color='green'
                icon={ viewer.save_loading ? "pi pi-spin pi-spinner": "pi pi-check" }
                label="Obter Link" 
                onClick={submit}
                disabled={(viewer.save_loading)}
              />
            </div>

            { viewer.save_error && 
              <Message style={{ width: '100%' }} severity="error" text="Serviço Indisponível"></Message>
            }

            { viewer.save_response && !!viewer.save_response.message && 
              <Message style={{ width: '100%' }} severity="error" text="Ocorreu um erro"></Message>
            }           
          </form>
      </Dialog>)}

    </React.Fragment> : null
  )
}