import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Alert, Anchor, Button, Checkbox, Group, PasswordInput, TextInput } from '@mantine/core';

import { i18n as i18nUtils } from '@scalargis/components';

import { getFormValidationErrorMessage } from './../utils';


function RegistrationWidget(props) {

    const { auth, core, dispatch, onRegistration, onShowLogin} = props;
    const { actions, siteConfig } = core;

    // Redux actions
    const { login_clear_error } = actions;

    const defaultRegistrationValues = {
        name: null,
        email: null,
        username: null,
        password: '',
        confirmPassword: '',
        accept: false
    }

    const TERMS_OF_SERVICE_URL = siteConfig?.terms_of_service_url || '';

    const { control, watch, formState: { errors }, handleSubmit } = useForm({ defaultRegistrationValues });
    const watchFields = watch(["password"]);


    useEffect(() => {
        dispatch(login_clear_error());
    }, []);

    const onSubmit = (data) => {
        const {accept, confirmPassword, ...payload} = data;
        onRegistration(payload);
    }

    if (auth?.response?.register_user === true && !auth?.response?.error) {
        return (
            <div>
                    <div className="text-center mb-4">
                        <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--mantine-color-success-6)' }}></i>
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
                <Controller name="name" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                    <TextInput id={field.name} {...field} value={field.value ?? ''} autoFocus label={i18nUtils.translateValue("userRegistrationDataName", "Nome")} error={fieldState.invalid} className="w-full mb-1" />
                )} />
                {getFormValidationErrorMessage(errors, 'name')}

                <Controller name="email" control={control}
                    rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório"), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, message: i18nUtils.translateValue("invalidEmailFormat", "Email inválido. E.g. exemplo@email.pt") }}}
                    render={({ field, fieldState }) => (
                        <TextInput id={field.name} {...field} value={field.value ?? ''} label="Email" error={fieldState.invalid} className="w-full mb-1 mt-2"
                            rightSection={<i className="pi pi-envelope" aria-hidden="true" />}
                            autoComplete="off"
                            aria-autocomplete="none" />
                )} />
                {getFormValidationErrorMessage(errors, 'email')}

                <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                    <TextInput id={field.name} {...field} value={field.value ?? ''} label="Username" error={fieldState.invalid} className="w-full mb-1 mt-2" />
                )} />
                {getFormValidationErrorMessage(errors, 'username')}

                {/* Prime's Password strength meter (weak/medium/strong) has no
                    Mantine twin — the visibility toggle stays, the meter does
                    not. Validation is unchanged (required only). */}
                <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                    <PasswordInput id={field.name} {...field}
                        label="Password"
                        error={fieldState.invalid}
                        className="w-full mb-1 mt-2"
                        autoComplete="off"
                        aria-autocomplete="none" />
                )} />
                {getFormValidationErrorMessage(errors, 'password')}

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
                    <PasswordInput id={field.name} {...field}
                        label={i18nUtils.translateValue("confirmPassword", "Confirmar password")}
                        error={fieldState.invalid}
                        className="w-full mb-1 mt-2"
                        autoComplete="off"
                        aria-autocomplete="none" />
                    )}
                />
                {getFormValidationErrorMessage(errors, 'confirmPassword')}

                <div className="w-full mt-3 mb-1">
                    <Controller name="accept" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                        <Checkbox
                            id={field.name}
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)}
                            error={fieldState.invalid || undefined}
                            label={<span>{i18nUtils.translateValue("acceptThe", "Aceito os")} <a href={TERMS_OF_SERVICE_URL} target="_blank" rel="noopener noreferrer">{i18nUtils.translateValue("termsAndConditions", "termos e condições de utilização")}</a></span>}
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
                            <i className="pi pi-times-circle" />
                            <span>{i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}</span>
                        </Group>
                    </Alert>
                </div> }

            { auth.response && !!auth.response && !!auth.response.message &&
                <div className="w-full my-4">
                    <Alert color={ auth.response.success ? "success" : "danger"} py="xs">
                        <Group justify="center" gap="xs" wrap="nowrap">
                            <i className={ auth.response.success ? "pi pi-check-circle" : "pi pi-times-circle" } />
                            <span>{auth.response.message}</span>
                        </Group>
                    </Alert>
                </div> }

            <div className="mt-4 mb-4">
                <Button
                    type="submit"
                    fullWidth
                    leftSection={<i className="pi pi-user" />}
                    loading={auth.loading}
                >{i18nUtils.translateValue("createUser","Criar utilizador")}</Button>
            </div>
        </form>
    )

}

export default RegistrationWidget;