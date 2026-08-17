import React, { useContext, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import {
  ActionIcon,
  Alert,
  Button,
  Checkbox,
  Group,
  Input,
  MultiSelect,
  NumberInput,
  Paper,
  PasswordInput,
  Stack,
  Switch,
  TextInput
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { notify, confirm } from '@scalargis/ui';
import { PasswordRules, usePasswordPolicy, validatePasswordAgainstPolicy } from '@scalargis/components';
import { v4 as uuidV4 } from 'uuid'

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 32;
const PASSWORD_DEFAULT_LENGTH = 16;

const PASSWORD_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const PASSWORD_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PASSWORD_DIGITS = '0123456789';
const PASSWORD_SPECIAL = '!@#$%^&*()-_=+[]{}';

// The @mantine/dates pickers exchange 'YYYY-MM-DD HH:mm:ss' strings; the form
// model keeps the Date the API/UserEdit hands over, so the saved payload is
// unchanged (JSON-serialized UTC ISO, as before).
const PICKER_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Picks a random character from a set using crypto for unbiased selection.
const randomChar = (set) => {
  const arr = new Uint32Array(1);
  window.crypto.getRandomValues(arr);
  return set[arr[0] % set.length];
};

// Generates a password that is guaranteed to contain at least one character of
// each required class, padded to `length` from the full pool, then shuffled.
const generatePassword = (length) => {
  const size = Math.max(PASSWORD_MIN_LENGTH, Math.min(PASSWORD_MAX_LENGTH, length || PASSWORD_DEFAULT_LENGTH));
  const pool = PASSWORD_LOWER + PASSWORD_UPPER + PASSWORD_DIGITS + PASSWORD_SPECIAL;

  const chars = [
    randomChar(PASSWORD_LOWER),
    randomChar(PASSWORD_UPPER),
    randomChar(PASSWORD_DIGITS),
    randomChar(PASSWORD_SPECIAL)
  ];
  while (chars.length < size) {
    chars.push(randomChar(pool));
  }

  // Fisher-Yates shuffle so the guaranteed chars aren't always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const r = new Uint32Array(1);
    window.crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

const sortRolesArray = (data) => {
  if (!data) return data;

  return data.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
}

const sortGroupsArray = (data) => {
  if (!data) return data;

  return data.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
}

// Prime ListBox (multiple) replacement: a bordered checkbox list; the checked
// ids are what the Remover button acts on.
const SelectionList = ({ options, value, onChange, ariaLabel }) => (
  <Paper withBorder p="xs" role="group" aria-label={ariaLabel} style={{ maxHeight: '14rem', overflowY: 'auto' }}>
    <Stack gap="xs">
      {options.map((option) => (
        <Checkbox
          key={option.id}
          size="md"
          label={option.name}
          checked={!!value && value.includes(option.id)}
          onChange={(e) =>
            onChange(
              e.currentTarget.checked
                ? [...(value || []), option.id]
                : (value || []).filter((id) => id !== option.id)
            )
          }
        />
      ))}
    </Stack>
  </Paper>
);

function UserForm(props) {

  const {
    dispatch
  } = props;

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const isCreate = !data.id;
  const [passwordLength, setPasswordLength] = useState(PASSWORD_DEFAULT_LENGTH);
  const [revealPassword, setRevealPassword] = useState(false);

  const [roles, setRoles] = useState(props?.data?.roles ? sortRolesArray([...props.data.roles]) : []);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState(null);
  const [removedRoles, setRemovedRoles] = useState(null);

  const [groups, setGroups] = useState(props?.data?.groups ? sortGroupsArray([...props.data.groups]) : []);
  const [availableGroups, setAvailableGroups] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(null);
  const [removedGroups, setRemovedGroups] = useState(null);

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  // The server's password rules, shared with the viewer via @scalargis/components.
  // They drive the live checklist and the pre-submit check below; the password
  // is watched so the checklist ticks as it is typed.
  const passwordPolicy = usePasswordPolicy(API_URL);
  const password = watch('password');

  useEffect(() => {
    const params = {
      pagination: { page: 1, perPage: 1000},
      sort: { field: 'name', order: 'Asc' },
      filter: {}
    }

    Promise.all([
      dataProvider(API_URL + '/security').getList('roles', params).catch((error) => error),
      dataProvider(API_URL + '/security').getList('groups', params).catch((error) => error)
    ]).then((result) => {
      const roles_result = result[0];
      const rids = props?.data?.roles ? props.data.roles.map(v => v.id) : [];
      setAvailableRoles(sortRolesArray(roles_result.data.filter(v => !rids.includes(v.id))
        .map(r => { return { id: r.id, name: r.name} })));

      const groups_result = result[1];
      const gids = props?.data?.groups ? props.data.groups.map(v => v.id) : [];
      setAvailableGroups(sortGroupsArray(groups_result.data.filter(v => !gids.includes(v.id))
        .map(g => { return { id: g.id, name: g.name} })));

    }).catch((error) => {
      console.log(error)
    });
  }, []);

  // MultiSelect exchanges string values; ids are numbers everywhere else.
  const addRoles = () => {
    if (!availableRoles || !selectedRoles) return;

    const ids = selectedRoles.map(Number);
    const new_roles = availableRoles.filter(v => ids.includes(v.id));
    const new_available_roles = availableRoles.filter(v => !ids.includes(v.id));

    setRoles(sortRolesArray([...roles, ...new_roles]));
    setAvailableRoles(sortRolesArray([...new_available_roles]));
    setSelectedRoles(null);
    setRemovedRoles(null);
  }

  const removeRoles = () => {
    if (!removedRoles) return;

    const new_available_roles = roles.filter(v => removedRoles.includes(v.id));
    const new_roles = roles.filter(v => !removedRoles.includes(v.id));

    setRoles(sortRolesArray([...new_roles]));
    setAvailableRoles(sortRolesArray([...availableRoles, ...new_available_roles]));
    setRemovedRoles(null);
    setSelectedRoles(null);
  }

  const addGroups = () => {
    if (!availableGroups || !selectedGroups) return;

    const ids = selectedGroups.map(Number);
    const new_groups = availableGroups.filter(v => ids.includes(v.id));
    const new_available_groups = availableGroups.filter(v => !ids.includes(v.id));

    setGroups(sortGroupsArray([...groups, ...new_groups]));
    setAvailableGroups(sortGroupsArray([...new_available_groups]));
    setSelectedGroups(null);
    setRemovedGroups(null);
  }

  const removeGroups = () => {
    if (!removedGroups) return;

    const new_available_groups = groups.filter(v => removedGroups.includes(v.id));
    const new_groups = groups.filter(v => !removedGroups.includes(v.id));

    setGroups(sortGroupsArray([...new_groups]));
    setAvailableGroups(sortGroupsArray([...availableGroups, ...new_available_groups]));
    setRemovedGroups(null);
    setSelectedGroups(null);
  }

  const goBack = () => {
    const state = {
      searchParams: {...location.state.previousSearchParams}
    }
    navigate(location.state.from, { state });
  }

  const onSubmit = (formData) => {
    const new_data = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password || null,
      active: formData.active || false,
      auth_token: formData.auth_token || null,
      auth_token_expire: formData.auth_token_expire || null,
      roles: roles ? roles.map(r => r.id) : [],
      groups: groups ? groups.map(g => g.id) : []
    }

    const doUpdate = () => {
      setIsSaving(true);
      const provider = dataProvider(API_URL + '/security');
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('users', params).then(d => {
        notify.success('Editar Registo', 'Registo alterado com sucesso');
        setValue('password', '', {
          shouldValidate: true,
          shouldDirty: true
        });
      }).catch(e => {
        notify.error('Editar Registo', e.body?.message || e.message || 'Ocorreu um erro ao alterar o registo');
      }).finally(() => {
        setIsSaving(false);
      });
    };

    const doCreate = () => {
      setIsSaving(true);
      const provider = dataProvider(API_URL + '/security');
      const params = {
        data: {...new_data}
      }
      provider.create('users', params).then(d => {
        setData({...data, id: d.data.id});
        notify.success('Criar Registo', 'Registo criado com sucesso');
      }).catch(e => {
        notify.error('Criar Registo', e.body?.message || e.message || 'Ocorreu um erro ao criar o registo');
      }).finally(() => {
        setIsSaving(false);
      });
    };

    if (data.id) {
      // Changing an existing user's password is a deliberate action -> confirm.
      if (formData.password) {
        confirm({
          message: 'Vai alterar a password deste utilizador. Deseja continuar?',
          header: 'Confirmação',
          severity: 'warning',
          acceptLabel: 'Sim',
          rejectLabel: 'Não',
          accept: doUpdate
        });
      } else {
        doUpdate();
      }
    } else {
      doCreate();
    }
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
          <TextInput id="first_name" label="Primeiro Nome" autoFocus {...register('first_name')} />
        </div>
        <div className="field col-12 md:col-3">
          <TextInput id="last_name" label="Último Nome" {...register('last_name')} />
        </div>
        <div className="field col-12 md:col-6">
          <TextInput id="name" label="Nome"
            error={fieldError(errors, 'name')}
            {...register('name', { required: 'Campo obrigatório.' })} />
        </div>

        <div className="field col-12 md:col-3">
          <TextInput id="username" label="Username"
            error={fieldError(errors, 'username')}
            {...register('username', { required: 'Campo obrigatório.' })} />
        </div>
        <div className="field col-12 md:col-4">
          <TextInput id="email" label="Email"
            error={fieldError(errors, 'email')}
            {...register('email', {
              required: 'Campo obrigatório.',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Formato de email inválido.' }
            })} />
        </div>
        <div className={`field col-12 ${isCreate ? 'md:col-5' : 'md:col-4'}`}>
          <Controller
            control={control}
            name="password"
            rules={{
              required: isCreate ? 'Campo obrigatório.' : false,
              // Only validate when a value is entered — on edit a blank field
              // keeps the current password. No policy fetched -> no verdict
              // here, the server still decides.
              validate: (value) =>
                !value
                  ? true
                  : validatePasswordAgainstPolicy(passwordPolicy, value).length
                    ? 'A password não cumpre os requisitos de segurança.'
                    : true
            }}
            render={({ field }) => (
              <PasswordInput
                id="password"
                label="Password"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.currentTarget.value)}
                visible={revealPassword}
                onVisibilityChange={setRevealPassword}
                error={fieldError(errors, 'password')}
              />
            )}
          />
          { !isCreate &&
            <small className="block mt-1" style={{ opacity: 0.7 }}>Deixe em branco para manter a password atual.</small> }
          <div className="flex align-items-end justify-content-end flex-wrap mt-2" style={{ gap: '0.5rem' }}>
            <NumberInput
              label="Tamanho"
              value={passwordLength}
              onChange={setPasswordLength}
              min={PASSWORD_MIN_LENGTH} max={PASSWORD_MAX_LENGTH}
              style={{ width: '6rem' }}
            />
            <Button type="button" leftSection={<i className="pi pi-key" />}
              onClick={() => {
                const pwd = generatePassword(passwordLength);
                setValue('password', pwd, { shouldValidate: true, shouldDirty: true });
                setRevealPassword(true);
              }}>Gerar</Button>
          </div>
          { (isCreate || !!password) &&
            <PasswordRules policy={passwordPolicy} password={password} /> }
        </div>

        <div className="field col-12">
          <div className="grid">
            <div className="col-3 mt-2 mb-2">
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Switch
                    size="md"
                    label={field.value ? 'Utilizador Ativo' : 'Utilizador Não Ativo'}
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.currentTarget.checked)}
                  />
                )}
              />
            </div>
          </div>
        </div>

        <div className="field col-12 md:col-6">
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <Button type="button" leftSection={<i className="pi pi-check" />}
              onClick={() => { setValue('auth_token', String(uuidV4())); }}>Gerar</Button>
            <TextInput id="auth_token" label="Token de Autenticação" placeholder="Token não definido"
              style={{ flex: 1 }} {...register('auth_token')} />
            <ActionIcon type="button" size="input-md" color="danger" aria-label="Limpar token"
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
                  style={{ flex: 1 }}
                />
              )}
            />
            <ActionIcon type="button" size="input-md" color="danger" aria-label="Limpar data de validade"
              onClick={() => setValue('auth_token_expire', null)}>
              <i className="pi pi-times" />
            </ActionIcon>
          </Group>
        </div>

        <div className="field col-12 md:col-6">
          <Input.Label>Perfis</Input.Label>
          <div className="card p-2">
            { (availableRoles && availableRoles.length > 0) &&
            <>
            <div className="field col-12 pl-0">
              <MultiSelect
                data={availableRoles.map(r => ({ value: String(r.id), label: r.name }))}
                value={selectedRoles || []}
                onChange={(value) => setSelectedRoles(value.length ? value : null)}
                placeholder="Selecionar"
                searchable clearable />
            </div>
            <div className="grid">
              <div className="col"></div>
              <div className="col">
                  <Button type="button"
                    disabled={(!selectedRoles || selectedRoles.length === 0)}
                  onClick={addRoles}>Adicionar</Button>
              </div>
              <div className="col"></div>
            </div>
            </>
            }
            { (roles && roles.length > 0) ?
              <>
              <div className="field col-12 pl-0 pt-2">
                <SelectionList options={roles} value={removedRoles}
                  onChange={setRemovedRoles} ariaLabel="Perfis atribuídos" />
              </div>
              <div className="grid">
                <div className="col"></div>
                <div className="col">
                  <Button type="button"
                  disabled={(!removedRoles || removedRoles.length === 0)}
                  onClick={removeRoles}>Remover</Button>
                </div>
                <div className="col"></div>
              </div>
              </> :
              <div className="grid justify-content-center">
                <div className="col-12 mt-4 mb-2">
                  <Alert color="warning" py="xs">
                    <Group justify="center" gap="xs" wrap="nowrap">
                      <i className="pi pi-exclamation-triangle" />
                      <span>Adicione um ou mais Perfis</span>
                    </Group>
                  </Alert>
                </div>
              </div>
            }
          </div>
        </div>

        <div className="field col-12 md:col-6">
          <Input.Label>Grupos</Input.Label>
          <div className="card p-2">
            { (availableGroups && availableGroups.length > 0) &&
            <>
            <div className="field col-12 pl-0">
              <MultiSelect
                data={availableGroups.map(g => ({ value: String(g.id), label: g.name }))}
                value={selectedGroups || []}
                onChange={(value) => setSelectedGroups(value.length ? value : null)}
                placeholder="Selecionar"
                searchable clearable />
            </div>
            <div className="grid">
              <div className="col"></div>
              <div className="col">
                  <Button type="button"
                    disabled={(!selectedGroups || selectedGroups.length === 0)}
                  onClick={addGroups}>Adicionar</Button>
              </div>
              <div className="col"></div>
            </div>
            </>
            }
            { (groups && groups.length > 0) ?
              <>
              <div className="field col-12 pl-0 pt-2">
                <SelectionList options={groups} value={removedGroups}
                  onChange={setRemovedGroups} ariaLabel="Grupos atribuídos" />
              </div>
              <div className="grid">
                <div className="col"></div>
                <div className="col">
                  <Button type="button"
                  disabled={(!removedGroups || removedGroups.length === 0)}
                  onClick={removeGroups}>Remover</Button>
                </div>
                <div className="col"></div>
              </div>
              </> :
              <div className="grid justify-content-center">
                <div className="col-12 mt-4 mb-2">
                  <Alert color="warning" py="xs">
                    <Group justify="center" gap="xs" wrap="nowrap">
                      <i className="pi pi-exclamation-triangle" />
                      <span>Adicione um ou mais Grupos</span>
                    </Group>
                  </Alert>
                </div>
              </div>
            }
          </div>
        </div>

      </div>

      <Group justify="flex-end" className="mt-4 mb-4">
        <Button
          type="button"
          variant="default"
          leftSection={<i className="pi pi-arrow-left" />}
          disabled={isSaving}
          onClick={goBack}>Voltar</Button>
        <Button
          type="submit"
          leftSection={<i className="pi pi-save" />}
          loading={isSaving}>Gravar</Button>
      </Group>

    </form>
  );

}

export default connect(state => ({}))(UserForm);
