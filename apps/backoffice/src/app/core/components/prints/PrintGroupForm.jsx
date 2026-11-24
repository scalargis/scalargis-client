import React, { useContext, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Grid,
  Group,
  MultiSelect,
  NumberInput,
  Popover,
  Switch,
  Tabs,
  TextInput,
} from '@mantine/core';
import { CollapsiblePanel, notify, TabPanel, IconEllipsisV, IconArrowLeft, IconSave, IconHome, IconCog, IconHistory } from '@scalargis/ui';

import GeometryFilterEditor from "./GeometryFilterEditor";
import PrintLayoutsEditor from "./PrintLayoutsEditor";
import FormFieldsEditor from "../common/FormFieldsEditor";
import PrintGroupChildsEditor from "../common/PrintGroupChildsEditor";

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { useRecordNavigation } from '../common/useRecord';
import { useChangeSummary } from '../common/ChangeSummary';
import { useRecordHistory } from '../common/RecordHistory';
import { scalesToArray } from '../common/utils';
import PageSection from '../common/PageSection';


const buildScaleList = (list1, list2) => {
  const list = [...new Set([...(list1 || []) ,...(list2 || [])])].sort((a, b)=>{return a-b});
  return list;
}

const tabItems = [
  { value: 'base', label: 'Dados Base', icon: IconHome },
  { value: 'form', label: 'Formulário', icon: IconHome },
  { value: 'layouts', label: 'Layouts', icon: IconHome },
  { value: 'childs', label: 'Plantas e Grupos', icon: IconCog }
];

const HISTORY_TAB = { value: 'history', label: 'Histórico', icon: IconHistory };

const pageFormatList = ['A4', 'A3', 'A2', 'A1', 'A0'];
const pageOrientationList = ['Retrato', 'Paisagem'];

