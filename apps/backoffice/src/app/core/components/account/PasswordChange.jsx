import React, { useState } from 'react';

import { useForm, Controller } from 'react-hook-form';
import { Button, Group, Modal, PasswordInput } from '@mantine/core';
import { notify } from '@scalargis/ui';

import dataProvider from '../../../service/DataProvider';


const PASSWORD_RULES = 'Pelo menos 12 caracteres, com maiúsculas, minúsculas, dígitos e um caractere especial.';

export default function PasswordChange(props) {

    const { core } = props;
    const { refresh_auth } = core?.actions ?? {};
    const { dispatch } = core?.store ?? {};

    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const API_URL = core.API_URL;

    const fieldError = (errors, name) => {
        if (errors && errors[name]) {
            if (errors[name].message) return errors[name].message;

            if (errors[name].type === 'required') {
                return 'Campo obrigatório';
            } else if (errors[name].type === 'maxLength') {
                return 'O número de caracteres é superior à dimensão máxima permitida';
            } else if (errors[name].type === 'pattern') {
                return 'Formato inválido';
            }
        }
        return undefined;
    };

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
            notify.success('Alterar Password', 'Password alterada com sucesso');

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
            notify.error('Alterar Password', e.body?.message || e.message || 'Ocorreu um erro ao alterar a password');
        }).finally(() => {
            setIsSaving(false);
        });

        return false;
    }

    return (
        <React.Fragment>
            <Button variant="outline" leftSection={<i className="pi pi-user-edit" />} onClick={e => {
                e.preventDefault();
                reset();
                setShowPasswordDialog(true);
            }}>Alterar password</Button>
            <Modal title="Alterar password" opened={showPasswordDialog} size="35vw"
                onClose={() => setShowPasswordDialog(false)}>
                <div className="mt-2">

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit(onSubmit)();
                    }}
                    autoComplete="off">
                        <div className="field">
                            <Controller name="newPassword" control={control}
                                rules={{ required: "Campo obrigatório" }}
                                render={({ field }) => (
                                    <PasswordInput id={field.name}
                                        label="Nova password"
                                        description={PASSWORD_RULES}
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.currentTarget.value)}
                                        error={fieldError(errors, 'newPassword')}
                                        autoComplete="off"
                                        data-autofocus />
                                )}
                            />
                        </div>

                        <div className="field">
                            <Controller name="confirmPassword" control={control}
                                rules={{
                                    required: "Campo obrigatório",
                                    validate: (value) => {
                                        if (value && watchFields[0] && value != watchFields[0]) {
                                            return "As passwords introduzidas não são iguais";
                                        }
                                        return true;
                                    }
                                }}
                                render={({ field }) => (
                                <PasswordInput id={field.name}
                                    label="Confirmar password"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.currentTarget.value)}
                                    error={fieldError(errors, 'confirmPassword')}
                                    autoComplete="off" />
                                )}
                            />
                        </div>

                        <Group justify="flex-end" className="mt-4">
                            <Button type="button" variant="subtle" leftSection={<i className="pi pi-times" />}
                                onClick={() => setShowPasswordDialog(false)}
                                disabled={isSaving}>Cancelar</Button>
                            <Button type="submit"
                                leftSection={<i className="pi pi-save" />}
                                loading={isSaving}>Aceitar</Button>
                        </Group>

                    </form>
                </div>
            </Modal>
        </React.Fragment>
    )
}
