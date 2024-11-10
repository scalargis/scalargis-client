import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { ToggleButton } from 'primereact/togglebutton';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { MultiSelect } from 'primereact/multiselect';
import { ListBox } from 'primereact/listbox';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';
import { v4 as uuidV4 } from 'uuid'

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { systemRoles } from '../../utils';


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
    history,
    dispatch
  } = props;

  console.log(props);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const [roles, setRoles] = useState(props?.data?.roles ? sortRolesArray([...props.data.roles]).filter(r => !systemRoles.includes(r.name)) : []);
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
      setAvailableRoles(sortRolesArray(roles_result.data.filter(v => !rids.includes(v.id) && !systemRoles.includes(v.name))
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
    const location = {
      pathname: history.location.state.from,
      state: { 
        searchParams: {...history.location.state.previousSearchParams}
      }
    }
    history.replace(location);
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
        toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: 'Ocorreu um erro ao alterar o registo'});        
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
        toast.current.show({life: 5000, severity: 'error', summary: 'Criar Registo', detail: 'Ocorreu um erro ao criar o registo'});
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
              className="p-button-secondary p-mr-4"
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

      <div className="p-fluid p-formgrid p-grid">
        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="first_name">Primeiro Nome</label>
          <InputText id="first_name" name="first_name" {...register('first_name')} autoFocus />
        </div>            
        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="last_name">Último Nome</label>
          <InputText id="last_name" name="last_name" {...register('last_name')} />
        </div>
        <div className="p-field p-col-12 p-md-6">
          <label htmlFor="name">Nome</label>
          <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.name })} />
          {getFormErrorMessage(errors, 'name')}
        </div>

        <div className="p-field p-col-12 p-md-3">
          <label htmlFor="username">Username</label>
          <InputText id="username" name="username" {...register('username', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.username })} />
          {getFormErrorMessage(errors, 'username')}
        </div>
        <div className="p-field p-col-12 p-md-4">
          <label htmlFor="email">Email</label>
          <InputText id="email" name="email" {...register('email', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.email })} />
          {getFormErrorMessage(errors, 'email')}
        </div>
        <div className="p-field p-col-12 p-md-4">
          <label htmlFor="password">Password</label>
          <Controller
            control={control}
            name="password"
            render={({ field }) => {
              return <Password {...field} feedback={false}  onChange={(e) => field.onChange(e.target.value)} />
            }} 
          />
        </div>

        <div className="p-field p-col-12">
          <div className="p-grid">              
            <div className="p-col-3 p-mt-2 p-mb-2">
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

        <div className="p-field p-col-12 p-md-6">
          <label htmlFor="auth_token">Token de Autenticação</label>
          <div className="p-inputgroup">
              <Button type="button" label="Gerar" icon="pi pi-check" className="p-button-primary" onClick={(e) => { setValue('auth_token', String(uuidV4())); } } />
              <InputText id="auth_token" name="auth_token" {...register('auth_token')} placeholder="Token não definido" />
              <Button type="button" icon="pi pi-times" className="p-button-danger" onClick={(e) => { setValue('auth_token', null); setValue('auth_token_expire', null); } } />                
          </div>
        </div>
        <div className="p-field p-col-12 p-md-3">
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
              <Button type="button" icon="pi pi-times" className="p-button-danger" onClick={(e) => setValue('auth_token_expire', null) } />
          </div>
        </div>          

        <div className="p-field p-col-12 p-md-6">
          <label>Perfis</label>
          <div className="p-card p-p-2">
            { (availableRoles && availableRoles.length > 0) && 
            <>
            <div className="p-field p-col-12 p-pl-0">
              <MultiSelect value={selectedRoles} options={availableRoles} 
                optionLabel="name" optionValue="id" display="chip" showClear 
                filter filterValue={filterRolesValue} 
                onFilterValueChange={(e) => setFilterRolesValue(e.value)}
                onChange={(e) => setSelectedRoles(e.value)} placeholder="Selecionar" />
            </div>              
            <div className="p-grid">
              <div className="p-col"></div>
              <div className="p-col">
                  <Button label="Adicionar" type="button" 
                    disabled={(!selectedRoles || selectedRoles.length === 0)}
                  onClick={addRoles} />
              </div>
              <div className="p-col"></div>
            </div>
            </>
            }
            { (roles && roles.length > 0) ?
              <>        
              <div className="p-field p-col-12 p-pl-0 p-pt-2">
                <ListBox optionLabel="name" optionValue="id" className="p-p-1"
                  options={roles} value={removedRoles}
                  onChange={(e) => setRemovedRoles(e.value)} multiple />
              </div>
              <div className="p-grid">
                <div className="p-col"></div>
                <div className="p-col">
                  <Button label="Remover" type="button" 
                  disabled={(!removedRoles || removedRoles.length === 0)}
                  onClick={removeRoles} />
                </div>
                <div className="p-col"></div>
              </div>
              </> :
              <div className="p-grid p-justify-center">
                <div className="p-col-12 p-mt-4 p-mb-2">
                  <Message severity="warn" text="Adicione um ou mais Perfis" />
                </div>
              </div>
            }
          </div>
        </div>

        <div className="p-field p-col-12 p-md-6">
          <label>Grupos</label>
          <div className="p-card p-p-2">
            { (availableGroups && availableGroups.length > 0) && 
            <>
            <div className="p-field p-col-12 p-pl-0">
              <MultiSelect value={selectedGroups} options={availableGroups} 
                optionLabel="name" optionValue="id" display="chip" showClear 
                filter filterValue={filterGroupsValue} 
                onFilterValueChange={(e) => setFilterGroupsValue(e.value)}
                onChange={(e) => setSelectedGroups(e.value)} placeholder="Selecionar" />
            </div>              
            <div className="p-grid">
              <div className="p-col"></div>
              <div className="p-col">
                  <Button label="Adicionar" type="button" 
                    disabled={(!selectedGroups || selectedGroups.length === 0)}
                  onClick={addGroups} />
              </div>
              <div className="p-col"></div>
            </div>
            </>
            }
            { (groups && groups.length > 0) ?
              <>        
              <div className="p-field p-col-12 p-pl-0 p-pt-2">
                <ListBox optionLabel="name" optionValue="id" className="p-p-1"
                  options={groups} value={removedGroups}
                  onChange={(e) => setRemovedGroups(e.value)} multiple />
              </div>
              <div className="p-grid">
                <div className="p-col"></div>
                <div className="p-col">
                  <Button label="Remover" type="button" 
                  disabled={(!removedGroups || removedGroups.length === 0)}
                  onClick={removeGroups} />
                </div>
                <div className="p-col"></div>
              </div>
              </> :
              <div className="p-grid p-justify-center">
                <div className="p-col-12 p-mt-4 p-mb-2">
                  <Message severity="warn" text="Adicione um ou mais Grupos" />
                </div>
              </div>
            }
          </div>
        </div>          

      </div>

      <Toolbar className="p-mt-4 p-mb-4" right={rightToolbarTemplate}></Toolbar>

    </form>
  );

}

export default connect(state => ({}))(withRouter(UserForm));