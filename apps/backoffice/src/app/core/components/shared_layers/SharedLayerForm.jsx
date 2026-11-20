import React, { useContext, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Alert, Button, Grid, Group, Input, Loader, Tabs, TextInput } from '@mantine/core';
import { CodeEditor, notify, IconArrowLeft, IconSave, IconHome, IconHistory, IconSitemap } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { useRecordNavigation } from '../common/useRecord';
import { useChangeSummary } from '../common/ChangeSummary';
import { useRecordHistory } from '../common/RecordHistory';
import PageSection from '../common/PageSection';
import { ERROR_TEXT, errorText, InUseDialog, UsageTable } from './SharedLayerUsage';

const BASE_TAB = { value: 'base', label: 'Dados Base', icon: IconHome };
const USAGE_TAB = { value: 'usage', label: 'Utilizações', icon: IconSitemap };
const HISTORY_TAB = { value: 'history', label: 'Histórico', icon: IconHistory };

const CODE_PATTERN = /^[a-z0-9-]+$/;

const layerText = (value) => (value && typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || ''));

/** Returns true for a layer JSON text that the library accepts, or the reason it does not. */
const checkLayer = (text) => {
  let layer;
  try {
    layer = JSON.parse(text);
  } catch (e) {
    return 'JSON inválido.';
  }
  if (!layer || typeof layer !== 'object' || Array.isArray(layer)) return ERROR_TEXT.invalid_layer;
  if (typeof layer.type !== 'string' || !layer.type.trim() || 'id' in layer) return ERROR_TEXT.invalid_layer;
  if (layer.type.trim().toUpperCase() === 'GROUP') return ERROR_TEXT.group_layer;
  return true;
};

function SharedLayerForm(props) {

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('base');
  const [refusal, setRefusal] = useState(null);
  const [usage, setUsage] = useState({ status: 'loading', viewers: [] });

  const data = props.data || {};

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, formState: { errors }, setValue, getValues } = useForm({
    defaultValues: {
      code: data.code || '',
      title: data.title || '',
      layer_json: layerText(data.layer_json)
    }
  });

  const { goBack, openCreated } = useRecordNavigation('/shared-layers');

  const buildData = (formData) => ({
    code: formData.code,
    title: formData.title,
    layer_json: formData.layer_json
  });

  const onRefused = (e) => {
    if (e?.status === 409 && e.body?.error === 'in_use') {
      setRefusal({ text: 'O código não pode mudar enquanto a camada está em uso.', viewers: e.body.viewers || [] });
      return true;
    }
    const text = errorText(e);
    if (text) {
      notify.error('Gravar Registo', text);
      return true;
    }
    return false;
  };

  const summary = useChangeSummary({
    record: data,
    initialPayload: () => buildData({ code: data.code, title: data.title, layer_json: layerText(data.layer_json) }),
    save: (payload) => dataProvider(API_URL + '/portal').update('shared-layers', { id: data.id, data: payload }),
    onReload: props.onReload,
    onError: onRefused
  });

  const history = useRecordHistory({
    url: data.id ? `${API_URL}/portal/shared-layers/${data.id}/history` : null,
    savedCount: summary.savedCount,
    current: () => buildData(getValues()),
    fromSnapshot: (s) => ({ code: s.code || '', title: s.title || '', layer_json: layerText(s.layer_json) }),
    onRestore: (p) => Object.keys(p).forEach((k) => setValue(k, p[k] ?? '', { shouldDirty: true }))
  });

  useEffect(() => {
    if (!data.id) return;
    let live = true;
    setUsage((u) => ({ ...u, status: 'loading' }));
    dataProvider(API_URL + '/portal').get(`shared-layers/${data.id}/usage`)
      .then(d => { if (live) setUsage({ status: 'ready', viewers: d.data || [] }); })
      .catch(() => { if (live) setUsage({ status: 'failed', viewers: [] }); });
    return () => { live = false; };
  }, [data.id, summary.savedCount]);

  const onSubmit = (formData) => {
    const new_data = buildData(formData);

    if (data.id) {
      summary.submit(new_data);
    } else {
      setIsSaving(true);
      dataProvider(API_URL + '/portal').create('shared-layers', { data: new_data }).then(d => {
        openCreated(d.data.id);
        notify.success('Criar Registo', 'Registo criado com sucesso');
      }).catch(e => {
        if (!onRefused(e)) notify.error('Criar Registo', 'Ocorreu um erro ao criar o registo');
      }).finally(() => {
        setIsSaving(false);
      });
    }
  };

  const fieldError = (name) => errors?.[name]?.message || undefined;

  const tabs = data.id ? [BASE_TAB, USAGE_TAB, HISTORY_TAB] : [BASE_TAB];

  return (
    <React.Fragment>

      <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)}>
        <Tabs.List>
          {tabs.map((item) => (
            <Tabs.Tab key={item.value} value={item.value} leftSection={<item.icon fixedWidth />}>
              {item.value === 'usage' && usage.status === 'ready' ? `${item.label} (${usage.viewers.length})` : item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <form onSubmit={handleSubmit(onSubmit)}>

        {history.notice}

        {activeTab === 'base' &&
          <PageSection>
            <Grid gap="sm">
              <Grid.Col span={{ base: 12, md: 1 }}>
                <TextInput id="id" label="Id" value={data.id || ''} readOnly />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput id="code" label="Código" autoFocus
                  description="Letras minúsculas, algarismos e hífen"
                  error={fieldError('code')}
                  {...register('code', {
                    required: 'Campo obrigatório.',
                    pattern: { value: CODE_PATTERN, message: ERROR_TEXT.invalid_code }
                  })} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput id="title" label="Título"
                  description="Vazio: o título da camada"
                  error={fieldError('title')}
                  {...register('title')} />
              </Grid.Col>

              <Grid.Col span={12}>
                <Input.Label>Camada (JSON)</Input.Label>
                <Controller
                  control={control}
                  name="layer_json"
                  rules={{ required: 'Campo obrigatório.', validate: checkLayer }}
                  render={({ field }) => (
                    <CodeEditor
                      language="json"
                      value={field.value}
                      onChange={field.onChange}
                      height="400px"
                      aria-label="Camada (JSON)"
                    />
                  )}
                />
                {fieldError('layer_json') && <Input.Error data-testid="layer-json-error">{fieldError('layer_json')}</Input.Error>}
              </Grid.Col>
            </Grid>
          </PageSection>
        }

        {activeTab === 'usage' &&
          <PageSection>
            {usage.status === 'loading' && <Loader size="sm" />}
            {usage.status === 'failed' && <Alert color="danger">Não foi possível carregar as utilizações.</Alert>}
            {usage.status === 'ready' && <UsageTable viewers={usage.viewers} />}
          </PageSection>
        }

        {activeTab === 'history' && <PageSection>{history.table}</PageSection>}

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
        {history.dialog}

      </form>

      <InUseDialog refusal={refusal} onClose={() => setRefusal(null)} />

    </React.Fragment>
  );

}

export default SharedLayerForm;
