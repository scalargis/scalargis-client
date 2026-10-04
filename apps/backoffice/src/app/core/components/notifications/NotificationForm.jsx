import React, { useContext, useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { Alert, Badge, Box, Button, Grid, Group, Input, TextInput, Textarea } from '@mantine/core';
import { notify, IconArrowLeft } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

function NotificationForm(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isSaving, setIsSaving] = useState(false);

  const [data, setData] = useState(props.data || {});

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

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

  const onCheck = () => {
    const values = {
      checked: true,
      checked_date: new Date().toISOString().slice(0, 10)
    }
    updateNotification(values);
  }

  const onClose = () => {
    const values = {
      closed: true,
      closed_date: new Date().toISOString().slice(0, 10)
    }
    updateNotification(values);
  }

  const onReopen = () => {
    const values = {
      closed: false,
      closed_date: null
    }
    updateNotification(values);
  }

  const onSave = () => {
    const values = {
      notes: data.notes
    }
    updateNotification(values);
  }

  const updateNotification = (values) => {
    setIsSaving(true);

    const provider = dataProvider(API_URL + '/portal');
    const params = {
      id: data.id,
      data: values
    }
    provider.update('notifications', params).then(d => {
      notify.success('Editar Registo', 'Registo alterado com sucesso');
      setData({...d.data});
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
                    <TextInput id="id" label="Id" value={data.id} disabled />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput id="name" label="Nome" value={data.name} disabled />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <TextInput id="email" label="Email" value={data.email} disabled />
                </Grid.Col>
                <Grid.Col span={12}>
                    <Textarea id="message" label="Mensagem" rows={5} value={data.message} readOnly
                      autosize minRows={5} maxRows={10} style={{opacity: '0.6'}} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Input.Label>Ficheiros</Input.Label>
                  { (data?.files || []).length ?
                    (data.files || []).map((file, index) => (
                      <Grid gap="sm" key={file.url || index}>
                        <Grid.Col span={{ base: "auto", md: 9 }}>
                          <Box m="xs">
                            <a href={file.url} target="_blank" rel="noreferrer" download={file.filename}>{file.filename}</a>
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
                    <TextInput id="viewer" label="Visualizador" value={data.viewer} disabled />
                </Grid.Col>
                <Grid.Col span={12}>
                    <TextInput id="date" label="Data" value={data.date || ''} disabled />
                </Grid.Col>
              </Grid>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 9 }}>
              <Grid gap="sm">
                <Grid.Col span={12}>
                  <Textarea id="notes" label="Observações" rows={5} autosize minRows={5} value={data.notes}
                  onChange={(e) => setData({...data, notes: e.target.value})
                  } />
                </Grid.Col>
              </Grid>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Grid gap="sm">
                  <Grid.Col span={12}>
                      <TextInput id="read_date" label="Data Leitura" value={data.checked_date || ''} disabled />
                  </Grid.Col>
                  <Grid.Col span={12}>
                      <TextInput id="close_date" label="Data Encerramento" value={data.closed_date || ''} disabled />
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
            { data?.status?.value === 0 && <Button
              type="button"
              disabled={isSaving}
              onClick={onCheck}>Lida</Button> }
            { data?.status?.value !== 2 && <Button
              type="button"
              disabled={isSaving}
              onClick={onClose}>Encerrar</Button> }
            { data?.status?.value === 2 && <Button
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
