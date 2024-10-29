import React, { useState, useRef } from 'react';
import Cookies from 'universal-cookie';
import { FileUpload } from 'primereact/fileupload';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
//import { Captcha } from 'primereact/captcha';
import ContactInfo from './ContactInfo';
import './style.css';


const cookies = new Cookies();

const validateEmail = (email) => {
  return email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  );
};

const readUploadedFile = (file) => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    reader.onload = () => {
      const f = {
        filename: file.name,
        type: file.type, 
        size: file.size, 
        data: reader.result 
      }
      resolve(f);
    };
    reader.readAsDataURL(file);
  });
};

const handleUpload = async (file) => {
  try {
    const fileContents = await readUploadedFile(file);
    return fileContents;
  } catch (e) {
    console.warn(e.message)
    return null;
  }
}

export default function ContactFrom(props) {

  const { core, viewer, config, Utils } = props;

  const upload_cfg = config.upload || {};

  const showCaptcha = (!viewer?.user_info?.name && viewer.captcha_key) ? true : false;

  //const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(viewer?.user_info?.name ? viewer.user_info.name : null);
  const [email, setEmail] = useState(viewer?.user_info?.email  ? viewer.user_info.email : null);
  const [captchaResponse, setCaptchaResponse] = useState(null);
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [enableSubmit, setEnableSubmit] = useState(showCaptcha ? false: true);
  const [isProcessingFiles, setIsProcessingFiles] =  useState(false);
  const [sending, setSending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const fileUploadRef = useRef(null);

  const onFileSelect = (e) => {
    const upload_files = Array.from(e.files).filter(f => fileUploadRef.current.isFileSelected(f)).map(f=>f);
    const promises = Array.from(upload_files).map(file => handleUpload(file));
    if (promises && promises.length) setIsProcessingFiles(true);
    Promise.all(promises).then((values) => {;
      setFiles([...files, ...values]);
      setIsProcessingFiles(false);
      setInfoMessage(null);
    });
  }

  const onFileRemove = (e) => {
    if (files && files.length) {
      const new_files = files.filter(obj => obj.filename !== e.file.name);
      setFiles(new_files);
      setInfoMessage(null);
    }
  }
  const onTemplateRemove = (file, callback) => {
      callback();
  }  

  const onFileClear = () => {
    setFiles([]);
    setInfoMessage(null);
  }

  const onCaptchaResponse = (e) => {
    setCaptchaResponse(e.response);
    if (e.response) setEnableSubmit(true);
  }

  const onCaptchaExpire = () => {
    setCaptchaResponse(null);
    setEnableSubmit(false);
  }  

  function submit(e) {
    e.preventDefault();

    const final_files = fileUploadRef.current && fileUploadRef.current.files ? 
      fileUploadRef.current.files.filter(f=>fileUploadRef.current.isFileSelected(f)).map(f=>f.name) 
      :[];    

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
    } else if (upload_cfg?.minFiles != null && (upload_cfg.minFiles  > final_files.length)) {
      setInfoMessage({
        type: 'error',
        message: `Tem de anexar pelo menos ${upload_cfg.minFiles} ficheiro(s).`
      });
      return false;
    } else if (upload_cfg?.maxFiles !=null && upload_cfg?.maxFiles < final_files.length) {
      setInfoMessage({
        type: 'error',
        message: `Apenas pode anexar até ${upload_cfg.maxFiles} ficheiro(s).`
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

    if (files && files.length) {
      record['files'] = files.filter(f=>final_files.includes(f.filename));
    }

    if (showCaptcha) {
      record['captcha'] = captchaResponse;
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
          setIsComplete(true);
        } else {
          setInfoMessage({
            type: 'error',
            message: res.message
          });
          setIsComplete(false);   
        }
      }).catch(error => {
        setSending(false);
        setInfoMessage({
          type: 'error',
          message: 'Ocorreu um erro.'
        });
        setIsComplete(false);
      });
  }

  const itemTemplate = (file, props) => {
      return (
          <div className="p-d-flex p-ai-center p-flex-wrap">
              <div className="p-d-flex p-ai-center" style={{width: '70%'}}>
                  <span className="p-d-flex p-dir-col p-text-left p-ml-0 p-mr-1" style={{"wordBreak": "break-all"}}>
                      {file.name}
                  </span>
              </div>
              <Tag value={props.formatSize} className="p-px-1 p-py-1" />
              <Button type="button" icon="pi pi-times" className="p-button-outlined p-button-rounded p-button-danger p-ml-auto" onClick={() => onTemplateRemove(file, props.onRemove)} />
          </div>
      )
  }

  const emptyTemplate = () => {
      return (
          <div className="p-d-flex p-ai-center p-dir-col">
              <i className="pi pi-image p-mt-3 p-p-5" style={{'fontSize': '5em', borderRadius: '50%', backgroundColor: 'var(--surface-b)', color: 'var(--surface-d)'}}></i>
              <span style={{'fontSize': '1.2em', color: 'var(--text-color-secondary)'}} className="p-my-5">Drag and Drop Image Here</span>
          </div>
      )
  }

  if (isComplete) {
    return (
      <div className="p-fluid">
        <div className="p-field">
          <label htmlFor="contact_name">Nome</label>
          <InputText
              id="contact_name"
              value={name}
              placeholder="Nome"
              disabled
            />                                 
        </div>
        <div className="p-field">
          <label htmlFor="contact_email">Email</label>
          <InputText
              id="contact_email"
              value={email}
              placeholder="Email"
              disabled
            />                                  
        </div>
        <div className="p-field">
          <label htmlFor="contact_description">Descrição</label>
          <InputTextarea rows={3}
              id="contact_description"
              value={description}
              placeholder="Descrição"
              disabled
            />
        </div>      
        <div className="p-field">    
          <div className="p-mb-2">
            { (infoMessage && infoMessage.type) && 
              <Message style={{ width: '100%' }} severity={infoMessage.type} text={infoMessage.message}></Message>
            }
          </div> 
        </div>
      </div>
    )
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
                <small className="p-invalid block">{config.requiredFieldMessage || 'Campo de preenchimento obrigatório'}</small> }                                  
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
                <small className="p-invalid block">{config.requiredFieldMessage || 'Campo de preenchimento obrigatório'}</small> }                                  
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
                <small className="p-invalid block">{config.requiredFieldMessage || 'Campo de preenchimento obrigatório'}</small> }
          </div>

          { upload_cfg.enabled &&
          <div className="p-field">
            <label htmlFor="contact_description">Anexos</label>

            <FileUpload ref={fileUploadRef} name="files[]"
                uploadOptions={{"style" : {"display": 'none'}}}
                className="contact-form-upload-file"
                chooseLabel={ upload_cfg.chooseLabel || "Selecionar" }
                cancelLabel={ upload_cfg.cancelLabel || "Limpar" }
                itemTemplate={itemTemplate}
                onSelect={onFileSelect}
                onRemove={onFileRemove}
                onClear={onFileClear}                               
                multiple
                disabled={isProcessingFiles} 
                accept={ upload_cfg.accept || "image/*, application/pdf" }
                maxFileSize={ upload_cfg.maxFileSize || 1000000}
                invalidFileSizeMessageSummary="{0}"
                invalidFileSizeMessageDetail={ upload_cfg.invalidFileSizeMessageDetail || "Ficheiro com dimensão superior ao permitido ({0})." }
                emptyTemplate={<p className="m-0">{ upload_cfg.emptyMessage || "Arraste para aqui o ficheiros a enviar." }</p>} 
              />

              { (upload_cfg.maxFileSize) && <small className="p-invalid block">Tamanho máximo do ficheiro: {(upload_cfg.maxFileSize / 1048576).toFixed(2)} MB</small> } 

          </div> }
          
          {/*
          { showCaptcha ?
          <div className="p-field">
            <Captcha siteKey={viewer.captcha_key}
              language='pt'
              onResponse={onCaptchaResponse} 
              onExpire={onCaptchaExpire}
              />
          </div> : null }
          */}
        </div>
        
        <ContactInfo
          viewer={viewer} 
          config={config} 
        />
                  
        <div className="p-mb-2">
          { (infoMessage && infoMessage.type) && 
            <Message style={{ width: '100%' }} severity={infoMessage.type} text={infoMessage.message}></Message>
          }
        </div>                   

        <div className="p-dialog-myfooter">
          <Button
            className='p-button-secondary'
            icon={ sending ? "pi pi-spin pi-spinner": "pi pi-check" }
            label="Enviar" 
            onClick={submit}
            disabled={!enableSubmit || sending}
          />
        </div>         
      </form>
    </React.Fragment>
  )
}