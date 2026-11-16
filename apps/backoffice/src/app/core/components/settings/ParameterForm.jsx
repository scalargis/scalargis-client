import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Button, Grid, Group, TextInput, Textarea } from '@mantine/core';
import { notify, IconArrowLeft, IconSave } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { useRecordNavigation } from '../common/useRecord';
import { useChangeSummary } from '../common/ChangeSummary';

function ParameterForm(props) {

  const {
    dispatch
  } = props;

  const parameters_table = props.parametersTable || 'site';

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {...data}
  });

  const { goBack, openCreated } = useRecordNavigation('/settings/parameters');

  const buildData = (formData) => ({
    code: formData.code,
    name: formData.name,
    notes: formData.notes,
    setting_value: formData.setting_value
  });

  const summary = useChangeSummary({
    record: data,
    initialPayload: () => buildData(data),
    save: (payload) => dataProvider(API_URL + '/portal/settings').update(parameters_table, { id: data.id, data: payload }),
    onReload: props.onReload
  });

  const onSubmit = (formData) => {
    const new_data = buildData(formData);

    if (data.id) {
      summary.submit(new_data);
    } else {
      setIsSaving(true);
      const provider = dataProvider(API_URL + '/portal/settings');
      const params = {
        data: {...new_data}
      }
      provider.create(parameters_table, params).then(d => {
        openCreated(d.data.id);
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
              <TextInput id="notes" label="Descrição"
               error={fieldError(errors, 'notes')}
               {...register('notes')} />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea id="setting_value" label="Valor" rows={25}
               error={fieldError(errors, 'setting_value')}
               {...register('setting_value', { required: 'Campo obrigatório.' })} />
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
            loading={isSaving || summary.saving}>Gravar</Button>
        </Group>

        {summary.dialog}

      </form>
  );

}

export default connect(state => ({}))(ParameterForm);
