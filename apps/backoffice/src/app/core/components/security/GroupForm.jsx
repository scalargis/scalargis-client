import React, { useContext, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { Alert, Button, Checkbox, Group, MultiSelect, Paper, Stack, TextInput } from '@mantine/core';
import { notify } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

const sortRolesArray = (data) => {
  if (!data) return data;

  return data.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
}

const sortUsersArray = (data) => {
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

function GroupForm(props) {

  const {
    dispatch
  } = props;

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const [roles, setRoles] = useState(props?.data?.roles ? sortRolesArray([...props.data.roles]) : []);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState(null);
  const [removedRoles, setRemovedRoles] = useState(null);

  const [users, setUsers] = useState(props?.data?.users ? sortUsersArray([...props.data.users]) : []);
  const [availableUsers, setAvailableUsers] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(null);
  const [removedUsers, setRemovedUsers] = useState(null);

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  useEffect(() => {
    const params = {
      pagination: { page: 1, perPage: 1000},
      sort: { field: 'name', order: 'Asc' },
      filter: {}
    }

    Promise.all([
      dataProvider(API_URL + '/security').getList('roles', params).catch((error) => error),
      dataProvider(API_URL + '/security').getList('users', params).catch((error) => error)
    ]).then((result) => {
      const roles_result = result[0];
      const rids = props?.data?.roles ? props.data.roles.map(v => v.id) : [];
      setAvailableRoles(sortRolesArray(roles_result.data.filter(v => !rids.includes(v.id))
        .map(r => { return { id: r.id, name: r.name} })));

      const users_result = result[1];
      const gids = props?.data?.users ? props.data.users.map(v => v.id) : [];
      setAvailableUsers(sortUsersArray(users_result.data.filter(v => !gids.includes(v.id))
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

  const addUsers = () => {
    if (!availableUsers || !selectedUsers) return;

    const ids = selectedUsers.map(Number);
    const new_users = availableUsers.filter(v => ids.includes(v.id));
    const new_available_users = availableUsers.filter(v => !ids.includes(v.id));

    setUsers(sortUsersArray([...users, ...new_users]));
    setAvailableUsers(sortUsersArray([...new_available_users]));
    setSelectedUsers(null);
    setRemovedUsers(null);
  }

  const removeUsers = () => {
    if (!removedUsers) return;

    const new_available_users = users.filter(v => removedUsers.includes(v.id));
    const new_users = users.filter(v => !removedUsers.includes(v.id));

    setUsers(sortUsersArray([...new_users]));
    setAvailableUsers(sortUsersArray([...availableUsers, ...new_available_users]));
    setRemovedUsers(null);
    setSelectedUsers(null);
  }

  const goBack = () => {
    const state = {
      searchParams: {...location.state.previousSearchParams}
    }
    navigate(location.state.from, { state });
  }

  const onSubmit = (formData) => {
    const new_data = {
      name: formData.name,
      description: formData.description,
      roles: roles ? roles.map(r => r.id) : [],
      users: users ? users.map(r => r.id) : []
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/security');
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('groups', params).then(d => {
        notify.success('Editar Registo', 'Registo alterado com sucesso');
      }).catch(e => {
        notify.error('Editar Registo', 'Ocorreu um erro ao alterar o registo');
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('groups', params).then(d => {
        setData({...data, id: d.data.id});
        notify.success('Criar Registo', 'Registo criado com sucesso');
      }).catch(e => {
        notify.error('Criar Registo', 'Ocorreu um erro ao criar o registo');
      }).finally(() => {
        setIsSaving(false);
      });
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
            <div className="field col-12 md:col-2">
              <TextInput id="id" label="Id" value={data.id || ''} disabled />
            </div>

            <div className="field col-12 md:col-10">
              <TextInput id="name" label="Designação" autoFocus
               error={fieldError(errors, 'name')}
               {...register('name', { required: 'Campo obrigatório.' })} />
            </div>

            <div className="field col-12">
              <TextInput id="description" label="Descrição"
               error={fieldError(errors, 'description')}
               {...register('description')} />
            </div>

            <div className="field col-12 md:col-6">
              <label>Perfis</label>
              <div className="card pt-4">
                { (availableRoles && availableRoles.length > 0) &&
                <>
                <div className="field col-12">
                  <MultiSelect
                    data={availableRoles.map(r => ({ value: String(r.id), label: r.name }))}
                    value={selectedRoles || []}
                    onChange={(value) => setSelectedRoles(value.length ? value : null)}
                    placeholder="Selecionar"
                    searchable clearable />
                </div>
                <div className="grid">
                  <div className="col text-center">
                      <Button type="button"
                        disabled={(!selectedRoles || selectedRoles.length === 0)}
                      onClick={addRoles}>Adicionar</Button>
                  </div>
                </div>
                </>
                }
                { (roles && roles.length > 0) ?
                  <>
                  <div className="field col-12 pt-2">
                    <SelectionList options={roles} value={removedRoles}
                      onChange={setRemovedRoles} ariaLabel="Perfis atribuídos" />
                  </div>
                  <div className="grid">
                    <div className="col"></div>
                    <div className="col text-center">
                      <Button type="button"
                      disabled={(!removedRoles || removedRoles.length === 0)}
                      onClick={removeRoles}>Remover</Button>
                    </div>
                    <div className="col"></div>
                  </div>
                  </> :
                  <div className="grid justify-center">
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
              <label>Utilizadores</label>
              <div className="card pt-4">
                { (availableUsers && availableUsers.length > 0) &&
                <>
                <div className="field col-12">
                  <MultiSelect
                    data={availableUsers.map(u => ({ value: String(u.id), label: u.name }))}
                    value={selectedUsers || []}
                    onChange={(value) => setSelectedUsers(value.length ? value : null)}
                    placeholder="Selecionar"
                    searchable clearable />
                </div>
                <div className="grid">
                  <div className="col text-center">
                      <Button type="button"
                        disabled={(!selectedUsers || selectedUsers.length === 0)}
                      onClick={addUsers}>Adicionar</Button>
                  </div>
                </div>
                </>
                }
                { (users && users.length > 0) ?
                  <>
                  <div className="field col-12 pt-2">
                    <SelectionList options={users} value={removedUsers}
                      onChange={setRemovedUsers} ariaLabel="Utilizadores atribuídos" />
                  </div>
                  <div className="grid">
                    <div className="col text-center">
                      <Button type="button"
                      disabled={(!removedUsers || removedUsers.length === 0)}
                      onClick={removeUsers}>Remover</Button>
                    </div>
                  </div>
                  </> :
                  <div className="grid justify-center">
                    <div className="col-12 mt-4 mb-2">
                      <Alert color="warning" py="xs">
                        <Group justify="center" gap="xs" wrap="nowrap">
                          <i className="pi pi-exclamation-triangle" />
                          <span>Adicione um ou mais Utilizadores</span>
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

export default connect(state => ({}))(GroupForm);
