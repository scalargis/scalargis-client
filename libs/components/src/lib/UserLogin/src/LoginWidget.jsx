import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'

import { Alert, Anchor, Button, Group, PasswordInput, TextInput } from '@mantine/core'

import { i18n as i18nUtils } from '../../components'

import { getFormValidationErrorMessage } from './utils'


function LoginWidget(props) {

  const { auth, history, redirect, core, dispatch, actions, record, onShowRegistration, onShowPasswordReset } = props;
  const { siteConfig } = core;

  const componentCfg = record.config_json || {};

  // Redux actions
  const { login_post, login_clear_error, logout } = actions;

  const defaultLoginValues = {
    username: '',
    password: ''
  }

  const { control, formState: { errors }, handleSubmit } = useForm({ defaultLoginValues });

  useEffect(() => {
    dispatch(login_clear_error());
  }, []);

  if (auth?.data?.token) {
    const { username } = auth.data;
    return (
      <div>
        <p>{i18nUtils.translateValue("hello_user", "Olá {{username}}", undefined, undefined, undefined, {username})}.</p>
        <p>
          {i18nUtils.translateValue("clickTo", "Clique para")}{' '}
          <Anchor component="button" type="button" onClick={e => dispatch(logout())}>
            {i18nUtils.translateValue("endSession", "Terminar sessão")}
          </Anchor>.
        </p>
      </div>
    )
  }

  // Enter submits natively (the footer button is type="submit"); handleSubmit
  // validates first, which is what the old manual Enter interception did.
  const onSubmit = (data) => {
    if (record?.config_json?.actions?.login) {
      core.pubsub.publish(record?.config_json?.actions?.login, null);
      return;
    }
    const apiUrl = siteConfig?.authentication?.endpoints?.login;
    dispatch(login_post(core, { username: data.username, password: data.password }, apiUrl, history, redirect));
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <div className="p-fluid">
        <div className="field grid">
          <label htmlFor="username" className="col-12 md:col-4">{`${i18nUtils.translateValue("user", "Utilizador")} / E-mail`}</label>
          <div className="col-12 md:col-8">
            <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
                <TextInput id={field.name} {...field} autoFocus error={fieldState.invalid}
                  autoComplete="off"
                  aria-autocomplete="none" />
              )} />
            {getFormValidationErrorMessage(errors, 'username')}
          </div>
        </div>
        <div className="field grid">
          <label htmlFor="password" className="col-12 md:col-4">{i18nUtils.translateValue("password", "Palavra-passe")}</label>
          <div className="col-12 md:col-8">
            <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
              <PasswordInput id={field.name} {...field}
                error={fieldState.invalid}
                autoComplete="off"
                aria-autocomplete="none" />
                )} />
            {getFormValidationErrorMessage(errors, 'password')}
          </div>
        </div>

        { (componentCfg.reset_password === true || componentCfg.reset_password_login_error === true || componentCfg.user_registration) && <div className="field grid">
          { (componentCfg.reset_password || (componentCfg.reset_password_login_error && auth.response && !!auth.response && !!auth.response.message)) && <div className={`col p-2`}>
            <Anchor component="button" type="button"
              onClick={ (e) => { e.preventDefault(); onShowPasswordReset() }}>
              {i18nUtils.translateValue("passwordReset", "Recuperar password")}
            </Anchor>
          </div> }
          { componentCfg.user_registration && <div className='col p-2'>
            <Anchor component="button" type="button"
              onClick={ (e) => { e.preventDefault(); onShowRegistration() }}>
              {i18nUtils.translateValue("userRegistration", "Novo utilizador")}
            </Anchor>
          </div> }
        </div> }
      </div>

      <Group justify="flex-end" mt="md">
        <Button
          type="submit"
          leftSection={<i className="pi pi-check" />}
          loading={auth.loading}
        >{i18nUtils.translateValue("login", "Entrar")}</Button>
      </Group>

      { auth.http_error && !auth.response &&
        <div className="mt-3">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-times-circle" />
              <span>{i18nUtils.translateValue("unavailableService", "Serviço indisponível")}</span>
            </Group>
          </Alert>
        </div>
      }

      { auth.response && !!auth.response && !!auth.response.message &&
        <div className="mt-3">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-times-circle" />
              <span>{auth?.response?.message}</span>
            </Group>
          </Alert>
        </div>
      }

    </form>
  )
}

export default LoginWidget;