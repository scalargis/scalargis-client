import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Alert, Anchor, Button, Group, TextInput } from '@mantine/core';

import { i18n as i18nUtils } from '../../components';

import { getFormValidationErrorMessage } from './utils';

const defaultLoginValues = {
    username: ''
}

function ResetPasswordWidget(props) {

    const { auth, viewer, history, redirect, core, dispatch, actions, record, onShowLogin } = props;

    // Redux actions
    const { login_clear_error, login_reset_password } = actions;

    const { control, formState: { errors }, handleSubmit } = useForm({ defaultLoginValues });

    useEffect(() => {
        dispatch(login_clear_error());
      }, []);

    const onSubmit = (data) => {
        if (record?.config_json?.actions?.reset_password) {
            core.pubsub.publish(record?.config_json?.actions?.reset_password, {post: { username: data.username, redirect }, history, redirect});
            return;
        }
        dispatch(login_reset_password({ username: data.username, redirect }, history, redirect));
    }

    if (auth?.response?.reset_password === true && !auth?.response?.error) {
        return (
            <React.Fragment>
                <div className="flex align-items-center flex-column pt-2 px-3">
                    <h3>{i18nUtils.translateValue("passwordReset", "Recuperação de palavra-passe")}</h3>
                    <p>{i18nUtils.translateValue("passwordResetRequestSuccessMsg", "Foi enviado um email com as instruções para recuperação da palavra-passe.")}</p>
                    <p>{i18nUtils.translateValue("passwordResetRequestInfoMsg", "Caso não receba o email com as instruções para recuperação da palavra-passe durante os próximos minutos, verifique se este não foi direcionado para a área de SPAM do seu correio eletrónico.")}</p>
                </div>

                <Group justify="flex-end" mt="md">
                    <Anchor component="button" type="button" onClick={onShowLogin}>
                        {i18nUtils.translateValue("login", "Login")}
                    </Anchor>
                </Group>
            </React.Fragment>
        )
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
            </div>

            { onShowLogin && <div className="p-fluid">
                <div className="field grid">
                    <div className="col-12">
                        <Anchor component="button" type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onShowLogin();
                            }}>
                            {i18nUtils.translateValue("login", "Login")}
                        </Anchor>
                    </div>
                </div>
            </div> }

            <Group justify="flex-end" mt="md">
                <Button
                    type="submit"
                    leftSection={<i className="pi pi-check" />}
                    loading={auth.loading}
                >{i18nUtils.translateValue("send", "Enviar")}</Button>
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

export default ResetPasswordWidget;