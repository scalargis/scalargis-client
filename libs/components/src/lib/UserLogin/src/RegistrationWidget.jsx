import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Alert, Anchor, Button, Checkbox, Group, PasswordInput, TextInput } from '@mantine/core';

import { i18n as i18nUtils } from '../../components';

import { getFormValidationErrorMessage } from './utils';


function RegistrationWidget(props) {

  const { auth, viewer, history, redirect, core, dispatch, actions, record, onShowLogin } = props;
  const { siteConfig } = core;

  // Redux actions
  const { login_user_registration } = actions;

  const defaultValues = {
    name: null,
    email: null,
    username: null,
    password: '',
    confirmPassword: '',
    accept: false
  }

  const { control, watch, formState: { errors }, handleSubmit } = useForm({ defaultValues });
  const watchFields = watch(["password"]);

  const TERMS_OF_SERVICE_URL = viewer?.config_json?.terms_of_service_url;

  const onSubmit = (data) => {
    const {accept, confirmPassword, ...rest} = data;
    const payload = {
        ...rest,
        redirect
    }
    const apiUrl = siteConfig?.authentication?.endpoints?.registration;
    dispatch(login_user_registration(core, payload, apiUrl, redirect));
  }

  if (auth?.response?.register_user === true && !auth?.response?.error) {
    return (
      <div className="pt-6 px-3">
        <div className="text-center mb-5">
          <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--mantine-color-success-6)' }}></i>
          <h3>{i18nUtils.translateValue("userRegistrationSuccess", "Registo realizado com sucesso")}!</h3>
        </div>
        <p className="line-height-3 text-justify" dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("userRegistrationSuccessMsg", "A sua conta foi criada com o username <b>{{username}}</b>, deverá proceder à sua ativação durante as próximas 24 horas. Por favor, verifique as instruções de ativação da conta enviadas para o email <b>{{email}}</b>.", undefined, undefined, undefined, {username: auth?.response?.username, email: auth?.response?.email})}} />
        <div className='text-center py-2'>
          <Anchor component="button" type="button"
            onClick={ (e) => { e.preventDefault(); onShowLogin() }}>
            Login
          </Anchor>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <div className="p-fluid">
        <h3>{i18nUtils.translateValue("userRegistrationData", "Dados de registo")}</h3>

        <div className="field pt-2">
          <Controller name="name" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
              <TextInput id={field.name} {...field} value={field.value ?? ''} autoFocus error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataName", "Nome")}*`} />
          )} />
          {getFormValidationErrorMessage(errors, 'name')}
        </div>
        <div className="field">
          <Controller name="email" control={control}
              rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório"), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, message: i18nUtils.translateValue("invalidEmailFormat", "Email inválido. E.g. exemplo@email.pt") }}}
              render={({ field, fieldState }) => (
                  <TextInput id={field.name} {...field} value={field.value ?? ''} error={fieldState.invalid}
                    label={`${i18nUtils.translateValue("userRegistrationDataEmail", "Email")}*`}
                    rightSection={<i className="pi pi-envelope" aria-hidden="true" />} />
          )} />
          {getFormValidationErrorMessage(errors, 'email')}
        </div>
        <div className="field pt-2">
          <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
              <TextInput id={field.name} {...field} value={field.value ?? ''} error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataUsername", "Nome de utilizador")}*`}
                autoComplete="off" />
          )} />
          {getFormValidationErrorMessage(errors, 'username')}
        </div>
        {/* Prime's Password strength meter (weak/medium/strong) has no Mantine
            twin — the visibility toggle stays, the meter does not. */}
        <div className="field pt-2">
          <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
              <PasswordInput id={field.name} {...field} error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataPassword", "Password")}*`}
                autoComplete="off"
                aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'password')}
        </div>
        <div className="field pt-2">
          <Controller name="confirmPassword" control={control}
            rules={{
              required: i18nUtils.translateValue("requiredField", "Campo obrigatório"),
              validate: (value) => {
                  if (value && watchFields[0] && value != watchFields[0]) {
                      return i18nUtils.translateValue("noMatchingPasswords", "As passwords instroduzidas não são iguais");
                  }
                  return true;
              }
            }}
            render={({ field, fieldState }) => (
              <PasswordInput id={field.name} {...field} error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataConfirmPassword", "Confirmar password")}*`}
                autoComplete="off"
                aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'confirmPassword')}
        </div>
        <div className="field-checkbox">
            <Controller name="accept" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <Checkbox
                  id={field.name}
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                  error={fieldState.invalid || undefined}
                  label={<span>{i18nUtils.translateValue("acceptThe", "Aceito os")} <a href={TERMS_OF_SERVICE_URL} target="_blank" rel="noopener noreferrer">{i18nUtils.translateValue("termsAndConditions", "termos e condições de utilização")}</a>*</span>}
                />
            )} />
        </div>
      </div>

      { onShowLogin && <div className="text-center">
          <Anchor component="button" type="button"
            onClick={(e) => {
              e.preventDefault();
              onShowLogin();
            }}>
            {i18nUtils.translateValue("login", "Entrar")}
          </Anchor>
        </div> }

      <Group justify="flex-end" mt="md">
        <Button
          type="submit"
          leftSection={<i className="pi pi-check" />}
          loading={auth.loading}
        >{i18nUtils.translateValue("createUser","Criar utilizador")}</Button>
      </Group>

      { auth.http_error && !auth.response &&
        <div className="mt-3">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-times-circle" />
              <span>{i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}</span>
            </Group>
          </Alert>
        </div>
      }

      { auth.response && !!auth.response && !!auth.response.message &&
        <div className="mt-3">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-times-circle" />
              <span>{auth.response.message}</span>
            </Group>
          </Alert>
        </div>
      }

    </form>
  )
}

export default RegistrationWidget;