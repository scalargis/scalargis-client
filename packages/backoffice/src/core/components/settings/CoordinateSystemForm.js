import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import { withRouter, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';

import AppContext from '../../../AppContext';
import useFormFields from '../../useFormFields';
import dataProvider from '../../../service/DataProvider';

function CoordinateSystemForm(props) {

  const {
    history,
    dispatch
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const toast = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

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
      code: formData.code,
      name: formData.name,
      description: formData.description,
      config_json: {
        code: formData.code,
        defs: formData.defs,
        description: formData.description,
        extent: `${formData.minx} ${formData.miny} ${formData.maxx} ${formData.maxy}`,
        precision: formData.precision,
        srid: formData.srid,
        title: formData.name,
        label: formData.label
      }
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/api/v2/portal/lists');      
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('coordinate_systems', params).then(d => {       
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
      provider.create('coordinate_systems', params).then(d => {
        setData({...data, id: d.data.id});
        toast.current.show({life: 5000, severity: 'success', summary: 'Criar Registo', detail: 'Registo criada com sucesso'});
      }).catch(e => {
        toast.current.show({life: 5000, severity: 'error', summary: 'Criar Registo', detail: 'Ocorreu um erro ao criar o registo'});
      }).finally(() => {
        setIsSaving(false);
      });       
    }

    
    //setShowMessage(true);

    //reset();
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

            <div className="p-field p-col-12 p-md-2">
              <label htmlFor="code">Código</label>
              <InputText id="code" name="code" {...register('code', { required: 'Campo obrigatório.' })} autoFocus className={classNames({ 'p-invalid': errors.code })} />
              {getFormErrorMessage(errors, 'code')}
            </div>

            <div className="p-field p-col-12 p-md-2">
              <label htmlFor="srid">SRID</label>
              <InputText id="srid" name="srid" {...register('srid', { required: true, pattern: { value: /^[0-9]+$/, message: 'Formato inválido'} })}
                autoFocus className={classNames({ 'p-invalid': errors.srid })} />
              {getFormErrorMessage(errors, 'srid')}
            </div>            

            <div className="p-field p-col-12 p-md-6">
              <label htmlFor="name">Designação</label>        
              <InputText id="name" name="name" {...register('name', { required: 'This is required.' })} autoFocus className={classNames({ 'p-invalid': errors.name })} />
              {getFormErrorMessage(errors, 'name')}
            </div>
            
            <div className="p-field p-col-12 p-md-4">
              <label htmlFor="label">Label</label>        
              <InputText id="label" name="label" {...register('label')} autoFocus className={classNames({ 'p-invalid': errors.label })} />
              {getFormErrorMessage(errors, 'label')}
            </div>

            <div className="p-field p-col-12 p-md-8">
              <label htmlFor="description">Descrição</label>        
              <InputText id="description" name="description" {...register('description', { required: 'This is required.' })} autoFocus className={classNames({ 'p-invalid': errors.description })} />
              {getFormErrorMessage(errors, 'description')}
            </div>

            <div className="p-field p-col-12">
              <label htmlFor="defs">Definição</label>        
              <InputText id="defs" name="defs" {...register('defs')} autoFocus />
            </div>

            <div className="p-field p-col-12 p-md-3">
              <label htmlFor="minx">Min X</label>
              <InputText id="minx" name="minx" {...register('minx', { required: 'Campo obrigatório.', 
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'},
                min: -180, max: 180 } )} 
                autoFocus className={classNames({ 'p-invalid': errors.minx })} />
              {getFormErrorMessage(errors, 'minx')}
            </div>

            <div className="p-field p-col-12 p-md-3">
              <label htmlFor="miny">Min Y</label>
              <InputText id="miny" name="minx" {...register('miny', { required: 'Campo obrigatório.', 
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'},
                min: -90, max: 90 } )}
                autoFocus className={classNames({ 'p-invalid': errors.miny })} />
              {getFormErrorMessage(errors, 'miny')}
            </div>

            <div className="p-field p-col-12 p-md-3">
              <label htmlFor="maxx">Max X</label>        
              <InputText id="maxx" name="maxx" {...register('maxx', { required: 'Campo obrigatório.', 
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'} })} 
                autoFocus className={classNames({ 'p-invalid': errors.maxx })} />
              {getFormErrorMessage(errors, 'maxx')}
            </div>

            <div className="p-field p-col-12 p-md-3">
              <label htmlFor="maxy">Max Y</label>        
              <InputText id="maxy" name="minx" {...register('maxy', { required: 'Campo obrigatório.', 
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'} })} 
                autoFocus className={classNames({ 'p-invalid': errors.maxy })} />
              {getFormErrorMessage(errors, 'maxy')}
            </div>

            {/*
            <div className="p-field p-col-12 p-md-3">
              <label htmlFor="precision">Precisão</label>        
              <InputText id="precision" name="precision" {...register('precision', { required: true,
                pattern: { value: /^[0-9]+$/, message: 'Formato inválido'} })}
                autoFocus className={classNames({ 'p-invalid': errors.precision })} />
              {getFormErrorMessage(errors, 'precision')}
            </div>
            */}

            <div className="p-field p-col-12 p-md-3">
              <label htmlFor="precision">Precisão</label>
              <Controller name="precision" control={control} render={(props) => (
                <Dropdown  id="precision" value={props.field.value} 
                  options={[0,1,2,3,4,5,6,7,8,9,10].map(val => {
                    return {
                      label: (val + ' casas decimais'),
                      value: Math.pow(10, (val))
                      }
                  })}
                  onChange={(e) => props.field.onChange(e.value)}
                  showClear
                  className={classNames({ 'p-invalid': errors.precision })} />                    
              )} />
            </div>            

          </div>

        <Toolbar className="p-mt-4 p-mb-4" right={rightToolbarTemplate}></Toolbar>

      </form>
  );

}

//export default CoordinateSystemForm;
export default connect(state => ({}))(withRouter(CoordinateSystemForm));