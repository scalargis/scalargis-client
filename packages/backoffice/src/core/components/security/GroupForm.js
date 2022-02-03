import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { withRouter, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { ListBox } from 'primereact/listbox';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import AppContext from '../../../AppContext';
import useFormFields from '../../useFormFields';
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

function GroupForm(props) {

  const {
    history,
    dispatch
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const [roles, setRoles] = useState(props?.data?.roles ? sortRolesArray([...props.data.roles]) : []);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState(null);
  const [removedRoles, setRemovedRoles] = useState(null);
  const [filterRolesValue, setFilterRolesValue] = useState('');

  const [users, setUsers] = useState(props?.data?.users ? sortUsersArray([...props.data.users]) : []);
  const [availableUsers, setAvailableUsers] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState(null);
  const [removedUsers, setRemovedUsers] = useState(null);
  const [filterUsersValue, setFilterUsersValue] = useState('');

  const toast = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

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
      dataProvider(API_URL + '/api/v2/security').getList('roles', params).catch((error) => error),
      dataProvider(API_URL + '/api/v2/security').getList('users', params).catch((error) => error)
    ]).then((result) => {      
      //console.log(result);

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
  
  const addUsers = () => {
    if (!availableUsers) return;
    
    const new_users = availableUsers.filter(v => selectedUsers.includes(v.id));
    const new_available_users = availableUsers.filter(v => !selectedUsers.includes(v.id));

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
      name: formData.name,
      description: formData.description,
      roles: roles ? roles.map(r => r.id) : [],
      users: users ? users.map(r => r.id) : []
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/api/v2/security');      
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('groups', params).then(d => {       
        toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});
      }).catch(e => {
        toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: 'Ocorreu um erro ao alterar o registo'});
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('groups', params).then(d => {
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
      let msg;

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
            <div className="p-field p-col-12 p-md-2">
              <label htmlFor="id">Id</label>
              <InputText id="id" type="text" value={data.id || ''} disabled />
            </div>         

            <div className="p-field p-col-12 p-md-10">
              <label htmlFor="name">Designação</label>        
              <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })} autoFocus className={classNames({ 'p-invalid': errors.name })} />
              {getFormErrorMessage(errors, 'name')}
            </div>

            <div className="p-field p-col-12 p-md-12">
              <label htmlFor="description">Descrição</label>        
              <InputText id="description" name="notes" {...register('description')} autoFocus />
              {getFormErrorMessage(errors, 'notes')}
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
              <label>Utilizadores</label>
              <div className="p-card p-p-2">
                { (availableUsers && availableUsers.length > 0) && 
                <>
                <div className="p-field p-col-12 p-pl-0">
                  <MultiSelect value={selectedUsers} options={availableUsers} 
                    optionLabel="name" optionValue="id" display="chip" showClear 
                    filter filterValue={filterUsersValue} 
                    onFilterValueChange={(e) => setFilterUsersValue(e.value)}
                    onChange={(e) => setSelectedUsers(e.value)} placeholder="Selecionar" />
                </div>              
                <div className="p-grid">
                  <div className="p-col"></div>
                  <div className="p-col">
                      <Button label="Adicionar" type="button" 
                        disabled={(!selectedUsers || selectedUsers.length === 0)}
                      onClick={addUsers} />
                  </div>
                  <div className="p-col"></div>
                </div>
                </>
                }
                { (users && users.length > 0) ?
                  <>        
                  <div className="p-field p-col-12 p-pl-0 p-pt-2">
                    <ListBox optionLabel="name" optionValue="id" className="p-p-1"
                      options={users} value={removedUsers}
                      onChange={(e) => setRemovedUsers(e.value)} multiple />
                  </div>
                  <div className="p-grid">
                    <div className="p-col"></div>
                    <div className="p-col">
                      <Button label="Remover" type="button" 
                      disabled={(!removedUsers || removedUsers.length === 0)}
                      onClick={removeUsers} />
                    </div>
                    <div className="p-col"></div>
                  </div>
                  </> :
                  <div className="p-grid p-justify-center">
                    <div className="p-col-12 p-mt-4 p-mb-2">
                      <Message severity="warn" text="Adicione um ou mais Utilizadores" />
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

//export default ParameterForm;
export default connect(state => ({}))(withRouter(GroupForm));