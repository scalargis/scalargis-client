import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'

import { Alert, Anchor, Button, Group, PasswordInput, TextInput } from '@mantine/core'
import { IconXCircle, IconUser, IconCheck } from '@scalargis/ui'

import { i18n as i18nUtils } from '../../components'

import { getFormValidationErrorMessage } from './utils'


/**
 * Shared credential form for both viewer surfaces — the full-page `/login`
 * container (`layout="page"`) and the topbar login dialog (`layout="dialog"`).
 *
 * This is a PURE presentational widget: it never touches the redux store or an
 * action creator. The owning container keeps the app-specific wiring and hands
 * it down as callbacks — `onLogin(data)` does the dispatch, `onClearError()`
 * clears a stale error on mount, `onShowRegistration`/`onShowResetPassword`
 * switch panels — plus the two link-visibility booleans it computed from its
 * own config source (`siteConfig.authentication` on the page,
 * `record.config_json` in the dialog). Keeping the store out of here is exactly
 * what lets one widget serve both surfaces without binding to either one's
 * redux slice or `login_post` signature.
 */
function LoginWidget(props) {

  const {
    auth,
    layout = 'dialog',
    onLogin,
    onClearError,
    onShowRegistration,
    onShowResetPassword,
    showRegistration = false,
    showResetPassword = false,
  } = props;

  const defaultLoginValues = {
    username: '',
    password: ''
  }

  const { control, formState: { errors }, handleSubmit } = useForm({ defaultLoginValues });

  useEffect(() => {
    onClearError && onClearError();
  }, []);

  // Enter submits natively (the footer button is type="submit"); handleSubmit
  // validates first, which is what the old manual Enter interception did.
  const onSubmit = (data) => {
    onLogin && onLogin(data);
  }

  const errorAlerts = (
    <React.Fragment>
      { auth.http_error && !auth.response &&
        <div className={layout === 'page' ? 'w-full my-4' : 'mt-3'}>
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <IconXCircle />
              <span>{i18nUtils.translateValue("unavailableService", "Serviço indisponível")}</span>
            </Group>
          </Alert>
        </div>
      }

      { auth.response && !!auth.response && !!auth.response.message &&
        <div className={layout === 'page' ? 'w-full my-4' : 'mt-3'}>
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <IconXCircle />
              <span>{auth?.response?.message}</span>
            </Group>
          </Alert>
        </div>
      }
    </React.Fragment>
  );

  if (layout === 'page') {
    return (
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <div className="text-center mb-3">
          { showRegistration &&
          <React.Fragment>
            <span className="text-600 font-medium line-height-3">{i18nUtils.translateValue("noAccount", "Não tem uma conta?")}</span>
            <Anchor component="button" type="button" className="font-medium ml-2" onClick={(e) => onShowRegistration()}>{i18nUtils.translateValue("registerHere", "Registe-se aqui!")}</Anchor>
          </React.Fragment>
          }
        </div>

        <div>
          <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
            <TextInput id={field.name} {...field} autoFocus label="Username/Email" error={fieldState.invalid} className="w-full mb-1"
              autoComplete="off"
              aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'username')}

          <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
            <PasswordInput id={field.name} {...field}
              label="Password"
              error={fieldState.invalid}
              className="w-full mb-1 mt-2"
              autoComplete="off"
              aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'password')}

          { showResetPassword &&
          <Group justify="flex-end" mt="md" mb="md">
            <Anchor component="button" type="button" className="font-medium"
              onClick={ (e) => { e.preventDefault(); onShowResetPassword() }}>
                {i18nUtils.translateValue("forgotPassword", "Esqueceu-se da password?")}
            </Anchor>
          </Group>
          }

          {errorAlerts}

          <div className="mt-4 mb-4">
            <Button
              type="submit"
              fullWidth
              leftSection={<IconUser />}
              loading={auth.loading}
            >{i18nUtils.translateValue("login", "Entrar")}</Button>
          </div>
        </div>
      </form>
    )
  }

  // layout === 'dialog'
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

        { (showResetPassword || showRegistration) && <div className="field grid">
          { showResetPassword && <div className={`col p-2`}>
            <Anchor component="button" type="button"
              onClick={ (e) => { e.preventDefault(); onShowResetPassword() }}>
              {i18nUtils.translateValue("passwordReset", "Recuperar password")}
            </Anchor>
          </div> }
          { showRegistration && <div className='col p-2'>
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
          leftSection={<IconCheck />}
          loading={auth.loading}
        >{i18nUtils.translateValue("login", "Entrar")}</Button>
      </Group>

      {errorAlerts}

    </form>
  )
}

export default LoginWidget;
