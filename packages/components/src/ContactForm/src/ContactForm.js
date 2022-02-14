import React, { useState } from 'react'
import Cookies from 'universal-cookie'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'

const cookies = new Cookies();
const cookieAuthName = process.env.REACT_APP_COOKIE_AUTH_NAME || 'websig_dgt';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';


const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

export default function ContactFrom(props) {

  const { viewer, Utils } = props;

  //const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(viewer?.user_info?.name ? viewer.user_info.name : null);
  const [email, setEmail] = useState(viewer?.user_info?.email  ? viewer.user_info.email : null);
  const [description, setDescription] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [sending, setSending] = useState(false);

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
    const logged = cookies.get(cookieAuthName);
    if (logged) options.headers['X-API-KEY'] = logged.token;

    setSending(true);

    // Auth url. TODO: check for proxy
    let url = API_URL + '/api/v2/app/viewer/' + viewer.id + '/contact_message';
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
 
  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}