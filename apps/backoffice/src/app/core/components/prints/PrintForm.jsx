import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Input,
  MultiSelect,
  NumberInput,
  Popover,
  Select,
  Switch,
  Tabs,
  TextInput
} from '@mantine/core';
import { CodeEditor, CollapsiblePanel, notify, TabPanel } from '@scalargis/ui';

import GeometryFilterEditor from "./GeometryFilterEditor";
import FormFieldsEditor from "../common/FormFieldsEditor";
import PrintLayoutsEditor from "./PrintLayoutsEditor";

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';

const buildScaleList = (list1, list2) => {
  const list = [...new Set([...(list1 || []) ,...(list2 || [])])].sort((a, b)=>{return a-b});
  return list;
}

const tabItems = [
  { value: 'base', label: 'Dados Base', icon: 'pi pi-fw pi-home' },
  { value: 'config', label: 'Configuração', icon: 'pi pi-fw pi-cog' },
  { value: 'form', label: 'Formulário', icon: 'pi pi-fw pi-home' },
  { value: 'layouts', label: 'Layouts', icon: 'pi pi-fw pi-home' }
];

const pageFormatList = ['A4', 'A3', 'A2', 'A1', 'A0'];
const pageOrientationList = ['Retrato', 'Paisagem'];

function PrintForm(props) {

  // Routing
  const location = useLocation();
  const navigate = useNavigate();

  const {
    dispatch
  } = props;

  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('base');

  const configEditorRef = useRef(null);

  const [data, setData] = useState(props.data);

  const [coordinateSystems, setCoordinateSystems] = useState(null);

  const [scaleList, setScaleList] = useState(buildScaleList([1000,2000,5000,10000,20000,25000,50000], data.restrict_scales_list));

  // The Prime OverlayPanel scale adder, as a Popover on the ellipsis button.
  const [scalePickerOpened, setScalePickerOpened] = useState(false);
  const [newScale, setNewScale] = useState('');

  const [formFields, setFormFields] = useState(props.data?.form_fields || { fields: {}, groups:{} });
  const [layouts, setLayouts] = useState(props.data?.layouts || []);
  const [geometryFilter, setGeometryFilter] = useState();

  const { core } = useContext(AppContext);

  const API_URL = core.API_URL;


  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {
      id: data.id,
      code: data.code,
      config_json: typeof (data.config_json || '') === "object" ? JSON.stringify(data.config_json) : data?.config_json || '',
      description: data.description,
      allow_drawing: data.allow_drawing,
      draw_location: data.draw_location,
      format: data.format,
      free_printing: data.free_printing,
      free_scale: data.free_scale,
      is_active: data.is_active,
      location_marking: data.location_marking,
      map_scale: data.map_scale,
      multi_geom: data.multi_geom,
      name: data.name,
      orientation: data.orientation,
      owner_id: data.owner_id,
      payment_reference: data.payment_reference,
      print_purpose: data.print_purpose,
      restrict_scales: data.restrict_scales,
      restrict_scales_list: data.restrict_scales_list,
      scale: data.scale,
      show_author: data.show_author,
      srid: data.srid,
      title: data.title
    }
  });

  const restrictScales = watch("restrict_scales");

  useEffect(() => {
    const params = {
      pagination: { page: 1, perPage: 1000},
      sort: { field: 'name', order: 'Asc' },
      filter: {}
    }

    dataProvider(API_URL + '/portal/lists').getList('coordinate_systems', params).then((result) => {
      const crs_result = result?.data || [];
      setCoordinateSystems(crs_result.map( c => { return { value: parseInt(c.config_json.srid), label: c.config_json.title }; }));
    }).catch((error) => {
      console.log(error)
    });
  }, []);

  useEffect(() => {
    if (activeTab !== 'config') configEditorRef.current?.closeSearch();
  }, [activeTab]);

  const addScaleFromPicker = () => {
    const value = typeof newScale === 'number' ? newScale : null;
    if (value) {
      setScaleList(buildScaleList(scaleList, [value]));
      setNewScale('');
      setScalePickerOpened(false);
    }
  }

  const goBack = () => {
    const state = {
      searchParams: {...location.state.previousSearchParams}
    }
    navigate(location.state.from, { state });
  }

  const onSubmit = (formData) => {
    let new_data = {
      ...formData,
      form_fields: formFields ? {...formFields}  : {},
      layouts: layouts ? [...layouts]: []
    }

    if (geometryFilter) {
      new_data = {
        ...new_data,
        ...geometryFilter
      }
    }

    setIsSaving(true);

    const provider = dataProvider(API_URL + '/portal');
    if (data.id) {
      const params = {
        id: data.id,
        data: {...new_data}
      }
      provider.update('prints', params).then(d => {
        notify.success('Editar Registo', 'Registo alterado com sucesso');
        setLayouts(d?.data ? [...(d.data.layouts || [])] : []);
      }).catch(e => {
        notify.error('Editar Registo', 'Ocorreu um erro ao alterar o registo');
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('prints', params).then(d => {
        setData({...data, id: d.data.id});
        setLayouts(d?.data ? [...(d.data.layouts || [])] : []);
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
          {tabItems.map((item) => (
            <Tabs.Tab key={item.value} value={item.value} leftSection={<i className={item.icon} />}>
              {item.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <form onSubmit={handleSubmit(onSubmit)}>

        <TabPanel active={activeTab === 'base'} mount="eager">
        <div className="card">

            <div className="formgrid grid">

              <div className="field col-12 md:col-1">
                <TextInput id="id" label="Id" value={data.id || ''} readOnly />
              </div>

              <div className="field col-12 md:col-2">
                <TextInput id="code" label="Código" autoFocus
                  error={fieldError(errors, 'code')}
                  {...register('code', { required: 'Campo obrigatório.' })} />
              </div>

              <div className="field col-12 md:col-7">
                <TextInput id="name" label="Designação"
                  error={fieldError(errors, 'name')}
                  {...register('name', { required: 'Campo obrigatório.' })} />
              </div>

              <div className="field col-12 md:col-2 text-center">
                <label className="w-full block">&nbsp;</label>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <Switch
                      size="md"
                      style={{ display: 'inline-block' }}
                      label={field.value ? 'Planta Ativa' : 'Planta Não Ativa'}
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.currentTarget.checked)}
                    />
                  )}
                />
              </div>

              <div className="field col-12">
                <TextInput id="title" label="Título"
                  error={fieldError(errors, 'title')}
                  {...register('title', { required: 'Campo obrigatório.' })} />
              </div>

              <div className="field col-12">
                <TextInput id="description" label="Descrição" {...register('description')} />
              </div>

              <div className="field col-12 md:col-6">
                <div className="grid">
                  <div className="field col-12 md:col-4">
                    <Controller name="scale" control={control}
                      render={({ field }) => (
                        <NumberInput id="scale" label="Escala" hideControls
                          leftSection={<span aria-hidden="true" style={{ fontSize: 'var(--mantine-font-size-md)', color: 'var(--mantine-color-text)' }}>1:</span>} leftSectionWidth={28}
                          allowNegative={false} allowDecimal={false}
                          value={field.value ?? ''}
                          onChange={(value) => field.onChange(value === '' ? null : value)} />
                      )}
                    />
                  </div>
                  <div className="field col-12 md:col-4">
                    <Controller name="format" control={control}
                      render={({ field }) => (
                        <Select id="format" label="Formato"
                          data={pageFormatList.map(val=>{return {label: val, value: val}})}
                          value={field.value || null}
                          onChange={(value) => field.onChange(value)}
                          clearable />
                      )}
                    />
                  </div>
                  <div className="field col-12 md:col-4">
                    <Controller name="orientation" control={control}
                      render={({ field }) => (
                        <Select id="orientation" label="Orientação"
                          data={pageOrientationList.map(val=>{return {label: val, value: val}})}
                          value={field.value || null}
                          onChange={(value) => field.onChange(value)}
                          clearable />
                      )}
                    />
                  </div>
                  <div className="field col-12">
                    <Controller name="srid" control={control} rules={{ required: 'Campo obrigatório.' }}
                      render={({ field }) => (
                        <Select id="srid" label="Sistema de Coordenadas"
                          data={(coordinateSystems || []).map(c => ({ value: String(c.value), label: c.label }))}
                          value={field.value == null ? null : String(field.value)}
                          onChange={(value) => field.onChange(value == null ? null : Number(value))}
                          error={fieldError(errors, 'srid')} />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="field col-12 md:col-6">
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
              </div>

              <div className="field col-12 md:col-6">
                <CollapsiblePanel header="Opções de Escalas" toggleable={false}>
                  <div className="grid">
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="free_scale" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="free_scale" label="Escala livre"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="map_scale" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="map_scale" label="Escala do mapa"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid">
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="restrict_scales" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="restrict_scales" label="Escalas restritas"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                    {restrictScales && (
                    <div className="field col-12 md:col-6 mt-2">
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
                              <i className="pi pi-ellipsis-v" />
                            </ActionIcon>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <NumberInput label="Adicionar escala" hideControls
                              leftSection={<span aria-hidden="true" style={{ fontSize: 'var(--mantine-font-size-md)', color: 'var(--mantine-color-text)' }}>1:</span>} leftSectionWidth={28}
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
                    </div>
                    )}
                  </div>
                </CollapsiblePanel>
              </div>

              <div className="field col-12 md:col-6">
                <CollapsiblePanel header="Opções de impressão" toggleable={false}>
                  <div className="grid">
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="free_printing" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="free_printing" label="Emissão livre"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                  </div>
                </CollapsiblePanel>
              </div>

              <div className="field col-12 md:col-6">
                <CollapsiblePanel header="Marcação de local e geometrias" toggleable={false} className="mt-2">
                  <div className="grid">
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="allow_drawing" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="allow_drawing" label="Permitir desenhar"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="location_marking" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="location_marking" label="Obrigatório marcar local"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid">
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="draw_location" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="draw_location" label="Desenhar local"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                    <div className="field col-12 md:col-6 mt-2">
                      <Controller name="multi_geom" control={control}
                        render={({ field }) => (
                          <Checkbox size="md" id="multi_geom" label="Múltiplas geometrias"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.currentTarget.checked)} />
                        )}
                      />
                    </div>
                  </div>
                </CollapsiblePanel>
              </div>

            </div>

          </div>
        </TabPanel>

        <TabPanel active={activeTab === 'config'} mount="eager">
        <div className="card">

            <div className="field col-12">
              <Input.Label>Configuração</Input.Label>

                <Controller
                  control={control}
                  name="config_json"
                  render={({ field }) => {

                    return <CodeEditor
                      ref={configEditorRef}
                      language="json"
                      value={field.value}
                      onChange={field.onChange}
                      height="400px"
                      aria-label="Configuração"
                    />
                  }}
                />
            </div>

          </div>
        </TabPanel>

        <TabPanel active={activeTab === 'form'} mount="eager">
        <div className="card">

            <FormFieldsEditor data={formFields}
              onChange={(data) => {
              setFormFields(data);
              }}
            />

          </div>
        </TabPanel>

        <TabPanel active={activeTab === 'layouts'} mount="lazy">
        <div className="card">

              <PrintLayoutsEditor data={layouts}
                pageFormatList={pageFormatList} pageOrientationList={pageOrientationList}
                onChange={(data) => {
                  setLayouts(data);
                }}
              />
          </div>
        </TabPanel>

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


    </React.Fragment>

  );

}

export default connect(state => ({ auth: state.auth }))(PrintForm);