function PrintGroupForm(props) {

  const {
    dispatch
  } = props;

  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('base');

  const [data, setData] = useState(props.data);

  const [printsList, setPrintsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);

  const [scaleList, setScaleList] = useState(buildScaleList([1000,2000,5000,10000,20000,25000,50000], data.restrict_scales_list));

  // The Prime OverlayPanel scale adder, as a Popover on the ellipsis button.
  const [scalePickerOpened, setScalePickerOpened] = useState(false);
  const [newScale, setNewScale] = useState('');

  const [formFields, setFormFields] = useState(props.data?.form_fields || { fields: {}, groups:{} });
  const [layouts, setLayouts] = useState(props.data?.layouts || []);
  const [groupChilds, setGroupChilds] = useState({ prints: props.data?.prints || [], groups: props.data?.groups || [] });
  const [geometryFilter, setGeometryFilter] = useState();

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue, getValues } = useForm({
    defaultValues: {
      id: data.id,
      code: data.code,
      title: data.title,
      description: data.description,
      free_scale: data.free_scale,
      is_active: data.is_active,
      allow_drawing: data.allow_drawing,
      draw_location: data.draw_location,
      location_marking: data.location_marking,
      map_scale: data.map_scale,
      multi_geom: data.multi_geom,
      owner_id: data.owner_id,
      payment_reference: data.payment_reference,
      print_purpose: data.print_purpose,
      restrict_scales: data.restrict_scales,
      restrict_scales_list: data.restrict_scales_list,
      show_author: data.show_author,
      select_prints: data.select_prints,
      group_prints: data.group_prints,
      show_all_prints: data.show_all_prints
    }
  });

  const restrictScales = watch("restrict_scales");

  useEffect(() => {
    const params = {
      pagination: { page: 1, perPage: 1000},
      sort: { field: 'name', order: 'Asc' },
      filter: {}
    }

    const params_groups = {
      pagination: { page: 1, perPage: 1000},
      sort: { field: 'title', order: 'Asc' },
      filter: {}
    }

    Promise.all([
      dataProvider(API_URL + '/portal').getList('prints', params).catch((error) => error),
      dataProvider(API_URL + '/portal').getList('prints/groups', params_groups).catch((error) => error)
    ]).then((result) => {
      const prints_result = result[0]?.data || [];
      setPrintsList(prints_result);
      const groups_result = result[1]?.data || [];
      setGroupsList(groups_result);
    }).catch((error) => {
      console.log(error)
    });

  }, []);

  const addScaleFromPicker = () => {
    const value = typeof newScale === 'number' ? newScale : null;
    if (value) {
      setScaleList(buildScaleList(scaleList, [value]));
      setNewScale('');
      setScalePickerOpened(false);
    }
  }

  const { goBack, openCreated } = useRecordNavigation('/prints/groups');

  const buildData = (formData, geometry, nextLayouts = layouts) => {

    let new_data = {
      ...formData,
      form_fields: formFields ? {...formFields}  : {},
      layouts: nextLayouts ? [...nextLayouts] : [],
      prints: groupChilds?.prints ? groupChilds.prints : [],
      groups: groupChilds?.groups ? groupChilds.groups : []
    }

    if (geometry) {
      new_data = {
        ...new_data,
        ...geometry
      }
    }

    return new_data;
  };

  const savedGeometry = {
    geom_filter: data.geom_filter,
    geom_filter_srid: data.geom_filter_srid,
    tolerance_filter: data.tolerance_filter
  };

  const summary = useChangeSummary({
    record: data,
    initialPayload: () => buildData(getValues(), savedGeometry),
    save: (payload) => dataProvider(API_URL + '/portal').update('prints/groups', { id: data.id, data: payload }),
    onSaved: (d, payload) => {
      const savedLayouts = d?.data ? [...(d.data.layouts || [])] : [];
      setLayouts(savedLayouts);
      return { ...payload, layouts: savedLayouts };
    },
    onReload: props.onReload
  });

  const history = useRecordHistory({
    url: data.id ? `${API_URL}/portal/prints/groups/${data.id}/history` : null,
    savedCount: summary.savedCount,
    current: () => buildData(getValues(), geometryFilter || savedGeometry),
    fromSnapshot: (snapshot) => {
      const s = scalesToArray({ ...snapshot });
      const values = {};
      Object.keys(getValues()).forEach((k) => { values[k] = s[k] ?? null; });
      if ('config_json' in values) {
        values.config_json = s.config_json && typeof s.config_json === 'object' ? JSON.stringify(s.config_json) : (s.config_json || '');
      }
      return {
        ...values,
        form_fields: s.form_fields || { fields: {}, groups: {} },
        layouts: s.layouts || [],
        prints: (s.prints || []).map((id) => printsList.find((p) => p.id === id) || { id }),
        groups: (s.groups || []).map((id) => groupsList.find((g) => g.id === id) || { id }),
        geom_filter: s.geom_filter ?? null,
        geom_filter_srid: s.geom_filter_srid ?? null,
        tolerance_filter: s.tolerance_filter ?? null
      };
    },
    onRestore: (p) => {
      Object.keys(getValues()).forEach((k) => setValue(k, p[k], { shouldDirty: true }));
      setScaleList(buildScaleList(scaleList, p.restrict_scales_list || []));
      setFormFields(p.form_fields);
      setLayouts(p.layouts);
      setGroupChilds({ prints: p.prints, groups: p.groups });
      setGeometryFilter({ geom_filter: p.geom_filter, geom_filter_srid: p.geom_filter_srid, tolerance_filter: p.tolerance_filter });
    }
  });

  const onInvalid = () => {
    setActiveTab('base');
    notify.error(data.id ? 'Editar Registo' : 'Criar Registo', 'Preencha os campos obrigatórios em Dados Base');
  };

  const save = (nextLayouts) => handleSubmit((formData) => onSubmit(formData, nextLayouts), onInvalid);

  const onSubmit = (formData, nextLayouts) => {
    const new_data = buildData(formData, geometryFilter, nextLayouts);

    if (data.id) {
      summary.submit(new_data);
    } else {
      setIsSaving(true);
      const provider = dataProvider(API_URL + '/portal');
      const params = {
        data: {...new_data}
      }
      provider.create('prints/groups', params).then(d => {
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
    <React.Fragment>

      <Tabs value={activeTab} onChange={(value) => value && setActiveTab(value)}>
        <Tabs.List>
          {(data.id ? [...tabItems, HISTORY_TAB] : tabItems).map((item) => (
            <Tabs.Tab key={item.value} value={item.value} leftSection={<item.icon fixedWidth />}>
              {item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <form onSubmit={save()}>

        {history.notice}

        <TabPanel active={activeTab === 'base'} mount="eager">

          <PageSection>

            <Grid gap="sm">

              <Grid.Col span={{ base: 12, md: 1 }}>
                <TextInput id="id" label="Id" value={data.id || ''} readOnly />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 2 }}>
                <TextInput id="code" label="Código" autoFocus
                  error={fieldError(errors, 'code')}
                  {...register('code', { required: 'Campo obrigatório.' })} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 7 }}>
                <TextInput id="title" label="Título"
                  error={fieldError(errors, 'title')}
                  {...register('title', { required: 'Campo obrigatório.' })} />
              </Grid.Col>

              <Grid.Col ta="center" span={{ base: 12, md: 2 }}>
                <Box component="label" display="block">&nbsp;</Box>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <Switch
                      size="md"
                      style={{ display: 'inline-block' }}
                      label={field.value ? 'Grupo Ativo' : 'Grupo Não Ativo'}
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.currentTarget.checked)}
                    />
                  )}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <TextInput id="description" label="Descrição" {...register('description')} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <CollapsiblePanel header="Opções de Escalas" toggleable={false}>
                  <Grid gap="sm">
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="free_scale" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="free_scale" label="Escala livre"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="map_scale" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="map_scale" label="Escala do mapa"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                  </Grid>
                  <Grid gap="sm">
                    <Grid.Col span="auto" mt="xs" mb={restrictScales ? 0 : "md"}>
                      <Controller name="restrict_scales" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="restrict_scales" label="Escalas restritas"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                    {restrictScales && (
                    <Grid.Col mt="xs" span="auto" style={{"overflow": "auto"}}>
                      <Group gap="xs" align="flex-end" wrap="nowrap">
                        <Controller name="restrict_scales_list" control={control}
                          render={({ field }) => (
                            <MultiSelect id="restrict_scales_list"
                              data={scaleList.map(s => ({ value: String(s), label: '1:' + s }))}
                              value={(field.value || []).map(String)}
                              onChange={(values) => field.onChange(values.map(Number))}
                              style={{ flex: 1 }}
                              searchable clearable />
                          )}
                        />
                        <Popover
                          opened={scalePickerOpened}
                          onChange={setScalePickerOpened}
                          width={260}
                          position="bottom-end"
                          shadow="md"
                          withArrow
                          trapFocus
                        >
                          <Popover.Target>
                            <ActionIcon type="button" size="input-md" aria-label="Adicionar escala" title="Adicionar escala"
                              onClick={() => setScalePickerOpened((o) => !o)}>
                              <IconEllipsisV />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <NumberInput label="Adicionar escala" prefix="1:" hideControls
                              allowNegative={false} allowDecimal={false}
                              value={newScale}
                              onChange={setNewScale}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addScaleFromPicker();
                                }
                              }} />
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    </Grid.Col>
                    )}
                  </Grid>
                </CollapsiblePanel>

                <CollapsiblePanel header="Marcação de local e geometrias" toggleable={false} mt="xs">
                  <Grid gap="sm">
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="allow_drawing" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="allow_drawing" label="Permitir desenhar"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="location_marking" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="location_marking" label="Obrigatório marcar local"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                  </Grid>
                  <Grid gap="sm">
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="draw_location" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="draw_location" label="Desenhar local"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="multi_geom" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="multi_geom" label="Múltiplas geometrias"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                  </Grid>
                </CollapsiblePanel>

              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <CollapsiblePanel header="Filtro Geográfico" toggleable={false}>
                  <GeometryFilterEditor
                    data={
                      (
                        geometryFilter ?
                        {
                          geometryWKT: geometryFilter.geom_filter,
                          geometrySRID: geometryFilter.geom_filter_srid,
                          tolerance: geometryFilter.tolerance_filter
                        } :
                        {
                          geometryWKT: props.data?.geom_filter,
                          geometrySRID: props.data?.geom_filter_srid,
                          tolerance: props.data?.tolerance_filter
                        }
                      )
                    }
                    coordinateSystems={props.coordinateSystems}
                    onSave={ data => {
                      const filter = {
                        geom_filter: data.geometryWKT,
                        geom_filter_srid: data.geometrySRID,
                        tolerance_filter: data.tolerance
                      }
                      setGeometryFilter(filter);
                    }}
                  />
                </CollapsiblePanel>

                <CollapsiblePanel header="Opções de Grupo" toggleable={false} mt="xs">
                  <Grid gap="sm">
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="select_prints" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="select_prints" label="Permitir selecionar plantas"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="group_prints" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="group_prints" label="Agrupar plantas"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                  </Grid>
                  <Grid gap="sm">
                    <Grid.Col mt="xs" span="auto">
                      <Controller name="show_all_prints" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="show_all_prints" label="Mostar filhos vazios"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </Grid.Col>
                  </Grid>
                </CollapsiblePanel>
              </Grid.Col>

            </Grid>

          </PageSection>

        </TabPanel>

        {activeTab === 'form' ?

          <PageSection>

            <FormFieldsEditor data={formFields} onChange={(data) => {
              setFormFields(data);
            }} />

          </PageSection>

        : null}

        {activeTab === 'layouts' ?

          <PageSection>

              <PrintLayoutsEditor data={layouts}
                pageFormatList={pageFormatList} pageOrientationList={pageOrientationList}
                onChange={(data) => {
                  setLayouts(data);
                }}
                onSave={(data) => save(data)()}
              />

          </PageSection>

        : null}

        {activeTab === 'childs' ?

          <PageSection>

            <PrintGroupChildsEditor
              data={groupChilds}
              printsList={printsList}
              groupsList={data.id ? groupsList.filter(g=>g.id !== data.id) : groupsList}
              onChange={(data) => {
                setGroupChilds(data);
              }}
            />

          </PageSection>

        : null}

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


    </React.Fragment>

  );

}

export default connect(state => ({ auth: state.auth }))(PrintGroupForm);
