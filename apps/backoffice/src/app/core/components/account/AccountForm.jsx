import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { ActionIcon, Button, Group, Input, TextInput } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { notify } from '@scalargis/ui';
import { v4 as uuidV4 } from 'uuid';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import PasswordChange from './PasswordChange';

// The @mantine/dates pickers exchange 'YYYY-MM-DD HH:mm:ss' strings; the form
// model keeps the Date the API hands over, so the saved payload is unchanged.
const PICKER_FORMAT = 'YYYY-MM-DD HH:mm:ss';

function AccountForm(props) {

  const {
    dispatch
  } = props;

  const { core } = useContext(AppContext);

  const { auth_update, logout } = core?.actions ?? {};

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  const onSubmit = (formData) => {

    const new_data = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      auth_token: formData.auth_token || null,
      auth_token_expire: formData.auth_token_expire || null
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/security');
    const params = {
      data: new_data
    }
    provider.update('account', params).then(d => {
      notify.success('Editar Registo', 'Registo alterado com sucesso');

      setData(new_data);

      if (d?.data) dispatch(auth_update(d?.data));

    }).catch(e => {
      const msg = e.message || 'Ocorreu um erro ao alterar o registo';
      notify.error('Editar Registo', msg);
    }).finally(() => {
      setIsSaving(false);
    });
  };

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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      <div className="formgrid grid">
        <div className="field col-12 md:col-3">
          <TextInput id="first_name" label="Primeiro Nome" autoFocus disabled={!isEditMode}
            {...register('first_name')} />
        </div>
        <div className="field col-12 md:col-3">
          <TextInput id="last_name" label="Último Nome" disabled={!isEditMode}
            {...register('last_name')} />
        </div>
        <div className="field col-12 md:col-6">
          <TextInput id="name" label="Nome" disabled={!isEditMode}
            error={fieldError(errors, 'name')}
            {...register('name', { required: 'Campo obrigatório.' })} />
        </div>

        <div className="field col-12 md:col-3">
          <TextInput id="username" label="Username" disabled={!isEditMode}
            error={fieldError(errors, 'username')}
            {...register('username', { required: 'Campo obrigatório.' })} />
        </div>
        <div className="field col-12 md:col-4">
          <TextInput id="email" label="Email" disabled={!isEditMode}
            error={fieldError(errors, 'email')}
            {...register('email', {
              required: 'Campo obrigatório.',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato de email inválido.' }
            })} />
        </div>

        { !isEditMode &&
        <div className="field pl-2">
          <Input.Label>Password</Input.Label>
          <PasswordChange core={core} />
        </div>
        }

        <div className="field col-12 md:col-6">
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <Button type="button" leftSection={<i className="pi pi-check" />} disabled={!isEditMode}
              onClick={() => { setValue('auth_token', String(uuidV4())); }}>Gerar</Button>
            <TextInput id="auth_token" label="Token de Autenticação" placeholder="Token não definido"
              style={{ flex: 1 }} disabled={!isEditMode} {...register('auth_token')} />
            <ActionIcon size="input-md" color="danger" aria-label="Limpar token" disabled={!isEditMode}
              onClick={() => { setValue('auth_token', null); setValue('auth_token_expire', null); }}>
              <i className="pi pi-times" />
            </ActionIcon>
          </Group>
        </div>
        <div className="field col-12 md:col-3">
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <Controller
              control={control}
              name="auth_token_expire"
              render={({ field }) => (
                <DateTimePicker
                  label="Data de Validade do Token"
                  value={field.value ? dayjs(field.value).format(PICKER_FORMAT) : null}
                  onChange={(value) => field.onChange(value ? dayjs(value).toDate() : null)}
                  valueFormat={PICKER_FORMAT}
                  withSeconds
                  disabled={!isEditMode}
                  style={{ flex: 1 }}
                />
              )}
            />
            <ActionIcon size="input-md" color="danger" aria-label="Limpar data de validade" disabled={!isEditMode}
              onClick={() => setValue('auth_token_expire', null)}>
              <i className="pi pi-times" />
            </ActionIcon>
          </Group>
        </div>

      </div>

      <Group justify="space-between" className="mt-4 mb-4">
        <div>
          { !isEditMode &&
          <Button
            type="button"
            color="danger"
            leftSection={<i className="pi pi-power-off" />}
            onClick={e => { e.preventDefault(); dispatch(logout()); }}>Sair</Button>
          }
        </div>
        { isEditMode ?
          <Group gap="xs">
            <Button
              type="button"
              variant="default"
              onClick={e => {
                e.preventDefault();
                setIsEditMode(false);

                Object.entries(data).forEach(([key, val]) => {
                  setValue(key, val, {shouldDirty: false, shouldTouch: false, shouldValidate: false});
                });
              }}
              disabled={isSaving}>Cancelar</Button>
            <Button
              type="submit"
              leftSection={<i className="pi pi-save" />}
              loading={isSaving}>Gravar</Button>
          </Group>
          :
          <Button
            type="button"
            leftSection={<i className="pi pi-pencil" />}
            onClick={e => { e.preventDefault(); setIsEditMode(true)} }>Editar</Button>
        }
      </Group>

    </form>
  );

}

export default connect(state => ({}))(AccountForm);
