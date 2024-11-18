import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';

import { Dialog } from 'primereact/dialog';
import { useForm, Controller } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import dataProvider from '../../../service/DataProvider';


export default function PasswordChange(props) {

    const { core } = props;
    const { refresh_auth } = core?.actions;
    const { dispatch } = core?.store;

    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const formRef = useRef(null);

    const toast = useRef(null);

    const API_URL = core.API_URL;

    const passwordStrengthLabels = useMemo(() => {
        return {
          weakLabel: "Fraca",
          mediumLabel: "Média",
          strongLabel: "Forte"
        }
    }, []);

  const getFormErrorMessage = (errors, name) => {
        if (errors && errors[name]) {
            if (errors[name].type === 'required') {
                return <small className="p-error">{errors[name].message || 'Campo obrigatório'}</small>
            } else if (errors[name].type === 'maxLength') {
                return <small className="p-error">{errors[name].message || 'O número de caracteres é superior à dimensão máxima permitida'}</small>
            } else if (errors[name].type === 'pattern') {
                return <small className="p-error">{errors[name].message || 'Formato inválido'}</small>
            } else {
                return <small className="p-error">{errors[name].message}</small>
            }
        }      
    };

    const passwordFooter = useMemo(() =>{
        return (
            <React.Fragment>
                <Divider className="p-mt-2" />
                <p className="p-mt-2">Sugestões:</p>
                <ul className="p-pl-2 p-ml-2 p-mt-0" style={{ lineHeight: '1.5' }}>
                    <li>Pelo menos uma minúscula</li>
                    <li>Pelo menos uma maiúscula</li>
                    <li>Pelo menos um dígito</li>
                    <li>Pelo menos 8 caracteres"</li>
                </ul>
            </React.Fragment>
        );
    }, []);

    const dialogFooter = () => {
        return (
            <div>
                <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowPasswordDialog(false)} 
                    className="p-button-text" disabled={isSaving} />
                <Button label="Aceitar"
                    onClick={(e) => {
                        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); 
                    }}
                    icon={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
                    disabled={isSaving}
                    autoFocus />
            </div>
        );
    }

    const defaultValues = {
        newPassword: "",
        confirmPassword: ""
      }

    const { control, watch, formState: { errors }, handleSubmit, reset } = useForm({ defaultValues });
    const watchFields = watch(["newPassword"]);

    const onSubmit = (data) => {
        const provider = dataProvider(API_URL + '/security');

        setIsSaving(true);    
    
        const params = {
            data: {password: data.newPassword}
        }
        provider.update('update_password', params).then(d => {
            toast.current.show({life: 3000, severity: 'success', summary: 'Alterar Password', detail: 'Password alterada com sucesso'});
            
            if (d?.data?.data?.token) {
                const auth = core.store.getState().auth?.data;
                const new_auth = {
                    ...auth,
                    token: d.data.data.token
                }
                dispatch(refresh_auth(new_auth));
            }

            setShowPasswordDialog(false);
        }).catch(e => {
            toast.current.show({life: 3000, severity: 'error', summary: 'Alterar Password', detail: 'Ocorreu um erro ao alterar a password'});        
        }).finally(() => {
            setIsSaving(false);
        });
        
        return false;
    }

    return (
        <React.Fragment>
            <Toast ref={toast} baseZIndex={2000} />

            <Button label="Alterar password" icon="pi pi-user-edit" className="p-button-outlined p-d-block" onClick={e => {
                e.preventDefault();
                reset();
                setShowPasswordDialog(true);
            }} />
            <Dialog header="Alterar password" visible={showPasswordDialog} style={{ width: '35vw' }} footer={dialogFooter()}  onHide={() => setShowPasswordDialog(false)}>
                <div className="p-fluid p-mt-2">

                    <form ref={formRef} onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit(onSubmit)();
                    }}
                    autoComplete="off">
                        <div className="p-field">
                            <label htmlFor="newPassword">Nova password</label>
                            <Controller name="newPassword" control={control} 
                                rules={{ required: "Campo obrigatório" }} 
                                render={({ field, fieldState }) => (
                                    <Password id={field.name} {...field}
                                        toggleMask
                                        promptLabel="Introduza a password"
                                        {...passwordStrengthLabels}
                                        className={classNames({ 'p-invalid': fieldState.invalid })} 
                                        footer={passwordFooter} 
                                        autoComplete="off"
                                        aria-autocomplete="none" />
                                )} 
                            />
                            {getFormErrorMessage(errors, 'newPassword')}
                        </div>

                        <div className="p-field">
                            <label htmlFor="confirmPassword">Confirmar password</label>
                            <Controller name="confirmPassword" control={control} 
                                rules={{ 
                                    required: "Campo obrigatório",
                                    validate: (value) => {
                                        if (value && watchFields[0] && value != watchFields[0]) {
                                            return "As passwords instroduzidas não são iguais";
                                        }
                                        return true;
                                    }
                                }} 
                                render={({ field, fieldState }) => (
                                <Password id={field.name} {...field}
                                    feedback={false}
                                    toggleMask
                                    promptLabel="Confirmar a password"
                                    className={classNames({ 'p-invalid': fieldState.invalid })} 
                                    autoComplete="off"
                                    aria-autocomplete="none" />
                                )} 
                            />
                            {getFormErrorMessage(errors, 'confirmPassword')}
                        </div>

                    </form>
                </div>
            </Dialog>
        </React.Fragment>
    )
}