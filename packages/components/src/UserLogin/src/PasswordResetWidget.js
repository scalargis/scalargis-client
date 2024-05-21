import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { i18n as i18nUtils } from '@scalargis/components';

import { getFormValidationErrorMessage } from './utils';

const defaultLoginValues = {
    username: ''
}

function PasswordResetWidget(props) {

    const { auth, viewer, history, redirect, core, dispatch, actions, record, showLogin } = props;

    // Redux actions
    const { login_clear_error, login_reset_password } = actions;

    const { control, formState: { errors }, trigger, getValues, setValue, handleSubmit } = useForm({ defaultLoginValues });

    useEffect(() => {
        dispatch(login_clear_error());
      }, []);

    const checkKeyDown =  async (e) => {
        if (e.code === 'Enter') {
          e.preventDefault();
          const result = await trigger(["username", "password"]);
          if (result) {
            onSubmit(getValues());
          }
        }
    };

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
                <div className="p-fluid">

                    <div className="p-d-flex p-ai-center p-dir-col p-pt-2 p-px-3">
                        <h3>{i18nUtils.translateValue("passwordReset", "Recuperação de palavra-passe")}</h3>
                        <p>{i18nUtils.translateValue("passwordResetRequestSuccessMsg", "Foi enviado um email com as instruções para recuperação da palavra-passe.")}</p>
                        <p>{i18nUtils.translateValue("passwordResetRequestInfoMsg", "Caso não receba o email com as instruções para recuperação da palavra-passe durante os próximos minutos, verifique se este não foi direcionado para a área de SPAM do seu correio eletrónico.")}</p>
                    </div>
                </div>

                <div className="p-dialog-myfooter">
                    <Button
                        color='green'
                        label={i18nUtils.translateValue("login", "Login")}
                        onClick={showLogin}
                    />
                </div>
            </React.Fragment>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="p-fluid">
                <div className="p-field p-grid">
                    <label htmlFor="username" className="p-col-12 p-md-4">{`${i18nUtils.translateValue("user", "Utilizador")} / E-mail`}</label>
                    <div className="p-col-12 p-md-8">
                    <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
                        <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid })}
                            autoComplete="off"
                            aria-autocomplete="none"
                            onKeyPress={checkKeyDown} />
                        )} />
                    {getFormValidationErrorMessage(errors, 'username')}
                    </div>
                </div>
            </div>

            { showLogin && <div className="p-fluid">
                <div className="p-field p-grid">
                    <div className="p-col-12">
                        <Button
                            className="p-button-link"
                            label = {i18nUtils.translateValue("login", "Login")}
                            onClick={(e) => {
                                e.preventDefault();
                                showLogin();
                            }}
                        />
                    </div>
                </div>          
            </div> }

            <div className="p-dialog-myfooter">
                <Button
                    type="submit"
                    icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
                    label={i18nUtils.translateValue("send", "Enviar")}
                    disabled={auth.loading}
                />
            </div>
            
            { auth.http_error && !auth.response &&
                <Message style={{ width: '100%' }} severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço indisponível")}></Message>
            }

            { auth.response && !!auth.response && !!auth.response.message && 
                <Message style={{ width: '100%' }} severity="error" text={auth?.response?.message}></Message>
            }

        </form>
    )

}

export default connect(state => ({ auth: state.root.auth }))(PasswordResetWidget)