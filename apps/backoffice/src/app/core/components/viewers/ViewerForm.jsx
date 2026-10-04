import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Checkbox,
  Grid,
  Group,
  Input,
  LoadingOverlay,
  MultiSelect,
  Paper,
  Popover,
  Stack,
  Switch,
  Tabs,
  TagsInput,
  TextInput,
} from '@mantine/core';
import { CodeEditor, DataGrid, notify, IconX, IconAlertTriangle, IconUndo, IconRefresh, IconSearch, IconArrowLeft, IconSave, IconHome, IconCog, IconPrint } from '@scalargis/ui';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { isAdminOrManager } from '../../utils';

import PrintGroupChildsEditor from "../common/PrintGroupChildsEditor";
import PageSection from '../common/PageSection';

// Inactive tabs stay mounted (so editor state and history survive a tab
// switch) but are hidden off-flow. We deliberately do NOT use display:none:
// a display:none editor is dropped from layout, so on the first reveal
// CodeMirror re-measures its gutter and the line-number column snaps width
// for one frame (a visible "1,2,3" twitch). Keeping the editor laid out at
// full width with height:0 leaves the gutter measured, so revealing a tab
// just grows the height with no reflow. The form is position:relative so
// these absolutely-positioned hidden cards don't escape it.
const HIDDEN = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: 0,
  overflow: 'hidden',
  visibility: 'hidden',
  pointerEvents: 'none',
};

const sortRolesArray = (data) => {
  if (!data) return data;

  return data.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
}

// Prime ListBox (multiple) replacement: a bordered checkbox list; the checked
// ids are what the Remover button acts on.
const SelectionList = ({ options, value, onChange, ariaLabel }) => (
  <Paper withBorder p="xs" role="group" aria-label={ariaLabel} style={{ maxHeight: '14rem', overflowY: 'auto' }}>
    <Stack gap="xs">
      {options.map((option) => (
        <Checkbox
          key={option.id}
          size="md"
          label={option.name}
          checked={!!value && value.includes(option.id)}
          onChange={(e) =>
            onChange(
              e.currentTarget.checked
                ? [...(value || []), option.id]
                : (value || []).filter((id) => id !== option.id)
            )
          }
        />
      ))}
    </Stack>
  </Paper>
);

const tabItems = [
  { value: 'base', label: 'Dados Base', icon: IconHome },
  { value: 'ui', label: 'UI', icon: IconHome },
  { value: 'config', label: 'Configuração', icon: IconCog },
  { value: 'prints', label: 'Plantas', icon: IconPrint }
];


