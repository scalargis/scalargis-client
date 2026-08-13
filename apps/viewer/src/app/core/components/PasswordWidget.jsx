import React, { useState, useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';

import { Alert, Anchor, Button, Group, PasswordInput, TextInput } from '@mantine/core';

import { i18n as i18nUtils, PasswordRules, usePasswordPolicy, validatePasswordAgainstPolicy } from '@scalargis/components';

import { getAppApiUrl } from '../utils';


function PasswordWidget({ core, token, auth, pwd, history, redirect, urlRedirect }) {

  const [mode, setMode] = useState('set');

  const [username, setUsername] = useState();
  const [password, setPassword] = useState('');
  const [goRedirect, setGoRedirect] = useState(false);

  // The server's password rules, fetched once — they drive both the live
  // requirements checklist and the pre-submit check below.
  const passwordPolicy = usePasswordPolicy(getAppApiUrl());

  // Enable redux actions
  const dispatch = useDispatch();

  const { siteConfig } = core;
  const { login_reset_password, password_reset_validation, password_post, login_post, logout } = core.actions;

  const defaultValues = {
    newPassword: '',
    confirmPassword: ''
  }

  useEffect(() => {
    if (auth?.data?.token)  return;

    dispatch(password_reset_validation({ token }, history, redirect));
  }, []);

  useEffect(() => {
    if (auth.response && auth.response.valid_token === false) {
      setMode('reset');
    }
  }, [auth]);

  const { control, watch, formState: { errors }, handleSubmit } = useForm({ defaultValues });
  const watchFields = watch(["newPassword"]);


  const getFormValidationErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      return <small className="sg-error">{errors[name].message || 'Campo obrigatório'}</small>
    }
  };

  const onSubmit = (data) => {
    setPassword(data.newPassword);
    dispatch(password_post({ token, password: data.newPassword }, history, redirect))
  }

  // Render user
  if (auth?.data?.token) {
    const { username } = auth.data;
    return (
      <React.Fragment>
        <p dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("activeUserSession", "Existe uma sessão ativa para o utilizador <i><strong>{ username }</strong></i>.", undefined, undefined, undefined, {username})}} />
        <p>
          {i18nUtils.translateValue("clickTo", "Clique para")}{' '}
          <Anchor component="button" type="button" onClick={e => dispatch(logout())}>
            {i18nUtils.translateValue("endSession", "Terminar sessão")}
          </Anchor>{i18nUtils.translateValue("andChangePassword", "e fazer a alteração da palavra-passe")}.
        </p>
      </React.Fragment>
    )
  }

  if (pwd.response && !!pwd.response && !!pwd.response.authenticated) {
    const username = pwd.response.username;

    return (
        <div>
          <div className="w-full my-4 text-center">
            <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--mantine-color-success-6)' }}></i>
            <p style={{ lineHeight: 1.5 }}>{i18nUtils.translateValue("changePasswordConfirmationSuccess", "A Palavra-passe foi alterada com sucesso")}!</p>
            <Button
              type="button"
              leftSection={<i className="pi pi-check" />}
              loading={goRedirect}
              onClick={ e => {
                setGoRedirect(true);
                const apiUrl = siteConfig?.authentication?.endpoints?.login;
                dispatch(login_post(core, { username, password }, apiUrl, history, redirect, urlRedirect));
              }}
            >{i18nUtils.translateValue("continue", "Continuar")}</Button>
          </div>
        </div>
    )
  }

  if (mode === 'reset') {
    if (auth?.response?.reset_password) {
      return (
        <div>
          <div className="w-full my-4">
            <Alert color="informative" py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                <i className="pi pi-info-circle" />
                <span>{auth.response.message}</span>
              </Group>
            </Alert>
          </div>
          <Group justify="flex-end" mt="md" mb="md">
            <Anchor component="button" type="button" className="font-medium"
              onClick={(e) => history.navigate('/login?redirect=' + (redirect || '/'))}>
                {i18nUtils.translateValue("login", "Login")}
            </Anchor>
          </Group>
        </div>
      )
    } else {
      return (
        <React.Fragment>
          <div className="text-center mb-5">
            <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("passwordReset", "Recuperação de password")}</div>
            <span className="text-600 font-medium line-height-3"
              dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("passwordResetSendEmail", "Indique o seu <i>username</i> ou <i>email</i> para receber um email com instruções para alterar a palavra-passe.")}} />
          </div>

          <div>
            <TextInput
              className="w-full mb-1"
              label={`${i18nUtils.translateValue("user", "Utilizador")} / E-mail`}
              value={username ?? ''}
              error={username == '' || undefined}
              onChange={e => setUsername(e.target.value)}
            />
            { username == '' && <small className="sg-error">Campo obrigatório</small> }

            <Group justify="flex-end" mt="md" mb="md">
                <Anchor component="button" type="button" className="font-medium"
                  onClick={(e) => history.navigate('/login?redirect=' + (redirect || '/'))}>
                    {i18nUtils.translateValue("login", "Login")}
                </Anchor>
            </Group>

            { auth.http_error && !auth.response &&
                <div className="w-full my-4">
                  <Alert color="danger" py="xs">
                    <Group justify="center" gap="xs" wrap="nowrap">
                      <i className="pi pi-times-circle" />
                      <span>{i18nUtils.translateValue("unavailableService", "Serviço indisponível")}</span>
                    </Group>
                  </Alert>
                </div>
            }

            { auth.response && !!auth.response && !!auth.response.message &&
              <div className="w-full my-4">
                <Alert color={auth.http_error ? "danger" : "informative"} py="xs">
                  <Group justify="center" gap="xs" wrap="nowrap">
                    <i className={auth.http_error ? "pi pi-times-circle" : "pi pi-info-circle"} />
                    <span>{auth?.response?.message}</span>
                  </Group>
                </Alert>
              </div>
            }

            <div className="mt-4 mb-4">
                <Button
                    type="button"
                    fullWidth
                    leftSection={<i className="pi pi-check" />}
                    loading={auth.loading}
                    onClick={(e)=> {
                      e.preventDefault();
                      if (!username) {
                        setUsername('');
                        return;
                      }
                      dispatch(login_reset_password({ username }, history, redirect));}
                    }
                >{i18nUtils.translateValue("send", "Enviar")}</Button>
            </div>
          </div>
        </React.Fragment>
      )
    }
  }

  if (mode === 'set') {

    return (
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div className="text-center mb-5">
              <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("passwordReset", "Recuperação de password")}</div>
              <span className="text-600 font-medium line-height-3">{i18nUtils.translateValue("passwordResetIntroMsg", "Por favor, defina e confirme a sua nova palavra-passe.")}</span>
          </div>
          <div>
            {/* Prime's Password strength meter and overlay footer have no
                Mantine twin — the live requirements checklist renders below the
                field instead; the visibility toggle stays. Both it and the
                validate below come from the server's password_policy. */}
            <Controller name="newPassword" control={control}
                rules={{
                    required: i18nUtils.translateValue("requiredField", "Campo obrigatório"),
                    validate: (value) => {
                        // Catches a non-compliant password before the API call.
                        // No policy fetched → no verdict here; set_password decides.
                        if (validatePasswordAgainstPolicy(passwordPolicy, value).length) {
                            return i18nUtils.translateValue("password_policy_violation", "A palavra-passe não cumpre os requisitos de segurança.");
                        }
                        return true;
                    }
                }}
                render={({ field, fieldState }) => (
                <PasswordInput id={field.name} {...field}
                    label={i18nUtils.translateValue("newPassword", "Nova password")}
                    error={fieldState.invalid}
                    className="w-full mb-1"
                    autoComplete="off"
                    aria-autocomplete="none"
                    disabled={auth?.response?.success} />
            )} />
            {getFormValidationErrorMessage(errors, 'newPassword')}

            <Controller name="confirmPassword" control={control}
                rules={{
                    required: i18nUtils.translateValue("requiredField", "Campo obrigatório"),
                    validate: (value) => {
                        if (value && watchFields[0] && value != watchFields[0]) {
                            return i18nUtils.translateValue("noMatchingPasswords", "As passwords introduzidas não são iguais");
                        }
                        return true;
                    }
                }}
                render={({ field, fieldState }) => (
                <PasswordInput id={field.name} {...field}
                    label={i18nUtils.translateValue("confirmPassword", "Confirmar password")}
                    error={fieldState.invalid}
                    className="w-full mb-1 mt-2"
                    autoComplete="off"
                    aria-autocomplete="none"
                    disabled={auth?.response?.success} />
                )}
            />
            {getFormValidationErrorMessage(errors, 'confirmPassword')}

            <PasswordRules policy={passwordPolicy} password={watchFields[0]} />

            <Group justify="flex-end" mt="md" mb="md">
                <Anchor component="button" type="button" className="font-medium"
                  onClick={(e) => history.navigate('/login?redirect=' + (redirect || '/'))}>
                    {i18nUtils.translateValue("login", "Login")}
                </Anchor>
              </Group>

            { pwd.http_error && !pwd.response &&
                <div className="w-full my-4">
                  <Alert color="danger" py="xs">
                    <Group justify="center" gap="xs" wrap="nowrap">
                      <i className="pi pi-times-circle" />
                      <span>{i18nUtils.translateValue("unavailableService", "Serviço indisponível")}</span>
                    </Group>
                  </Alert>
                </div>
            }

            { pwd.response && !!pwd.response && !pwd.authenticated && !!pwd.response.message &&
                <div className="w-full my-4">
                  <Alert color="danger" py="xs">
                    <Group justify="center" gap="xs" wrap="nowrap">
                      <i className="pi pi-times-circle" />
                      <span>{pwd?.response?.message}</span>
                    </Group>
                  </Alert>
                </div>
            }

            <div className="mt-4 mb-4">
                <Button
                    type="submit"
                    fullWidth
                    leftSection={<i className="pi pi-check" />}
                    loading={pwd.loading}
                >{i18nUtils.translateValue("accept", "Aceitar")}</Button>
            </div>
          </div>
        </form>
    )
  }
}

export default connect(state => ({ auth: state.root.auth, pwd: state.root.password }))(PasswordWidget)