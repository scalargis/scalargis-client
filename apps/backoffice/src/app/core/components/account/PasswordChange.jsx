import React, { useState } from 'react';

import { useForm, Controller } from 'react-hook-form';
import { Box, Button, Group, PasswordInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notify, Dialog, IconUserEdit, IconX, IconSave } from '@scalargis/ui';
import { PasswordRules, usePasswordPolicy, validatePasswordAgainstPolicy } from '@scalargis/components';

import dataProvider from '../../../service/DataProvider';


export default function PasswordChange(props) {

    const { core } = props;
    const { refresh_auth } = core?.actions ?? {};
    const { dispatch } = core?.store ?? {};

    const [showPasswordDialog, { open, close }] = useDisclosure(false);
    const [isSaving, setIsSaving] = useState(false);

    const API_URL = core.API_URL;

    // The server's password rules, shared with the viewer via
    // @scalargis/components; drives the live checklist and the pre-submit check.
    const passwordPolicy = usePasswordPolicy(API_URL);

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

            close();
        }).catch(e => {
            notify.error('Alterar Password', e.body?.message || e.message || 'Ocorreu um erro ao alterar a password');
        }).finally(() => {
            setIsSaving(false);
        });

        return false;
    }

    return (
        <React.Fragment>
            <Button type="button" variant="outline" leftSection={<IconUserEdit />} onClick={e => {
                e.preventDefault();
                reset();
                open();
            }}>Alterar password</Button>
            <Dialog title="Alterar password" opened={showPasswordDialog}
                onClose={close}>
                <Box mt="xs">

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSubmit(onSubmit)();
                    }}
                    autoComplete="off">
                        <Box mb="sm">
                            <Controller name="newPassword" control={control}
                                rules={{
                                    required: "Campo obrigatório",
                                    // Catches a non-compliant password before the API call;
                                    // no policy fetched -> no verdict, the server still decides.
                                    validate: (value) =>
                                        validatePasswordAgainstPolicy(passwordPolicy, value).length
                                            ? 'A password não cumpre os requisitos de segurança.'
                                            : true
                                }}
                                render={({ field }) => (
                                    <PasswordInput id={field.name}
                                        label="Nova password"
                                        value={field.value || ''}
                                        onChange={(e) => field.onChange(e.currentTarget.value)}
                                        error={fieldError(errors, 'newPassword')}
                                        autoComplete="off"
                                        data-autofocus />
                                )}
                            />
                            <PasswordRules policy={passwordPolicy} password={watchFields[0]} />
                        </Box>

                        <Box mb="sm">
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
                        </Box>

                        <Group justify="flex-end" mt="md">
                            <Button type="button" variant="subtle" leftSection={<IconX />}
                                onClick={() => close()}
                                disabled={isSaving}>Cancelar</Button>
                            <Button type="submit"
                                leftSection={<IconSave />}
                                loading={isSaving}>Aceitar</Button>
                        </Group>

                    </form>
                </Box>
            </Dialog>
        </React.Fragment>
    )
}