function ViewerForm(props) {

  const {
    dispatch
  } = props;

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('base');

  const [data, setData] = useState(props.data || {});

  const [configJson, setConfigJson] = useState(data?.config_json ? JSON.stringify(data.config_json, null, 2) : '{}');
  const [manifestJson, setManifestJson] = useState(data?.manifest_json ? JSON.stringify(data.manifest_json, null, 2) : null);
  const [customStyle, setCustomStyle] = useState(data?.custom_style ? data.custom_style : null);

  const [roles, setRoles] = useState(props?.data?.roles ? sortRolesArray([...props.data.roles]) : []);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState(null);
  const [removedRoles, setRemovedRoles] = useState(null);

  const [availableUsers, setAvailableUsers] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(data?.owner ? { id: data.owner.id, username: data.owner.username, name: data.owner.name, active: data.owner.active } : null);

  // Owner picker (Prime OverlayPanel + DataTable): a Popover with a
  // client-side DataGrid over the fetched users list.
  const [ownerPickerOpened, setOwnerPickerOpened] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [ownerPage, setOwnerPage] = useState(1);
  const [ownerSortStatus, setOwnerSortStatus] = useState({ columnAccessor: 'username', direction: 'asc' });

  const [printsList, setPrintsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [printChilds, setPrintChilds] = useState({ prints: props.data?.prints || [], groups: props.data?.print_groups || [] });

  const customStyleEditor = useRef(null);
  const jsonConfigEditor = useRef(null);

  const { core } = useContext(AppContext);

  const adminOrManager = isAdminOrManager(props.auth);

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

    const params_print_groups = {
      pagination: { page: 1, perPage: 1000},
      sort: { field: 'title', order: 'Asc' },
      filter: {}
    }

    setIsLoading(true);

    Promise.all([
      dataProvider(API_URL + '/security').getList('roles', params).catch((error) => error),
      dataProvider(API_URL + '/security').getList('users', params).catch((error) => error),
      dataProvider(API_URL + '/portal').getList('prints', params).catch((error) => error),
      dataProvider(API_URL + '/portal').getList('prints/groups', params_print_groups).catch((error) => error)
    ]).then((result) => {
      const roles_result = result[0];
      const rids = props?.data?.roles ? props.data.roles.map(v => v.id) : [];
      setAvailableRoles(sortRolesArray(roles_result.data.filter(v => !rids.includes(v.id))
        .map(r => { return { id: r.id, name: r.name} })));

      setAvailableUsers(result[1].data.map( u => { return { id: u.id, username: u.username, name: u.name, active: u.active}}));

      if (!(props?.data?.id)) {
        const owner = result[1].data.find(u => u.email === props.auth.data.username);
        if (owner) {
          setSelectedOwner({ id: owner.id, username: owner.username, name: owner.name, active: owner.active});
        }
      }

      const prints_result = result[2]?.data || [];
      setPrintsList(prints_result);
      const groups_result = result[3]?.data || [];
      setGroupsList(groups_result);

      setIsLoading(false);

    }).catch((error) => {
      setIsLoading(false);
    });
  }, []);

  // Close a left-behind search panel when leaving a tab so it isn't sitting
  // open the next time the tab is revealed.
  useEffect(() => {
    if (activeTab !== 'ui') customStyleEditor.current?.closeSearch();
    if (activeTab !== 'config') jsonConfigEditor.current?.closeSearch();
  }, [activeTab]);

  // MultiSelect exchanges string values; ids are numbers everywhere else.
  const addRoles = () => {
    if (!availableRoles || !selectedRoles) return;

    const ids = selectedRoles.map(Number);
    const new_roles = availableRoles.filter(v => ids.includes(v.id));
    const new_available_roles = availableRoles.filter(v => !ids.includes(v.id));

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

  const goBack = () => {
    if (location?.state?.from) {
      const state = {
        searchParams: {...location.state.previousSearchParams}
      }
      navigate(location.state.from, { state });
    } else {
      navigate(-1);
    }
  }

  const onSubmit = (formData) => {
    let manifest_json = null;
    let config_json = null;

    try {
      manifest_json = manifestJson ?  JSON.parse(manifestJson) : null;
    } catch (e) {
        notify.error('Gravar Registo', 'O App Manifest não é JSON válido');
        return false;
    }

    try {
      config_json = JSON.parse(configJson);
    } catch (e) {
        notify.error('Gravar Registo', 'A Configuração não é JSON válido');
        return false;
    }

    const new_data = {
      id: formData.id,
      name: formData.name,
      title: formData.title,
      description: formData.description,
      slug: formData.slug,
      keywords: formData.keywords,
      is_active: formData.is_active,
      show_help: formData.show_help,
      show_credits: formData.show_credits,
      show_contact: formData.show_contact,
      on_homepage: formData.on_homepage,
      img_icon: formData.img_icon ? formData.img_icon : null,
      img_logo: formData.img_logo ? formData.img_logo : null,
      img_logo_alt: formData.img_logo_alt ? formData.img_logo_alt : null,
      manifest_json: manifest_json,
      custom_style: customStyle ? customStyle : null,
      config_json: config_json,
      owner_id: selectedOwner ? selectedOwner.id : null,
      roles: roles ? roles.map(r => r.id) : [],
      prints: printChilds?.prints ? printChilds.prints : [],
      print_groups: printChilds?.groups ? printChilds.groups : []
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/portal');
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('viewers', params).then(d => {
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
      provider.create('viewers', params).then(d => {
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

  const filteredUsers = useMemo(() => {
    const query = ownerSearch.trim().toLowerCase();
    const filtered = (availableUsers || []).filter((u) =>
      !query ||
      (u.username || '').toLowerCase().includes(query) ||
      (u.name || '').toLowerCase().includes(query)
    );
    const dir = ownerSortStatus.direction === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const va = String(a[ownerSortStatus.columnAccessor] || '').toLowerCase();
      const vb = String(b[ownerSortStatus.columnAccessor] || '').toLowerCase();
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
    });
  }, [availableUsers, ownerSearch, ownerSortStatus]);

  const ownerPageRecords = filteredUsers.slice((ownerPage - 1) * 10, ownerPage * 10);

  const ownerColumns = useMemo(
    () => [
      { accessor: 'username', title: 'Username', sortable: true },
      { accessor: 'name', title: 'Nome', sortable: true }
    ],
    []
  );

  const ownerIcon = selectedOwner?.id > 0
    ? (selectedOwner.active ? 'fas fa-user-alt' : 'fas fa-user-alt-slash')
    : 'far fa-user';

  return (
    <Box pos="relative">
      <LoadingOverlay visible={isLoading} />

      <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)}>
        <Tabs.List>
          {tabItems.map((item) => (
            <Tabs.Tab key={item.value} value={item.value} leftSection={<item.icon fixedWidth />}>
              {item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <form onSubmit={handleSubmit(onSubmit)} style={{ position: 'relative' }}>

        <PageSection style={activeTab === 'base' ? undefined : HIDDEN}>

            <Grid gap="sm">

              <Grid.Col span={{ base: 12, md: 2 }}>
                <TextInput id="id" label="Id" value={data.id || ''} readOnly />
              </Grid.Col>

              <Grid.Col ta="center" span={{ base: 12, md: 4 }}>
                <Box component="label" display="block">&nbsp;</Box>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <Switch
                      size="md"
                      style={{ display: 'inline-block' }}
                      label={field.value ? 'Mapa Ativo' : 'Mapa Não Ativo'}
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.currentTarget.checked)}
                    />
                  )}
                />
              </Grid.Col>

              { adminOrManager &&
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Group gap="xs" align="flex-end" wrap="nowrap">
                  <TextInput
                    label="Dono"
                    readOnly
                    leftSection={<i className={ownerIcon} />}
                    value={ selectedOwner?.id > 0 ? `${selectedOwner.name} (${selectedOwner.username})` : 'Anónimo' }
                    style={{ flex: 1 }}
                  />

                  <Popover
                    opened={ownerPickerOpened}
                    onChange={setOwnerPickerOpened}
                    width={450}
                    position="bottom-end"
                    shadow="md"
                    withArrow
                    trapFocus
                  >
                    <Popover.Target>
                      <ActionIcon type="button" size="input-md" aria-label="Alterar dono" title="Alterar"
                        onClick={() => setOwnerPickerOpened((o) => !o)}>
                        <i className="fas fa-user-edit" />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Input.Label>Utilizadores</Input.Label>
                        <TextInput
                          placeholder="Pesquisar"
                          value={ownerSearch}
                          onChange={(e) => { setOwnerSearch(e.currentTarget.value); setOwnerPage(1); }}
                        />
                        <DataGrid
                          idAccessor="id"
                          records={ownerPageRecords}
                          totalRecords={filteredUsers.length}
                          page={ownerPage}
                          onPageChange={setOwnerPage}
                          recordsPerPage={10}
                          sortStatus={ownerSortStatus}
                          onSortStatusChange={(sortStatus) => { setOwnerSortStatus(sortStatus); setOwnerPage(1); }}
                          columns={ownerColumns}
                          onRowClick={({ record }) => { setSelectedOwner({ ...record }); setOwnerPickerOpened(false); }}
                          noRecordsText="Não foram encontrados registos."
                        />
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>

                  { (selectedOwner?.id > 0) &&
                    <ActionIcon type="button" size="input-md" color="danger" aria-label="Remover dono"
                      onClick={() => { setSelectedOwner(null); }}>
                      <IconX />
                    </ActionIcon>
                  }
                </Group>
              </Grid.Col>
              }

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput id="name" label="Designação"
                  error={fieldError(errors, 'name')}
                  {...register('name', { required: 'Campo obrigatório.' })} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput id="title" label="Título"
                  error={fieldError(errors, 'title')}
                  {...register('title', { required: 'Campo obrigatório.' })} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput id="slug" label="Slug" {...register('slug')} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Controller name="keywords" control={control} render={({ field }) => (
                  <TagsInput id="keywords" label="Tags" value={field.value || []} onChange={field.onChange} />
                )} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <Input.Label>Perfis</Input.Label>
                <Paper p="xs">
                  { (availableRoles && availableRoles.length > 0) &&
                  <>
                  <Box p="xs" pl={0} mb="sm">
                    <MultiSelect
                      data={availableRoles.map(r => ({ value: String(r.id), label: r.name }))}
                      value={selectedRoles || []}
                      onChange={(value) => setSelectedRoles(value.length ? value : null)}
                      placeholder="Selecionar"
                      searchable clearable />
                  </Box>
                  <Grid gap="sm">
                    <Grid.Col span="auto"></Grid.Col>
                    <Grid.Col span="auto">
                        <Button type="button"
                          disabled={(!selectedRoles || selectedRoles.length === 0)}
                        onClick={addRoles}>Adicionar</Button>
                    </Grid.Col>
                    <Grid.Col span="auto"></Grid.Col>
                  </Grid>
                  </>
                  }
                  { (roles && roles.length > 0) ?
                    <>
                    <Box pl={0} pt="xs" p="xs" mb="sm">
                      <SelectionList options={roles} value={removedRoles}
                        onChange={setRemovedRoles} ariaLabel="Perfis atribuídos" />
                    </Box>
                    <Grid gap="sm">
                      <Grid.Col span="auto"></Grid.Col>
                      <Grid.Col span="auto">
                        <Button type="button"
                        disabled={(!removedRoles || removedRoles.length === 0)}
                        onClick={removeRoles}>Remover</Button>
                      </Grid.Col>
                      <Grid.Col span="auto"></Grid.Col>
                    </Grid>
                    </> :
                    <Grid justify="center" gap="sm">
                      <Grid.Col mt="md" mb="xs" span={12}>
                        <Alert color="warning" py="xs">
                          <Group justify="center" gap="xs" wrap="nowrap">
                            <IconAlertTriangle />
                            <span>Adicione um ou mais Perfis</span>
                          </Group>
                        </Alert>
                      </Grid.Col>
                    </Grid>
                  }
                </Paper>
              </Grid.Col>

            </Grid>

          </PageSection>

        <PageSection style={activeTab === 'ui' ? undefined : HIDDEN}>
            <Grid gap="sm">

              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput id="img_icon" label="Icon" {...register('img_icon')} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput id="img_logo" label="Logo" {...register('img_logo')} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput id="img_logo_alt" label="Logo Alternativo" {...register('img_logo_alt')} />
              </Grid.Col>

              <Grid.Col span={12}>
                <Input.Label>App Manifest</Input.Label>
                  <CodeEditor
                    language="json"
                    value={manifestJson}
                    onChange={setManifestJson}
                    minHeight="120px"
                    maxHeight="360px"
                    aria-label="App Manifest"
                  />
              </Grid.Col>

              <Grid.Col span={12}>
                <Group justify="flex-end" gap="xs" wrap="nowrap" mb={4}>
                  <ActionIcon type="button" size="input-md" aria-label="Undo" title="Undo"
                    onClick={e => {
                      e.preventDefault();
                      customStyleEditor.current?.undo();
                    }}>
                    <IconUndo />
                  </ActionIcon>
                  <ActionIcon type="button" size="input-md" aria-label="Redo" title="Redo"
                    onClick={e => {
                      e.preventDefault();
                      customStyleEditor.current?.redo();
                    }}>
                    <IconRefresh />
                  </ActionIcon>
                  <ActionIcon type="button" size="input-md" color="warning" aria-label="Pesquisar texto" title="Pesquisar texto"
                    onClick={e => {
                      e.preventDefault();
                      customStyleEditor.current?.openSearch();
                    }}>
                    <IconSearch />
                  </ActionIcon>
                </Group>
                <Input.Label>Style (Código)</Input.Label>
                <CodeEditor
                  ref={customStyleEditor}
                  language="css"
                  value={customStyle}
                  onChange={setCustomStyle}
                  minHeight="120px"
                  maxHeight="360px"
                  aria-label="Style (Código)"
                />
              </Grid.Col>

            </Grid>
          </PageSection>

        <PageSection style={activeTab === 'config' ? undefined : HIDDEN}>
            <Group justify="flex-end" gap="xs" wrap="nowrap" mb={4}>
              <ActionIcon type="button" size="input-md" aria-label="Undo" title="Undo"
                onClick={e => {
                  e.preventDefault();
                  jsonConfigEditor.current?.undo();
                }}>
                <IconUndo />
              </ActionIcon>
              <ActionIcon type="button" size="input-md" aria-label="Redo" title="Redo"
                onClick={e => {
                  e.preventDefault();
                  jsonConfigEditor.current?.redo();
                }}>
                <IconRefresh />
              </ActionIcon>
              <ActionIcon type="button" size="input-md" color="warning" aria-label="Pesquisar texto" title="Pesquisar texto"
                onClick={e => {
                  e.preventDefault();
                  jsonConfigEditor.current?.openSearch();
                }}>
                <IconSearch />
              </ActionIcon>
            </Group>
            <CodeEditor
              ref={jsonConfigEditor}
              language="json"
              value={configJson}
              onChange={setConfigJson}
              height="calc(100vh - 300px)"
              aria-label="Config JSON"
            />
          </PageSection>

        <PageSection style={activeTab === 'prints' ? undefined : HIDDEN}>

            <PrintGroupChildsEditor
              data={printChilds}
              printsList={printsList}
              groupsList={groupsList}
              onChange={(data) => {
                setPrintChilds(data);
              }}
            />

          </PageSection>

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

    </Box>

  );

}

export default connect(state => ({ auth: state.auth }))(ViewerForm);
