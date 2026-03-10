import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';

import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Password } from 'primereact/password';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { i18n as i18nUtils } from '@scalargis/components';

import { getFormValidationErrorMessage } from './../utils';


function RegistrationWidget(props) {

    const { auth, core, dispatch, onRegistration, onShowLogin} = props;
    const { actions, utils, siteConfig } = core;

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

    const passwordStrengthLabels = useMemo(() => {
        return {
        weakLabel: i18nUtils.translateValue("weakPasswordLabel", "Fraca"),
        mediumLabel: i18nUtils.translateValue("mediumPasswordLabel", "Média"),
        strongLabel: i18nUtils.translateValue("strongPasswordLabel", "Forte")
        }
    }, [i18nUtils.getResolvedLanguage()]);

    const TERMS_OF_SERVICE_URL = siteConfig?.terms_of_service_url || '';

    const { control, watch, formState: { errors }, handleSubmit } = useForm({ defaultRegistrationValues });
    const watchFields = watch(["password"]);


    useEffect(() => {
        dispatch(login_clear_error());
    }, []);

    const onSubmit = (data) => {
        let {accept, confirmPassword, ...payload} = data;
        onRegistration(payload);
    }

    if (auth?.response?.register_user === true && !auth?.response?.error) {
        return (
            <React.Fragment>
                <div>
                    <div className="text-center mb-4">
                        <i className="pi pi-check-circle" style={{ fontSize: '5rem', color: 'var(--green-500)' }}></i>
                        <h3>{i18nUtils.translateValue("userRegistrationSuccess", "Registo realizado com sucesso")}!</h3>
                    </div>
                    <p className="line-height-3 text-justify" dangerouslySetInnerHTML={{__html: i18nUtils.translateValue("userRegistrationSuccessMsg", "A sua conta foi criada com o username <b>{{username}}</b>, deverá proceder à sua ativação durante as próximas 24 horas. Por favor, verifique as instruções de ativação da conta enviadas para o email <b>{{email}}</b>.", undefined, undefined, undefined, {username: auth?.response?.username, email: auth?.response?.email})}} />
                    
                    { onShowLogin && <div className="flex justify-content-end mt-4 mb-4 p-dialog-myfooter">
                        <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
                            onClick={onShowLogin}>
                            {i18nUtils.translateValue("login", "Login")}
                        </a>                         
                    </div> }
                </div>  
            </React.Fragment>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div>
                <label htmlFor="name" className="block text-900 font-medium my-2">{i18nUtils.translateValue("userRegistrationDataName", "Nome")}</label>
                <Controller name="name" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                    <InputText id={field.name} {...field} autoFocus className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })} />
                )} />
                {getFormValidationErrorMessage(errors, 'name')}


                <label htmlFor="email" className="block text-900 font-medium my-2">Email</label>
                <IconField iconPosition="right">
                <InputIcon className="pi pi-envelope" />
                    <Controller name="email" control={control}
                        rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório"), pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, message: i18nUtils.translateValue("invalidEmailFormat", "Email inválido. E.g. exemplo@email.pt") }}}
                        render={({ field, fieldState }) => (
                            <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                                autoComplete="off"
                                aria-autocomplete="none" />
                    )} />
                </IconField>
                {getFormValidationErrorMessage(errors, 'email')}

                <label htmlFor="username" className="block text-900 font-medium my-2">Username</label>
                <Controller name="username" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                    <InputText id={field.name} {...field} className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })} />
                )} />
                {getFormValidationErrorMessage(errors, 'username')}

                <label htmlFor="password" className="block text-900 font-medium my-2">Password</label>
                <Controller name="password" control={control} rules={{ required: i18nUtils.translateValue("requiredField", "Campo obrigatório") }} render={({ field, fieldState }) => (
                    <Password id={field.name} {...field} 
                        toggleMask
                        promptLabel={i18nUtils.translateValue("enterPassword", "Introduza a password")}
                        {...passwordStrengthLabels}
                        className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                        inputClassName="w-full"
                        pt={{ iconField: { root: { className: 'w-full' } } }}
                        autoComplete="off"
                        aria-autocomplete="none" />                  
                )} />
                {getFormValidationErrorMessage(errors, 'password')}


                <label htmlFor="confirmPassword" className="block text-900 font-medium my-2">{i18nUtils.translateValue("confirmPassword", "Confirmar password")}</label>
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
                    <Password id={field.name} {...field}
                        feedback={false}
                        toggleMask
                        promptLabel="Confirmar a password"
                        className={classNames({ 'p-invalid': fieldState.invalid, 'w-full mb-1': true })}
                        inputClassName="w-full"
                        pt={{ iconField: { root: { className: 'w-full' } } }}
                        autoComplete="off"
                        aria-autocomplete="none" />
                    )} 
                />
                {getFormValidationErrorMessage(errors, 'confirmPassword')}

                <div className="w-full mt-3 mb-1">
                    <Controller name="accept" control={control} rules={{ required: true }} render={({ field, fieldState }) => (
                        <Checkbox inputId={field.name} onChange={(e) => field.onChange(e.checked)} checked={field.value} className={classNames({ 'p-invalid': fieldState.invalid, 'ml-0 mb-0': true })} />
                    )} />
                    <label htmlFor="accept" className="text-900 font-medium my-2 ml-1">{i18nUtils.translateValue("acceptThe", "Aceito os")} <a href={TERMS_OF_SERVICE_URL} target="_blank" rel="noopener noreferrer">{i18nUtils.translateValue("termsAndConditions", "termos e condições de utilização")}</a></label>
                </div>
                {getFormValidationErrorMessage(errors, 'accept')}
            </div>

            { onShowLogin && <div className="flex justify-content-end mt-4 mb-4">
                <a className="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer" onClick={onShowLogin}>
                    {i18nUtils.translateValue("back", "Back")}
                </a>                         
            </div> }

            { auth.http_error && !auth.response &&
                <div className="p-fluid w-full my-4">
                    <Message severity="error" text={i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}></Message>
                </div> }

            { auth.response && !!auth.response && !!auth.response.message &&
                <div className="p-fluid w-full my-4">
                    <Message severity={ auth.response.success ? "success" : "error"} text={auth.response.message}></Message>
                </div> }

            <div className="flex align-items-center justify-content-between mt-4 mb-4 p-dialog-myfooter">
                <Button 
                    label={i18nUtils.translateValue("createUser","Criar utilizador")}
                    icon={ auth.loading ? "pi pi-spin pi-spinner": "pi pi-user" }
                    className="w-full" 
                    disabled={auth.loading}
                />                            
            </div>
        </form>
    )

}

export default RegistrationWidget;