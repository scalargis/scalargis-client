import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';

import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { i18n as i18nUtils } from '@scalargis/components';

import { getFormValidationErrorMessage } from './../utils';


function LoginWidget(props) {

    const { auth, core, dispatch, onLogin, onShowRegistration, onShowResetPassword } = props;
    const { actions, utils, siteConfig } = core;

    // Redux actions
    const { login_clear_error } = actions;

    const defaultLoginValues = {
      username: '',
      password: ''
    }
  
    const logo = utils.buildRelativeUrlPath(siteConfig?.logo || 'assets/images/logo.png');

    const { control, formState: { errors }, trigger, getValues, handleSubmit } = useForm({ defaultLoginValues });

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
       onLogin(data);
    }

    const showUserRegistration = siteConfig?.authentication?.user_registration === true;
    const showResetPassword = siteConfig?.authentication?.reset_password === true || (siteConfig?.authentication?.reset_password_login_error && auth.response && !!auth.response && !!auth.response.message);

    return (
        <div className="flex align-items-center justify-content-center lg:w-4 md:w-6 w-12">
            <div className="surface-card p-4 pt-6 shadow-2 border-round w-full">
                <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
                    <div className="text-center mb-5">
                        <img src={logo} alt="hyper" height={50} className="mb-3" />
                        <div className="text-900 text-3xl font-medium mb-3">{i18nUtils.translateValue("welcome", "Bem-vindo")}</div>
                        { showUserRegistration &&
                        <React.Fragment>
                            <span className="text-600 font-medium line-height-3">{i18nUtils.translateValue("noAccount", "Não tem uma conta?")}</span>
                            <a className="font-medium no-underline ml-2 text-blue-500 cursor-pointer" onClick={(e) => onShowRegistration()}>{i18nUtils.translateValue("registerHere", "Registe-se aqui!")}</a>
                        </React.Fragment>
                        }
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-900 font-medium my-2">Username/Email</label>
                        <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
                            <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                                autoComplete="off"
                                aria-autocomplete="none"
                                onKeyPress={checkKeyDown} />
                        )} />
                        {getFormValidationErrorMessage(errors, 'username')}

                        <label htmlFor="password" className="block text-900 font-medium my-2">Password</label>
                        <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("required", "Preenchimento obrigatório") }} render={({ field, fieldState }) => (
                            <Password id={field.name} {...field} 
                                toggleMask 
                                feedback={false} 
                                className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                                inputClassName="w-full"
                                pt={{ iconField: { root: { className: 'w-full' } } }}
                                autoComplete="off"
                                aria-autocomplete="none"
                                onKeyPress={checkKeyDown} />                  
                        )} />
                        {getFormValidationErrorMessage(errors, 'password')}
                        
                        { showResetPassword &&
                        <div className="flex align-items-center justify-content-between mt-4 mb-4">
                            <div className="flex align-items-center"></div>
                            <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
                                onClick={ (e) => { e.preventDefault(); onShowResetPassword() }}>
                                    {i18nUtils.translateValue("forgotPassword", "Esqueceu-se da password?")}
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
                                label={i18nUtils.translateValue("login", "Entrar")}
                                icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-user" }
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

export default LoginWidget;