import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button, Group, Textarea, TextInput } from '@mantine/core';
import { Field, FileUpload, notify } from '@scalargis/ui';

import ContactInfo from './ContactInfo';


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

const severityColor = {
  success: 'success',
  info: 'informative',
  warn: 'warning',
  error: 'danger'
};

const InfoMessage = ({ info }) => (
  <Alert color={severityColor[info.type] || 'informative'} py="xs" style={{ width: '100%' }}>
    <Group justify="center" gap="xs" wrap="nowrap">
      <i className={info.type === 'success' ? 'pi pi-check' : 'pi pi-exclamation-triangle'} aria-hidden="true" />
      <span>{info.message}</span>
    </Group>
  </Alert>
);

export default function ContactFrom(props) {

  const { core, viewer, config, Utils } = props;

  const upload_cfg = config.upload || {};

  const showCaptcha = (!viewer?.user_info?.name && viewer.captcha_key) ? true : false;

  // name/email/description converge on react-hook-form (B-08): the required-ness and its
  // error now come from RHF/<Field>, not the hand-rolled `error={(!name || name.length===0)
  // ? requiredMessage : undefined}` idiom this replaces (findings/02 theme 4).
  const { control, handleSubmit } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: viewer?.user_info?.name || '',
      email: viewer?.user_info?.email || '',
      description: '',
    },
  });

  const [captchaResponse, setCaptchaResponse] = useState(null);
  const [files, setFiles] = useState([]);
  const [infoMessage, setInfoMessage] = useState(null);
  const [enableSubmit, setEnableSubmit] = useState(showCaptcha ? false: true);
  const [isProcessingFiles, setIsProcessingFiles] =  useState(false);
  const [sending, setSending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  // Snapshot of the submitted values, for the read-only view below — the fields
  // themselves are RHF-managed now, not plain state the completed view can keep reading.
  const [submittedValues, setSubmittedValues] = useState(null);

  // The staged File objects mirror what FileUpload shows; `files` keeps the
  // parsed base64 payloads the submit sends.
  const stagedFiles = useRef([]);

  const onFilesChange = (staged) => {
    stagedFiles.current = staged;
    const promises = staged.map(file => handleUpload(file));
    if (promises.length) setIsProcessingFiles(true);
    Promise.all(promises).then((values) => {
      setFiles(values.filter(f => f !== null));
      setIsProcessingFiles(false);
      setInfoMessage(null);
    });
  }

  const onCaptchaResponse = (e) => {
    setCaptchaResponse(e.response);
    if (e.response) setEnableSubmit(true);
  }

  const onCaptchaExpire = () => {
    setCaptchaResponse(null);
    setEnableSubmit(false);
  }

  // RHF blocks onSubmit until name/email/description all pass their <Field required>
  // rule, same as the old `if (!name || !email || !description)` guard did — onInvalid
  // reproduces the summary banner that guard used to raise alongside the per-field errors.
  function onInvalid() {
    setInfoMessage({
      type: 'error',
      message: 'Campos obrigatórios não preenchidos'
    });
  }

  function onSubmit(data) {
    const { name, email, description } = data;

    const final_files = stagedFiles.current.map(f => f.name);

    if (!validateEmail(email)) {
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

    const record = {
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
    const options = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify(record)
    }

    // Get logged user
   const logged = core.getLoggedUser();
   if (logged?.token) options.headers['X-API-KEY'] = logged.token;

    setSending(true);

    // Auth url. TODO: check for proxy
    const url = core.API_URL + '/app/viewer/' + viewer.id + '/contact_message';
    fetch(url, options)
      .then(res => res.json())
      .then(res => {
        setSending(false);
        if (res.success) {
          setInfoMessage({
            type: 'success',
            message: res.message
          });
          setSubmittedValues({ name, email, description });
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

  if (isComplete) {
    return (
      <div>
        <TextInput
          id="contact_name"
          label="Nome"
          value={submittedValues?.name || ''}
          placeholder="Nome"
          disabled
          mb="sm"
        />
        <TextInput
          id="contact_email"
          label="Email"
          value={submittedValues?.email || ''}
          placeholder="Email"
          disabled
          mb="sm"
        />
        <Textarea rows={3}
          id="contact_description"
          label="Descrição"
          value={submittedValues?.description || ''}
          placeholder="Descrição"
          disabled
          mb="sm"
        />
        <div className="mb-2">
          { (infoMessage && infoMessage.type) &&
            <InfoMessage info={infoMessage} />
          }
        </div>
      </div>
    )
  }

  const requiredMessage = config.requiredFieldMessage || 'Campo de preenchimento obrigatório';

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)}>

        <Field name="name" control={control} label="Nome" required rules={{ required: requiredMessage }}>
          {(field, fieldState) => (
            <TextInput
              {...field}
              placeholder="Nome"
              disabled={!!viewer?.user_info?.name}
              error={fieldState.error?.message}
              onChange={e => { field.onChange(e); setInfoMessage(null); }}
              mb="sm"
            />
          )}
        </Field>
        <Field name="email" control={control} label="Email" required rules={{ required: requiredMessage }}>
          {(field, fieldState) => (
            <TextInput
              {...field}
              placeholder="Email"
              disabled={!!viewer?.user_info?.email}
              error={fieldState.error?.message}
              onChange={e => { field.onChange(e); setInfoMessage(null); }}
              mb="sm"
            />
          )}
        </Field>
        <Field name="description" control={control} label="Descrição" required rules={{ required: requiredMessage }}>
          {(field, fieldState) => (
            <Textarea rows={3}
              {...field}
              placeholder="Descrição"
              error={fieldState.error?.message}
              onChange={e => { field.onChange(e); setInfoMessage(null); }}
              mb="sm"
            />
          )}
        </Field>

        { upload_cfg.enabled &&
        <div className="field">
          <label>Anexos</label>

          <FileUpload
            className="contact-form-upload-file"
            chooseLabel={ upload_cfg.chooseLabel || "Selecionar" }
            cancelLabel={ upload_cfg.cancelLabel || "Limpar" }
            onFilesChange={onFilesChange}
            multiple
            disabled={isProcessingFiles}
            accept={ (upload_cfg.accept || "image/*, application/pdf").split(',').map(s => s.trim()) }
            maxSize={ upload_cfg.maxFileSize || 1000000}
            placeholder={ upload_cfg.emptyMessage || "Arraste para aqui os ficheiros a enviar." }
            onReject={(rejections) => {
              const maxSizeMsg = (upload_cfg.invalidFileSizeMessageDetail || "Ficheiro com dimensão superior ao permitido ({0}).")
                .replace('{0}', `${(((upload_cfg.maxFileSize || 1000000)) / 1048576).toFixed(2)} MB`);
              rejections.forEach(r => notify.error(r.file.name, maxSizeMsg));
            }}
          />

            { (upload_cfg.maxFileSize) && <small className="block">Tamanho máximo do ficheiro: {(upload_cfg.maxFileSize / 1048576).toFixed(2)} MB</small> }

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

        <ContactInfo
          viewer={viewer}
          config={config}
        />

        <div className="mb-2">
          { (infoMessage && infoMessage.type) &&
            <InfoMessage info={infoMessage} />
          }
        </div>

        <Group justify="flex-end" mt="md">
          <Button
            type="submit"
            color="secondary"
            leftSection={<i className="pi pi-check" aria-hidden="true" />}
            loading={sending}
            disabled={!enableSubmit || sending}
          >
            Enviar
          </Button>
        </Group>
      </form>
  )
}
