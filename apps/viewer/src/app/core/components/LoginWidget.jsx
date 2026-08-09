import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Alert, Anchor, Button, Group, PasswordInput, TextInput } from '@mantine/core';

import { i18n as i18nUtils } from '@scalargis/components';

import { getFormValidationErrorMessage } from './../utils';


function LoginWidget(props) {

    const { auth, core, dispatch, onLogin, onShowRegistration, onShowResetPassword } = props;
    const { actions, siteConfig } = core;

    // Redux actions
    const { login_clear_error } = actions;

    const defaultLoginValues = {
      username: '',
      password: ''
    }

    const { control, formState: { errors }, handleSubmit } = useForm({ defaultLoginValues });

    useEffect(() => {
        dispatch(login_clear_error());
    }, []);

    // Enter submits natively: the footer button is type="submit" and
    // handleSubmit validates before onSubmit — the old manual keydown
    // interception reproduced exactly this and left with the conversion.
    const onSubmit = (data) => {
       onLogin(data);
    }

    const showUserRegistration = siteConfig?.authentication?.user_registration === true;
    const showResetPassword = siteConfig?.authentication?.reset_password === true || (siteConfig?.authentication?.reset_password_login_error && auth.response && !!auth.response && !!auth.response.message);

    return (
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="text-center mb-3">
                { showUserRegistration &&
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
                        <Alert color="danger" py="xs">
                            <Group justify="center" gap="xs" wrap="nowrap">
                                <i className="pi pi-times-circle" />
                                <span>{auth?.response?.message}</span>
                            </Group>
                        </Alert>
                    </div>
                }

                <div className="mt-4 mb-4">
                    <Button
                        type="submit"
                        fullWidth
                        leftSection={<i className="pi pi-user" />}
                        loading={auth.loading}
                    >{i18nUtils.translateValue("login", "Entrar")}</Button>
                </div>
            </div>
        </form>
    )
}

export default LoginWidget;