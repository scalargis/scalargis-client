import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Alert, Anchor, Button, Checkbox, Group, PasswordInput, TextInput } from '@mantine/core';
import { IconCheckCircle, IconXCircle, IconEnvelope, IconUser, IconCheck } from '@scalargis/ui';

import { i18n as i18nUtils } from '../../components';
import PasswordRules, { usePasswordPolicy, validatePasswordAgainstPolicy } from '../../PasswordRules';

import { getFormValidationErrorMessage } from './utils';


/**
 * Shared registration form for both viewer surfaces — the full-page `/login`
 * container (`layout="page"`) and the topbar login dialog (`layout="dialog"`).
 *
 * Pure and callback-delegated like {@link LoginWidget}: `onRegistration(payload)`
 * carries the cleaned data (accept/confirmPassword already stripped) to the
 * container, which owns the dispatch. The server password policy — previously
 * wired only into the full-page copy — now drives BOTH layouts: the live
 * `PasswordRules` checklist and the pre-submit `validate`. The container passes
 * the `apiUrl` the policy is fetched from and the `termsOfServiceUrl` from its
 * own config source (`siteConfig` on the page, `viewer.config_json` in the
 * dialog).
 */
function RegistrationWidget(props) {

  const {
    auth,
    layout = 'dialog',
    apiUrl,
    termsOfServiceUrl,
    onRegistration,
    onClearError,
    onShowLogin,
  } = props;

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

  // The server's password rules, fetched once — they drive both the live
  // requirements checklist and the pre-submit check below.
  const passwordPolicy = usePasswordPolicy(apiUrl);

  useEffect(() => {
    onClearError && onClearError();
  }, []);

  const onSubmit = (data) => {
    const { accept, confirmPassword, ...payload } = data;
    onRegistration && onRegistration(payload);
  }

  // Validation rules are identical across layouts — only the markup differs.
  const emailRules = {
    required: i18nUtils.translateValue("requiredField", "Campo obrigatório"),
    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, message: i18nUtils.translateValue("invalidEmailFormat", "Email inválido. E.g. exemplo@email.pt") }
  };
  const requiredRule = { required: i18nUtils.translateValue("requiredField", "Campo obrigatório") };
  const passwordRules = {
    required: i18nUtils.translateValue("requiredField", "Campo obrigatório"),
    validate: (value) => {
      // Catches a non-compliant password before the API call. No policy
      // fetched → no verdict here; register_user still decides on the server.
      if (validatePasswordAgainstPolicy(passwordPolicy, value).length) {
        return i18nUtils.translateValue("password_policy_violation", "A palavra-passe não cumpre os requisitos de segurança.");
      }
      return true;
    }
  };
  const confirmPasswordRules = {
    required: i18nUtils.translateValue("requiredField", "Campo obrigatório"),
    validate: (value) => {
      if (value && watchFields[0] && value != watchFields[0]) {
        return i18nUtils.translateValue("noMatchingPasswords", "As passwords instroduzidas não são iguais");
      }
      return true;
    }
  };

  if (layout === 'page') {
    if (auth?.response?.register_user === true && !auth?.response?.error) {
      return (
        <div>
          <div className="text-center mb-4">
            <IconCheckCircle style={{ fontSize: '5rem', color: 'var(--mantine-color-success-6)' }} />
            <h3>{i18nUtils.translateValue("userRegistrationSuccess", "Registo realizado com sucesso")}!</h3>
          </div>
          <p className="line-height-3 text-justify" dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("userRegistrationSuccessMsg", "A sua conta foi criada com o username <b>{{username}}</b>, deverá proceder à sua ativação durante as próximas 24 horas. Por favor, verifique as instruções de ativação da conta enviadas para o email <b>{{email}}</b>.", undefined, undefined, undefined, {username: auth?.response?.username, email: auth?.response?.email})}} />

          { onShowLogin && <Group justify="flex-end" mt="md" mb="md">
            <Anchor component="button" type="button" className="font-medium" onClick={onShowLogin}>
              {i18nUtils.translateValue("login", "Login")}
            </Anchor>
          </Group> }
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <div>
          <Controller name="name" control={control} rules={requiredRule} render={({ field, fieldState }) => (
            <TextInput id={field.name} {...field} value={field.value ?? ''} autoFocus label={i18nUtils.translateValue("userRegistrationDataName", "Nome")} error={fieldState.invalid} className="w-full mb-1" />
          )} />
          {getFormValidationErrorMessage(errors, 'name')}

          <Controller name="email" control={control} rules={emailRules} render={({ field, fieldState }) => (
            <TextInput id={field.name} {...field} value={field.value ?? ''} label="Email" error={fieldState.invalid} className="w-full mb-1 mt-2"
              rightSection={<IconEnvelope />}
              autoComplete="off"
              aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'email')}

          <Controller name="username" control={control} rules={requiredRule} render={({ field, fieldState }) => (
            <TextInput id={field.name} {...field} value={field.value ?? ''} label="Username" error={fieldState.invalid} className="w-full mb-1 mt-2" />
          )} />
          {getFormValidationErrorMessage(errors, 'username')}

          {/* Prime's Password strength meter (weak/medium/strong) had no Mantine
              twin, and it scored against its own regex rather than the server's
              rule. The live PasswordRules checklist below states the real rules
              and ticks them as they are met, and the validate pre-checks against
              the same fetched policy, so the form no longer has to submit to find
              out. register_user still decides. */}
          <Controller name="password" control={control} rules={passwordRules} render={({ field, fieldState }) => (
            <PasswordInput id={field.name} {...field}
              label="Password"
              error={fieldState.invalid}
              className="w-full mb-1 mt-2"
              autoComplete="off"
              aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'password')}

          <Controller name="confirmPassword" control={control} rules={confirmPasswordRules} render={({ field, fieldState }) => (
            <PasswordInput id={field.name} {...field}
              label={i18nUtils.translateValue("confirmPassword", "Confirmar password")}
              error={fieldState.invalid}
              className="w-full mb-1 mt-2"
              autoComplete="off"
              aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'confirmPassword')}

          <PasswordRules policy={passwordPolicy} password={watchFields[0]} />

          <div className="w-full mt-3 mb-1">
            <Controller name="accept" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
              <Checkbox
                id={field.name}
                checked={!!field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
                error={fieldState.invalid || undefined}
                label={<span>{i18nUtils.translateValue("acceptThe", "Aceito os")} <a href={termsOfServiceUrl} target="_blank" rel="noopener noreferrer">{i18nUtils.translateValue("termsAndConditions", "termos e condições de utilização")}</a></span>}
              />
            )} />
          </div>
          {getFormValidationErrorMessage(errors, 'accept')}
        </div>

        { onShowLogin && <Group justify="flex-end" mt="md" mb="md">
          <Anchor component="button" type="button" className="font-medium" onClick={onShowLogin}>
            {i18nUtils.translateValue("back", "Back")}
          </Anchor>
        </Group> }

        { auth.http_error && !auth.response &&
          <div className="w-full my-4">
            <Alert color="danger" py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                <IconXCircle />
                <span>{i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}</span>
              </Group>
            </Alert>
          </div> }

        { auth.response && !!auth.response && !!auth.response.message &&
          <div className="w-full my-4">
            <Alert color={ auth.response.success ? "success" : "danger"} py="xs">
              <Group justify="center" gap="xs" wrap="nowrap">
                {auth.response.success ? <IconCheckCircle /> : <IconXCircle />}
                <span>{auth.response.message}</span>
              </Group>
            </Alert>
          </div> }

        <div className="mt-4 mb-4">
          <Button
            type="submit"
            fullWidth
            leftSection={<IconUser />}
            loading={auth.loading}
          >{i18nUtils.translateValue("createUser","Criar utilizador")}</Button>
        </div>
      </form>
    );
  }

  // layout === 'dialog'
  if (auth?.response?.register_user === true && !auth?.response?.error) {
    return (
      <div className="pt-6 px-3">
        <div className="text-center mb-5">
          <IconCheckCircle style={{ fontSize: '5rem', color: 'var(--mantine-color-success-6)' }} />
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
          <Controller name="name" control={control} rules={requiredRule} render={({ field, fieldState }) => (
              <TextInput id={field.name} {...field} value={field.value ?? ''} autoFocus error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataName", "Nome")}*`} />
          )} />
          {getFormValidationErrorMessage(errors, 'name')}
        </div>
        <div className="field">
          <Controller name="email" control={control} rules={emailRules} render={({ field, fieldState }) => (
                  <TextInput id={field.name} {...field} value={field.value ?? ''} error={fieldState.invalid}
                    label={`${i18nUtils.translateValue("userRegistrationDataEmail", "Email")}*`}
                    rightSection={<IconEnvelope />} />
          )} />
          {getFormValidationErrorMessage(errors, 'email')}
        </div>
        <div className="field pt-2">
          <Controller name="username" control={control} rules={requiredRule} render={({ field, fieldState }) => (
              <TextInput id={field.name} {...field} value={field.value ?? ''} error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataUsername", "Nome de utilizador")}*`}
                autoComplete="off" />
          )} />
          {getFormValidationErrorMessage(errors, 'username')}
        </div>
        {/* Prime's Password strength meter (weak/medium/strong) had no Mantine
            twin. The live PasswordRules checklist below states the server's real
            rules and ticks them as they are met; the validate pre-checks against
            the same fetched policy. */}
        <div className="field pt-2">
          <Controller name="password" control={control} rules={passwordRules} render={({ field, fieldState }) => (
              <PasswordInput id={field.name} {...field} error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataPassword", "Password")}*`}
                autoComplete="off"
                aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'password')}
        </div>
        <div className="field pt-2">
          <Controller name="confirmPassword" control={control} rules={confirmPasswordRules} render={({ field, fieldState }) => (
              <PasswordInput id={field.name} {...field} error={fieldState.invalid}
                label={`${i18nUtils.translateValue("userRegistrationDataConfirmPassword", "Confirmar password")}*`}
                autoComplete="off"
                aria-autocomplete="none" />
          )} />
          {getFormValidationErrorMessage(errors, 'confirmPassword')}
        </div>

        <PasswordRules policy={passwordPolicy} password={watchFields[0]} />

        <div className="field-checkbox">
            <Controller name="accept" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                <Checkbox
                  id={field.name}
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                  error={fieldState.invalid || undefined}
                  label={<span>{i18nUtils.translateValue("acceptThe", "Aceito os")} <a href={termsOfServiceUrl} target="_blank" rel="noopener noreferrer">{i18nUtils.translateValue("termsAndConditions", "termos e condições de utilização")}</a>*</span>}
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
          leftSection={<IconCheck />}
          loading={auth.loading}
        >{i18nUtils.translateValue("createUser","Criar utilizador")}</Button>
      </Group>

      { auth.http_error && !auth.response &&
        <div className="mt-3">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <IconXCircle />
              <span>{i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}</span>
            </Group>
          </Alert>
        </div>
      }

      { auth.response && !!auth.response && !!auth.response.message &&
        <div className="mt-3">
          <Alert color="danger" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <IconXCircle />
              <span>{auth.response.message}</span>
            </Group>
          </Alert>
        </div>
      }

    </form>
  )
}

export default RegistrationWidget;
