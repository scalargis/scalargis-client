import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { Button, Grid, Group, Input, TextInput } from '@mantine/core';
import { CodeEditor, notify, IconArrowLeft, IconSave } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

function PrintElementForm(props) {

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
      code: formData.code,
      name: formData.name,
      config: formData.config
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/portal');
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('prints/elements', params).then(d => {
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
      provider.create('prints/elements', params).then(d => {
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

          <Grid gap="sm">
            <Grid.Col span={{ base: 12, md: 2 }}>
              <TextInput id="id" label="Id" value={data.id || ''} disabled />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput id="code" label="Código" autoFocus
               error={fieldError(errors, 'code')}
               {...register('code', { required: 'Campo obrigatório.' })} />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <TextInput id="name" label="Designação"
               error={fieldError(errors, 'name')}
               {...register('name', { required: 'Campo obrigatório.' })} />
            </Grid.Col>

            <Grid.Col span={12}>
              <Input.Label>Configuração</Input.Label>
                <Controller
                  control={control}
                  name="config"
                  rules={{ required: 'Campo obrigatório.' }}
                  render={({ field }) => {
                    return <CodeEditor
                      language="json"
                      value={field.value}
                      onChange={field.onChange}
                      height="400px"
                      aria-label="Configuração"
                    />
                  }}
                />
                {fieldError(errors, 'config') && <Input.Error>{fieldError(errors, 'config')}</Input.Error>}
            </Grid.Col>
          </Grid>

        <Group justify="flex-end" mt="md" mb="md">
          <Button
            type="button"
            variant="default"
            leftSection={<IconArrowLeft />}
            disabled={isSaving}
            onClick={goBack}>Voltar</Button>
          <Button
            type="submit"
            leftSection={<IconSave />}
            loading={isSaving}>Gravar</Button>
        </Group>

      </form>
  );

}

export default connect(state => ({}))(PrintElementForm);
