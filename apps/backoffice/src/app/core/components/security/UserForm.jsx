import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { ToggleButton } from 'primereact/togglebutton';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { ListBox } from 'primereact/listbox';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
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

// Returns true when the password satisfies all platform complexity rules,
// otherwise a pt-PT message naming the first failing rule.
const validatePassword = (value) => {
  if (!value) return true; // 'required' rule handles the empty case
  if (!/[a-z]/.test(value)) return 'A password deve conter pelo menos uma minúscula.';
  if (!/[A-Z]/.test(value)) return 'A password deve conter pelo menos uma maiúscula.';
  if (!/[0-9]/.test(value)) return 'A password deve conter pelo menos um dígito.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'A password deve conter pelo menos um caractere especial.';
  if (value.length < PASSWORD_MIN_LENGTH) return `A password deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  return true;
};

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
  const [filterRolesValue, setFilterRolesValue] = useState('');

  const [groups, setGroups] = useState(props?.data?.groups ? sortGroupsArray([...props.data.groups]) : []);
  const [availableGroups, setAvailableGroups] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(null);
  const [removedGroups, setRemovedGroups] = useState(null);
  const [filterGroupsValue, setFilterGroupsValue] = useState('');

  const toast = useRef(null);

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

  const addRoles = () => {
    if (!availableRoles) return;
    
    const new_roles = availableRoles.filter(v => selectedRoles.includes(v.id));
    const new_available_roles = availableRoles.filter(v => !selectedRoles.includes(v.id));

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
    if (!availableGroups) return;
    
    const new_groups = availableGroups.filter(v => selectedGroups.includes(v.id));
    const new_available_groups = availableGroups.filter(v => !selectedGroups.includes(v.id));

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
    /*
    const location = {
      pathname: history.location.state.from,
      state: { 
        searchParams: {...history.location.state.previousSearchParams}
      }
    }
    history.replace(location);
    */
    const state = { 
      searchParams: {...location.state.previousSearchParams}
    }
    navigate(location.state.from, { state });
    //history.goBack();
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

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/security');      
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('users', params).then(d => {       
        toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});
        setValue('password', '', {
          shouldValidate: true,
          shouldDirty: true
        });
      }).catch(e => {
        toast.current.show({life: 5000, severity: 'error', summary: 'Editar Registo', detail: e.body?.message || e.message || 'Ocorreu um erro ao alterar o registo'});        
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('users', params).then(d => {
        setData({...data, id: d.data.id});
        toast.current.show({life: 5000, severity: 'success', summary: 'Criar Registo', detail: 'Registo criada com sucesso'});
      }).catch(e => {
        toast.current.show({life: 5000, severity: 'error', summary: 'Criar Registo', detail: e.body?.message || e.message || 'Ocorreu um erro ao criar o registo'});
      }).finally(() => {
        setIsSaving(false);
      });       
    }
  };

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
 
  const rightToolbarTemplate = () => {
    return (
        <React.Fragment>
            <Button
              type="button" 
              label="Voltar" 
              icon="pi pi-left" 
              severity="secondary" className="mr-4"
              disabled={isSaving ? true : false}
              onClick={goBack} />
            <Button
              type="submit" 
              label="Gravar"
              icon={isSaving ? "pi pi-save pi-spinner" : "pi pi-save" }
              disabled={isSaving ? true : false} />
        </React.Fragment>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>

      <Toast ref={toast} baseZIndex={2000} />

      <div className="p-fluid formgrid grid">
        <div className="field col-12 md:col-3">
          <label htmlFor="first_name">Primeiro Nome</label>
          <InputText id="first_name" name="first_name" {...register('first_name')} autoFocus />
        </div>            
        <div className="field col-12 md:col-3">
          <label htmlFor="last_name">Último Nome</label>
          <InputText id="last_name" name="last_name" {...register('last_name')} />
        </div>
        <div className="field col-12 md:col-6">
          <label htmlFor="name">Nome</label>
          <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.name })} />
          {getFormErrorMessage(errors, 'name')}
        </div>

        <div className="field col-12 md:col-3">
          <label htmlFor="username">Username</label>
          <InputText id="username" name="username" {...register('username', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.username })} />
          {getFormErrorMessage(errors, 'username')}
        </div>
        <div className="field col-12 md:col-4">
          <label htmlFor="email">Email</label>
          <InputText id="email" name="email" {...register('email', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.email })} />
          {getFormErrorMessage(errors, 'email')}
        </div>
        <div className={classNames('field col-12', isCreate ? 'md:col-5' : 'md:col-4')}>
          <label htmlFor="password">Password</label>
          { isCreate ?
            <>
              <div className="p-inputgroup">
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: 'Campo obrigatório.', validate: validatePassword }}
                  render={({ field }) => {
                    return revealPassword
                      ? <InputText id="password" {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                          className={classNames({ 'p-invalid': errors.password })} />
                      : <Password {...field} feedback={false}
                          onChange={(e) => field.onChange(e.target.value)}
                          className={classNames({ 'p-invalid': errors.password })} />
                  }}
                />
                <Button type="button"
                  icon={revealPassword ? 'pi pi-eye-slash' : 'pi pi-eye'}
                  severity="secondary"
                  onClick={() => setRevealPassword(v => !v)} />
              </div>
              {getFormErrorMessage(errors, 'password')}
              <div className="flex align-items-center flex-wrap mt-2" style={{ gap: '0.5rem 1rem' }}>
                <small className="text-500 line-height-3" style={{ maxWidth: '15rem' }}>
                  Mínimo 12 caracteres, com maiúsculas, minúsculas, dígitos e símbolos.
                </small>
                <div className="flex align-items-center ml-auto" style={{ gap: '0.5rem' }}>
                  <label htmlFor="passwordLength" className="m-0 text-500 white-space-nowrap">Tamanho</label>
                  <InputNumber inputId="passwordLength" value={passwordLength}
                    onValueChange={(e) => setPasswordLength(e.value)}
                    showButtons buttonLayout="horizontal"
                    decrementButtonIcon="pi pi-minus" incrementButtonIcon="pi pi-plus"
                    min={PASSWORD_MIN_LENGTH} max={PASSWORD_MAX_LENGTH}
                    style={{ width: 'auto', flex: '0 0 auto' }}
                    inputStyle={{ width: '3rem', textAlign: 'center' }} />
                  <Button type="button" label="Gerar" icon="pi pi-key" className="p-button-primary"
                    onClick={() => {
                      const pwd = generatePassword(passwordLength);
                      setValue('password', pwd, { shouldValidate: true, shouldDirty: true });
                      setRevealPassword(true);
                    }} />
                </div>
              </div>
            </>
            :
            <Controller
              control={control}
              name="password"
              render={({ field }) => {
                return <Password {...field} feedback={false} toggleMask onChange={(e) => field.onChange(e.target.value)} />
              }}
            />
          }
        </div>

        <div className="field col-12">
          <div className="grid">              
            <div className="col-3 mt-2 mb-2">
              <label>&nbsp;</label>
              <Controller
                control={control}
                name="active"
                render={({ field }) => {
                  return <ToggleButton {...field} checked={field.value} onChange={(e) => field.onChange(e.target.value)} onLabel="Utilizador Ativo" offLabel="Utilizador Não Ativo" onIcon="pi pi-check" offIcon="pi pi-times" />
                }} 
              />                    
            </div>
          </div>            
        </div>

        <div className="field col-12 md:col-6">
          <label htmlFor="auth_token">Token de Autenticação</label>
          <div className="p-inputgroup">
              <Button type="button" label="Gerar" icon="pi pi-check" className="p-button-primary" onClick={(e) => { setValue('auth_token', String(uuidV4())); } } />
              <InputText id="auth_token" name="auth_token" {...register('auth_token')} placeholder="Token não definido" />
              <Button type="button" icon="pi pi-times" severity="danger" onClick={(e) => { setValue('auth_token', null); setValue('auth_token_expire', null); } } />
          </div>
        </div>
        <div className="field col-12 md:col-3">
          <label htmlFor="auth_token_expire">Data de Validade do Token</label>
          <div className="p-inputgroup">
              <Controller
                control={control}
                name="auth_token_expire"
                render={({ field }) => {              
                  return <Calendar {...field} 
                    dateFormat="yy-mm-dd"
                    onChange={(e) => field.onChange(e.target.value)} 
                    showIcon showTime showSeconds />
                }} 
              />                    
              <Button type="button" icon="pi pi-times" severity="danger" onClick={(e) => setValue('auth_token_expire', null) } />
          </div>
        </div>          

        <div className="field col-12 md:col-6">
          <label>Perfis</label>
          <div className="card p-2">
            { (availableRoles && availableRoles.length > 0) && 
            <>
            <div className="field col-12 pl-0">
              <MultiSelect value={selectedRoles} options={availableRoles} 
                optionLabel="name" optionValue="id" display="chip" showClear 
                filter filterValue={filterRolesValue} 
                onFilterValueChange={(e) => setFilterRolesValue(e.value)}
                onChange={(e) => setSelectedRoles(e.value)} placeholder="Selecionar" />
            </div>              
            <div className="grid">
              <div className="col"></div>
              <div className="col">
                  <Button label="Adicionar" type="button" 
                    disabled={(!selectedRoles || selectedRoles.length === 0)}
                  onClick={addRoles} />
              </div>
              <div className="col"></div>
            </div>
            </>
            }
            { (roles && roles.length > 0) ?
              <>        
              <div className="field col-12 pl-0 pt-2">
                <ListBox optionLabel="name" optionValue="id" className="p-1"
                  options={roles} value={removedRoles}
                  onChange={(e) => setRemovedRoles(e.value)} multiple />
              </div>
              <div className="grid">
                <div className="col"></div>
                <div className="col">
                  <Button label="Remover" type="button" 
                  disabled={(!removedRoles || removedRoles.length === 0)}
                  onClick={removeRoles} />
                </div>
                <div className="col"></div>
              </div>
              </> :
              <div className="grid justify-content-center">
                <div className="col-12 mt-4 mb-2">
                  <Message severity="warn" text="Adicione um ou mais Perfis" />
                </div>
              </div>
            }
          </div>
        </div>

        <div className="field col-12 md:col-6">
          <label>Grupos</label>
          <div className="card p-2">
            { (availableGroups && availableGroups.length > 0) && 
            <>
            <div className="field col-12 pl-0">
              <MultiSelect value={selectedGroups} options={availableGroups} 
                optionLabel="name" optionValue="id" display="chip" showClear 
                filter filterValue={filterGroupsValue} 
                onFilterValueChange={(e) => setFilterGroupsValue(e.value)}
                onChange={(e) => setSelectedGroups(e.value)} placeholder="Selecionar" />
            </div>              
            <div className="grid">
              <div className="col"></div>
              <div className="col">
                  <Button label="Adicionar" type="button" 
                    disabled={(!selectedGroups || selectedGroups.length === 0)}
                  onClick={addGroups} />
              </div>
              <div className="col"></div>
            </div>
            </>
            }
            { (groups && groups.length > 0) ?
              <>        
              <div className="field col-12 pl-0 pt-2">
                <ListBox optionLabel="name" optionValue="id" className="p-1"
                  options={groups} value={removedGroups}
                  onChange={(e) => setRemovedGroups(e.value)} multiple />
              </div>
              <div className="grid">
                <div className="col"></div>
                <div className="col">
                  <Button label="Remover" type="button" 
                  disabled={(!removedGroups || removedGroups.length === 0)}
                  onClick={removeGroups} />
                </div>
                <div className="col"></div>
              </div>
              </> :
              <div className="grid justify-content-center">
                <div className="col-12 mt-4 mb-2">
                  <Message severity="warn" text="Adicione um ou mais Grupos" />
                </div>
              </div>
            }
          </div>
        </div>          

      </div>

      <Toolbar className="mt-4 mb-4" end={rightToolbarTemplate}></Toolbar>

    </form>
  );

}

export default connect(state => ({}))(UserForm);