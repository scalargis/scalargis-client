import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { Button, Group, Select, TextInput } from '@mantine/core';
import { notify } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

const precisionOptions = [0,1,2,3,4,5,6,7,8,9,10].map(val => {
  return {
    label: (val + ' casas decimais'),
    value: String(Math.pow(10, (val)))
  }
});

function CoordinateSystemForm(props) {

  const {
    dispatch
  } = props;

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  const goBack = () => {
    const state = {
      searchParams: {...location.state.previousSearchParams}
    }
    navigate(location.state.from, { state });
  }

  const onSubmit = (formData) => {
    const new_data = {
      srid: formData?.srid ? parseInt(formData?.srid) : null,
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

    const provider = dataProvider(API_URL + '/portal/lists');
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('coordinate_systems', params).then(d => {
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
      provider.create('coordinate_systems', params).then(d => {
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

            <div className="field col-12 md:col-2">
              <TextInput id="code" label="Código" autoFocus
               error={fieldError(errors, 'code')}
               {...register('code', { required: 'Campo obrigatório.' })} />
            </div>

            <div className="field col-12 md:col-2">
              <TextInput id="srid" label="SRID"
               error={fieldError(errors, 'srid')}
               {...register('srid', { required: true, pattern: { value: /^[0-9]+$/, message: 'Formato inválido'} })} />
            </div>

            <div className="field col-12 md:col-6">
              <TextInput id="name" label="Designação"
               error={fieldError(errors, 'name')}
               {...register('name', { required: 'Campo obrigatório.' })} />
            </div>

            <div className="field col-12 md:col-6">
              <TextInput id="label" label="Label"
               error={fieldError(errors, 'label')}
               {...register('label')} />
            </div>

            <div className="field col-12 md:col-6">
              <TextInput id="description" label="Descrição"
               error={fieldError(errors, 'description')}
               {...register('description', { required: 'Campo obrigatório.' })} />
            </div>

            <div className="field col-12">
              <TextInput id="defs" label="Definição"
               {...register('defs')} />
            </div>

            <div className="field col-12 md:col-3">
              <TextInput id="minx" label="Min X"
               error={fieldError(errors, 'minx')}
               {...register('minx', { required: 'Campo obrigatório.',
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'},
                min: -180, max: 180 } )} />
            </div>

            <div className="field col-12 md:col-3">
              <TextInput id="miny" label="Min Y"
               error={fieldError(errors, 'miny')}
               {...register('miny', { required: 'Campo obrigatório.',
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'},
                min: -90, max: 90 } )} />
            </div>

            <div className="field col-12 md:col-3">
              <TextInput id="maxx" label="Max X"
               error={fieldError(errors, 'maxx')}
               {...register('maxx', { required: 'Campo obrigatório.',
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'} })} />
            </div>

            <div className="field col-12 md:col-3">
              <TextInput id="maxy" label="Max Y"
               error={fieldError(errors, 'maxy')}
               {...register('maxy', { required: 'Campo obrigatório.',
                pattern: { value: /^[+-]?((\d+(\.\d*)?)|(\.\d+))$/, message: 'Formato inválido'} })} />
            </div>

            <div className="field col-12 md:col-3">
              <Controller name="precision" control={control} render={({ field }) => (
                <Select
                  id="precision"
                  label="Precisão"
                  data={precisionOptions}
                  value={field.value != null ? String(field.value) : null}
                  onChange={(value) => field.onChange(value != null ? Number(value) : null)}
                  clearable />
              )} />
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

export default connect(state => ({}))(CoordinateSystemForm);
