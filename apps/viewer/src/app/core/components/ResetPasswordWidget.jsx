import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';

import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { i18n as i18nUtils } from '@scalargis/components';

import { getFormValidationErrorMessage } from './../utils';


function ResetPasswordWidget(props) {
    const { auth, core, dispatch, onShowLogin, onResetPassword } = props;
    const { actions, utils, siteConfig } = core;

    // Redux actions
    const { login_clear_error } = actions;

    const defaultLoginValues = {
        username: ''
    }

    const logo = utils.buildRelativeUrlPath(siteConfig?.logo || 'assets/images/logo.png');

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
        onResetPassword(data);
    }

    if (auth?.response?.reset_password === true && !auth?.response?.error) {
        return (
            <div className="flex align-items-center justify-content-center lg:w-4 md:w-6 w-12">
                <div className="surface-card p-4 pt-6 shadow-2 border-round w-full">
                    <div className="text-center mb-5">
                        <img src={logo} alt="hyper" height={50} className="mb-3" />
                        <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("welcome", "Bem-vindo")}</div>
                    </div>

                    <div className="pt-2 px-3">
                        <h3>{i18nUtils.translateValue("passwordReset", "Recuperação de palavra-passe")}</h3>
                        <p>{i18nUtils.translateValue("passwordResetRequestSuccessMsg", "Foi enviado um email com as instruções para recuperação da palavra-passe.")}</p>
                        <p>{i18nUtils.translateValue("passwordResetRequestInfoMsg", "Caso não receba o email com as instruções para recuperação da palavra-passe durante os próximos minutos, verifique se este não foi direcionado para a área de SPAM do seu correio eletrónico.")}</p>
                    </div>

                    { onShowLogin &&<div className="flex justify-content-end mt-4 mb-4 p-dialog-myfooter">
                        <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer" onClick={onShowLogin}>
                            {i18nUtils.translateValue("login", "Login")}
                        </a>                         
                    </div> }
                </div>
            </div>
        )
    }

    return (

        <div className="flex align-items-center justify-content-center lg:w-4 md:w-6 w-12">
            <div className="surface-card p-4 pt-6 shadow-2 border-round w-full">
                <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                    <div className="text-center mb-5">
                        <img src={logo} alt="hyper" height={50} className="mb-3" />
                        <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("welcome", "Bem-vindo")}</div>
                        <span className="text-600 text-2xl font-medium line-height-3">{i18nUtils.translateValue("passwordReset", "Recuperar password")}</span>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-900 font-medium my-2">{`${i18nUtils.translateValue("user", "Utilizador")} / E-mail`}</label>
                        <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
                            <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                                autoComplete="off"
                                aria-autocomplete="none"
                                onKeyPress={checkKeyDown} />
                        )} />
                        {getFormValidationErrorMessage(errors, 'username')}

                        { onShowLogin &&
                            <div className="flex justify-content-end mt-4 mb-4">
                                <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer" onClick={onShowLogin}>
                                    {i18nUtils.translateValue("login", "Login")}
                                </a>                         
                            </div>
                        }
                        
                        { auth.http_error && !auth.response &&
                            <div className="p-fluid w-full my-4">
                                <Message severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço indisponível")}></Message>
                            </div>
                        }

                        { auth.response && !!auth.response && !!auth.response.message &&
                            <div className="p-fluid w-full my-4">
                                <Message severity="error" text={auth?.response?.message}></Message>
                            </div>
                        }

                        <div className="flex align-items-center justify-content-between mt-4 mb-4 p-dialog-myfooter">
                            <Button 
                                label={i18nUtils.translateValue("send", "Enviar")}
                                icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-check" }
                                className="w-full" 
                                disabled={auth.loading}
                            />                            
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )

}

export default connect(state => ({ auth: state.root.auth }))(ResetPasswordWidget);