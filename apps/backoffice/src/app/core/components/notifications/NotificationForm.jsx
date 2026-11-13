import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { Alert, Badge, Box, Button, Grid, Group, Input, TextInput, Textarea } from '@mantine/core';
import dayjs from 'dayjs';
import { notify, IconArrowLeft } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { NOTIFICATION_STATUS, refreshNotificationsTotal } from './status';

const formatDay = (value) => (value ? dayjs(value).format('YYYY-MM-DD') : '');

function NotificationForm(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const downloadFile = (event, file) => {
    event.preventDefault();
    const headers = {};
    const logged = core.getLoggedUser();
    if (logged?.token) headers['X-API-KEY'] = logged.token;
    fetch(file.url, { headers })
      .then(response => {
        if (!response.ok) throw new Error(String(response.status));
        return response.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => notify.error('Ficheiros', 'Não foi possível obter o ficheiro'));
  }

  const goBack = () => {
    if (location.state && location.state.from) {
      const state = {
        searchParams: {...location.state.previousSearchParams}
      }
      navigate(location.state.from, { replace: true, state })
    } else {
      navigate(-1);
    }
  }

  const onCheck = () => updateNotification({ checked: true });

  const onClose = () => updateNotification({ closed: true });

  const onReopen = () => updateNotification({ closed: false });

  const onSave = () => updateNotification({});

  const updateNotification = (values) => {
    setIsSaving(true);

    const provider = dataProvider(API_URL + '/portal');
    const params = {
      id: data.id,
      data: { ...values, notes: data.notes ?? null }
    }
    const previousStatus = data?.status?.value;
    provider.update('notifications', params).then(d => {
      notify.success('Editar Registo', 'Registo alterado com sucesso');
      setData({...d.data});
      if (d.data?.status?.value !== previousStatus) {
        refreshNotificationsTotal(API_URL, props.dispatch);
      }
    }).catch(e => {
      notify.error('Editar Registo', 'Ocorreu um erro ao alterar o registo');
    }).finally(() => {
      setIsSaving(false);
    });
  }

  return (
    <React.Fragment>
      <h3>Notificação - Edição</h3>

      <form>
        { data.id ?
        <React.Fragment>
          <Grid gap="sm">
            <Grid.Col span={{ base: 12, md: 9 }}>
              <Grid gap="sm">
                <Grid.Col span={{ base: 12, md: 2 }}>
                    <TextInput id="id" label="Id" value={data.id ?? ''} disabled />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput id="name" label="Nome" value={data.name ?? ''} disabled />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput id="email" label="Email" value={data.email ?? ''} disabled />
                </Grid.Col>
                <Grid.Col span={12}>
                    <Textarea id="message" label="Mensagem" rows={5} value={data.message ?? ''} readOnly
                      autosize minRows={5} maxRows={10} style={{opacity: '0.6'}} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Input.Label>Ficheiros</Input.Label>
                  { (data?.files || []).length ?
                    (data.files || []).map((file, index) => (
                      <Grid gap="sm" key={file.url || index}>
                        <Grid.Col span={{ base: "auto", md: 9 }}>
                          <Box m="xs">
                            <a href={file.url} onClick={(event) => downloadFile(event, file)}>{file.filename}</a>
                          </Box>
                        </Grid.Col>
                        <Grid.Col span={{ base: "auto", md: 3 }}>
                          <Box m="xs" ta="center">
                            {file.size != null && <Badge variant="light" color="secondary">{(file.size / 1024).toFixed(2) + " KB"}</Badge>}
                          </Box>
                        </Grid.Col>
                      </Grid>
                    ))
                    :
                    <Box m="xs">Não tem ficheiros</Box>
                  }
                </Grid.Col>
              </Grid>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Grid gap="sm">
                <Grid.Col span={12}>
                    <TextInput id="viewer" label="Visualizador" value={data.viewer ?? ''} disabled />
                </Grid.Col>
                <Grid.Col span={12}>
                    <TextInput id="date" label="Data" value={formatDay(data.date)} disabled />
                </Grid.Col>
              </Grid>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 9 }}>
              <Grid gap="sm">
                <Grid.Col span={12}>
                  <Textarea id="notes" label="Observações" rows={5} autosize minRows={5} value={data.notes ?? ''}
                  onChange={(e) => setData({...data, notes: e.target.value})
                  } />
                </Grid.Col>
              </Grid>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Grid gap="sm">
                  <Grid.Col span={12}>
                      <TextInput id="read_date" label="Data Leitura" value={formatDay(data.checked_date)} disabled />
                  </Grid.Col>
                  <Grid.Col span={12}>
                      <TextInput id="close_date" label="Data Encerramento" value={formatDay(data.closed_date)} disabled />
                  </Grid.Col>
                </Grid>
            </Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="md" mb="md">
            <Button
              type="button"
              variant="default"
              leftSection={<IconArrowLeft />}
              disabled={isSaving}
              onClick={goBack}>Voltar</Button>
            { data?.status?.value === NOTIFICATION_STATUS.OPEN && <Button
              type="button"
              disabled={isSaving}
              onClick={onCheck}>Lida</Button> }
            { data?.status?.value !== NOTIFICATION_STATUS.CLOSED && <Button
              type="button"
              disabled={isSaving}
              onClick={onClose}>Encerrar</Button> }
            { data?.status?.value === NOTIFICATION_STATUS.CLOSED && <Button
              type="button"
              disabled={isSaving}
              onClick={onReopen}>Reabrir</Button> }
            <Button
              type="button"
              disabled={isSaving}
              onClick={onSave}>Gravar</Button>
          </Group>
        </React.Fragment>
        :
        <React.Fragment>
          <Alert color="danger" py="xs">Não foi possível obter os dados da notificação.</Alert>
          <Group justify="flex-end" mt="xs" mb="md">
            <Button
                type="button"
                variant="default"
                leftSection={<IconArrowLeft />}
                onClick={goBack}>Voltar</Button>
          </Group>
        </React.Fragment> }
      </form>
    </React.Fragment>

  );

}

export default connect(state => ({ auth: state.auth }))(NotificationForm);
