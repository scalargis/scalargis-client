import React, { useContext, useState } from 'react'
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import { Dialog } from 'primereact/dialog'
import { connect, useDispatch } from 'react-redux'
import AppContext from '../../AppContext'
import { getWindowSize, showOnPortal } from '../utils'


const cookies = new Cookies();

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

function TopButtonContact({ viewer }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [infoMessage, setInfoMessage] = useState(null);
  const [sending, setSending] = useState(false);

  const wsize = getWindowSize();
  const isMobile = wsize[0] <= 768;
  
  // Enable redux actions
  const dispatch = useDispatch();
  const { core } = useContext(AppContext);

  const cookieData = cookies.get(core.COOKIE_AUTH_NAME);

  function openForm() {
    setName(viewer?.user_info?.name ? viewer.user_info.name : null);
    setEmail(viewer?.user_info?.email  ? viewer.user_info.email : null);
    setDescription(null);
    setInfoMessage(null);
    setShowForm(true);
  }

  function submit(e) {
    e.preventDefault();

    if (!name || !email || !description) {
      setInfoMessage({
        type: 'error',
        message: 'Campos obrigatórios não preenchidos'
      });
      return false;
    } else if (!validateEmail(email)) { 
      setInfoMessage({
        type: 'error',
        message: 'Formato de email incorreto'
      }); 
      return false;
    } else {
      setInfoMessage(null);
    }

    let record = {
      name,
      email,
      description
    }

    // Save request
    let options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'        
      },
      method: 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
    const cookies = new Cookies();
    const logged = cookies.get(core.COOKIE_AUTH_NAME);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    setSending(true);

    // Auth url. TODO: check for proxy
    let url = core.API_URL + '/app/viewer/' + viewer.id + '/contact_message';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        setSending(false);
        if (res.success) {
          setInfoMessage({
            type: 'success',
            message: res.message
          });
        } else {
          setInfoMessage({
            type: 'error',
            message: res.message
          });   
        }
      }).catch(error => {
        setSending(false);
        setInfoMessage({
          type: 'error',
          message: 'Ocorreu um erro.'
        });
      });
  }
 
  if (!viewer || !viewer.show_contact) return null;

  return (
    <React.Fragment>
      <button className="p-link" onClick={e => openForm()} title="Contacto">
        <span className="layout-topbar-item-text">Contacto</span>
        <span className="layout-topbar-icon far fa-envelope" />
      </button>

      {showOnPortal(<Dialog
        header="Formulário de Contacto"
        visible={showForm}
        style={{width: isMobile ? '90%' : '35vw' }} 
        modal 
        onHide={e => setShowForm(false)}>

          <form onSubmit={e => submit()}>

            <div className="p-fluid">
              <div className="p-field">
                  <label htmlFor="contact_name">Nome</label>
                  <InputText
                      id="contact_name"
                      className={(!name || name.length === 0 ? 'p-invalid' : '')}
                      value={name}
                      placeholder="Nome"
                      disabled={viewer?.user_info?.name}
                      onChange={e => {setName(e.target.value); setInfoMessage(null);}}
                    />
                    { (!name || name.length === 0) &&
                    <small className="p-invalid p-d-block">Campo de preenchimento obrigatório</small> }                                  
              </div>
              <div className="p-field">
                  <label htmlFor="contact_email">Email</label>
                  <InputText
                      id="contact_email"
                      className={(!email || email.length === 0 ? 'p-invalid' : '')}
                      value={email}
                      placeholder="Email"
                      disabled={viewer?.user_info?.email}
                      onChange={e => {setEmail(e.target.value); setInfoMessage(null);}}
                    />
                    { (!email || email.length === 0) &&
                    <small className="p-invalid p-d-block">Campo de preenchimento obrigatório</small> }                                  
              </div>
              <div className="p-field">
                  <label htmlFor="contact_description">Descrição</label>
                  <InputTextarea rows={3}
                      id="contact_description"
                      className={(!description || description.length === 0 ? 'p-invalid' : '')}
                      value={description}
                      placeholder="Descrição"
                      onChange={e => {setDescription(e.target.value); setInfoMessage(null);}}
                    />
                    { (!description || description.length === 0) &&
                    <small className="p-invalid p-d-block">Campo de preenchimento obrigatório</small> }
              </div>            
            </div>
            
            { viewer.contact_info && 
              <div dangerouslySetInnerHTML={{__html: viewer.contact_info}}></div>            
            }
                      
            <div className="p-mb-2">
              { (infoMessage && infoMessage.type) && 
                <Message style={{ width: '100%' }} severity={infoMessage.type} text={infoMessage.message}></Message>
              }
            </div>                   

            <div className="p-dialog-myfooter">
              <Button 
                color='green'
                icon={ sending ? "pi pi-spin pi-spinner": "pi pi-check" }
                label="Enviar" 
                onClick={submit}
                disabled={sending}
              />
            </div>         
          </form>
      </Dialog>)}

    </React.Fragment>
  )
}

export default connect(state => ({ viewer: state.root.viewer }))(TopButtonContact)