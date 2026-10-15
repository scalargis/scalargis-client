import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';

import { Alert, Anchor, Button, Group, Loader, TextInput } from '@mantine/core';

import { IconCheck, IconCheckCircle, IconInfoCircle, IconXCircle } from '@scalargis/ui';
import { i18n as i18nUtils } from '@scalargis/components';


function RegistrationConfirmationWidget({ core, token, auth, registration, history, redirect, urlRedirect }) {

  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [goRedirect, setGoRedirect] = useState(false);
  const [validating, setValidating] = useState(!!token);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Enable redux actions
  const dispatch = useDispatch();

  const { registration_confirmation, resend_confirmation, login, logout } = core.actions;

  useEffect(() => {
    if (auth?.data?.token) return;

    dispatch(registration_confirmation({ token }, history, redirect));
  }, []);

  useEffect(() => {
    if (validating && (registration.response || auth.http_error)) {
      setValidating(false);
    }
  }, [registration.response, auth.http_error]);

  // Render user
  if (auth?.data?.token) {
    const { username } = auth.data;

    return (
        <div>
            <p dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("activeUserSession", "Existe uma sessão ativa para o utilizador <i><strong>{{username}}</strong></i>", undefined, undefined, undefined, {username: username})}} />
            <p>
              {i18nUtils.translateValue("clickTo", "Clique para ")}
              <Anchor component="button" type="button" onClick={e => dispatch(logout())}>
                {i18nUtils.translateValue("endSession", "terminar sessão").toLowerCase()}
              </Anchor>{i18nUtils.translateValue("andFinishUserRegistration", "e concluir registo de novo utilizador")}.
            </p>
          </div>
    )
  }

  const sendEmailConfirmation = () => {
    setSending(true);
    setSendResult(null);
    resend_confirmation(emailConfirmation, redirect)
      .then(res => setSendResult({
        error: false,
        message: i18nUtils.translateValue("userRegistrationConfirmationSentToEmail", "A confirmação de registo de utilizador foi enviada para o email {{email}}.", undefined, undefined, undefined, { email: res?.email || emailConfirmation })
      }))
      .catch(() => setSendResult({
        error: true,
        message: i18nUtils.translateValue("unavailableService", "Serviço Indisponível")
      }))
      .finally(() => setSending(false));
  }

  if (validating) {
    return (
      <div className="flex align-items-center justify-content-center flex-column px-3 py-5">
        <Loader size={50} />
        <p className="mt-3" style={{ lineHeight: 1.5 }}>{i18nUtils.translateValue("validatingRegistration", "A validar registo")}...</p>
      </div>
    );
  }

  if (registration.response && !!registration.response && !!registration.response.authenticated) {
    return (
      <div>
          <div className="flex align-items-center justify-content-center flex-column px-3">
            <h3>{i18nUtils.translateValue("createUser", "Criar utilizador")}</h3>
            <IconCheckCircle style={{ fontSize: '5rem', color: 'var(--mantine-color-success-6)' }} />
            <p style={{ lineHeight: 1.5 }}>{i18nUtils.translateValue("userRegistrationConfirmationSuccess", "Registo de utilizador confirmado com sucesso")}!</p>
            <Button className="my-3"
              type="button"
              leftSection={<IconCheck />}
              loading={goRedirect}
              onClick={ e => {
                setGoRedirect(true);
                dispatch(login(registration.response, history, redirect, urlRedirect));
              }}
            >{i18nUtils.translateValue("continue", "Continuar")}</Button>
          </div>
        </div>
    )
  }

  return (
    <React.Fragment>
      <div className="text-center mb-2">
        <div className="text-900 text-2xl font-medium mb-3">{i18nUtils.translateValue("userRegistrationConfirmation", "Confirmação de registo de utilizador")}</div>
        <span className="text-900 font-medium line-height-3">{i18nUtils.translateValue("userRegistrationFillEmail", "Indique o email utilizado no registo do utilizador para que seja enviada nova confirmação de registo")}.</span>
      </div>

      <div>
        <TextInput value={emailConfirmation} onChange={(e) => setEmailConfirmation(e.target.value)} label={i18nUtils.translateValue("email", "Email")} className="w-full mb-1" />

        <Group justify="flex-end" mt="md" mb="md">
            <Anchor component="button" type="button" className="font-medium"
              onClick={() => {
                history.navigate('/login?redirect=' + (redirect || '/'));
              }} >
                {i18nUtils.translateValue("login", "Login")}
            </Anchor>
        </Group>

        { sendResult &&
          <div className="w-full my-4">
            <Alert color={sendResult.error ? "danger" : "informative"} py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                {sendResult.error ? <IconXCircle /> : <IconInfoCircle />}
                <span>{sendResult.message}</span>
              </Group>
            </Alert>
          </div>
        }

        { !sendResult && auth.http_error && auth.response && !!auth.response.message &&
          <div className="w-full my-4">
            <Alert color="danger" py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                <IconXCircle />
                <span>{auth.response.message}</span>
              </Group>
            </Alert>
          </div>
        }

        { !sendResult && auth.http_error && !auth.response &&
          <div className="w-full my-4">
            <Alert color="danger" py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                <IconXCircle />
                <span>{i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}</span>
              </Group>
            </Alert>
          </div>
        }

        { !sendResult && !auth.http_error && auth.response && !!auth.response.message &&
          <div className="w-full my-4">
            <Alert color="informative" py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                <IconInfoCircle />
                <span>{auth.response.message}</span>
              </Group>
            </Alert>
          </div>
        }

        <div className="mt-4 mb-4">
          <Button
            type="button"
            fullWidth
            leftSection={<IconCheck />}
            loading={sending}
            disabled={!emailConfirmation}
            onClick={sendEmailConfirmation}
          >{i18nUtils.translateValue("send", "Enviar")}</Button>
        </div>
      </div>
    </React.Fragment>
  )
}

export default connect(state => ({ auth: state.root.auth, registration: state.root.registration }))(RegistrationConfirmationWidget)