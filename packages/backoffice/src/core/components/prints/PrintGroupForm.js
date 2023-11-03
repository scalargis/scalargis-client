import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withRouter  } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { TabMenu } from 'primereact/tabmenu';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import {Checkbox} from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { ToggleButton } from 'primereact/togglebutton';
import { MultiSelect } from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';

import GeometryFilterEditor from "./GeometryFilterEditor";
import PrintLayoutsEditor from "./PrintLayoutsEditor";
import FormFieldsEditor from "../common/FormFieldsEditor";
import PrintGroupChildsEditor from "../common/PrintGroupChildsEditor";

import { classNames } from 'primereact/utils';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { isAdminOrManager } from '../../utils';


const buildScaleList = (list1, list2) => {
  const list = [...new Set([...(list1 || []) ,...(list2 || [])])].sort((a, b)=>{return a-b});
  return list;
}

const sortRolesArray = (data) => {
  if (!data) return data;

  return data.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
}

const tabItems = [
  { label: 'Dados Base', icon: 'pi pi-fw pi-home' },
  { label: 'Formulário', icon: 'pi pi-fw pi-home' },
  { label: 'Layouts', icon: 'pi pi-fw pi-home' },
  { label: 'Plantas e Grupos', icon: 'pi pi-fw pi-cog' },  
];

const pageFormatList = ['A4', 'A3', 'A2', 'A1', 'A0'];
const pageOrientationList = ['Retrato', 'Paisagem'];

function PrintGroupForm(props) {

  const {
    history,
    dispatch
  } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeIndex, setActiveIndex] = useState(0);

  const [data, setData] = useState(props.data);

  const [roles, setRoles] = useState(props?.data?.roles ? sortRolesArray([...props.data.roles]) : []);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState(null);
  const [removedRoles, setRemovedRoles] = useState(null);
  const [filterRolesValue, setFilterRolesValue] = useState('');

  const [availableUsers, setAvailableUsers] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(data?.owner ? { id: data.owner.id, username: data.owner.username, name: data.owner.name, active: data.owner.active } : null);

  const [coordinateSystems, setCoordinateSystems] = useState([]);

  const [printsList, setPrintsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  
  const [scaleList, setScaleList] = useState(buildScaleList([1000,2000,5000,10000,20000,25000,50000], data.restrict_scales_list));

  const [formFields, setFormFields] = useState(props.data?.form_fields || { fields: {}, groups:{} });
  const [layouts, setLayouts] = useState(props.data?.layouts || []);
  const [groupChilds, setGroupChilds] = useState({ prints: props.data?.prints || [], groups: props.data?.groups || [] });
  const [geometryFilter, setGeometryFilter] = useState();

  const toast = useRef(null);
  const op = useRef(null);

  const { core } = useContext(AppContext);

  const adminOrManager = isAdminOrManager(props.auth);

  const API_URL = core.API_URL;

  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {
      id: data.id,
      code: data.code,
      title: data.title,
      description: data.description,
      //form_fields: data.form_fields,
      free_scale: data.free_scale,
      is_active: data.is_active,
      //layouts: data.layouts,
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
      group_prints:data.group_prints,
      show_all_prints: data.show_all_prints,
      //tolerance_filter: data.tolerance_filter      
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
      dataProvider(API_URL + '/security').getList('roles', params).catch((error) => error),
      dataProvider(API_URL + '/security').getList('users', params).catch((error) => error),
      dataProvider(API_URL + '/portal').getList('prints', params).catch((error) => error),
      dataProvider(API_URL + '/portal').getList('prints/groups', params_groups).catch((error) => error)
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
    }).catch((error) => {
      console.log(error)
    });
    
  }, []);

  const addRoles = () => {
    if (!availableRoles) return;
    
    const new_roles = availableRoles.filter(v => selectedRoles.includes(v.id));
    const new_available_roles = availableRoles.filter(v => !selectedRoles.includes(v.id));

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

    let new_data = {
      ...formData,
      form_fields: formFields ? {...formFields}  : {},
      layouts: layouts ? [...layouts] : [],
      prints: groupChilds?.prints ? groupChilds.prints : [],
      groups: groupChilds?.groups ? groupChilds.groups : []
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
      provider.update('prints/groups', params).then(d => {       
        toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});
        setLayouts(d?.data ? [...(d.data.layouts || [])] : []);
      }).catch(e => {
        toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: 'Ocorreu um erro ao alterar o registo'});        
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('prints/groups', params).then(d => {
        setData({...data, id: d.data.id});
        setLayouts(d?.data ? [...(d.data.layouts || [])] : []);
        toast.current.show({life: 5000, severity: 'success', summary: 'Criar Registo', detail: 'Registo criada com sucesso'});
      }).catch(e => {
        toast.current.show({life: 5000, severity: 'error', summary: 'Criar Registo', detail: 'Ocorreu um erro ao criar o registo'});
      }).finally(() => {
        setIsSaving(false);
      });       
    }

  };

  const getFormErrorMessage = (errors, name) => {
    if (errors && errors[name]) {
      if (errors[name].type === 'maxLength') {
         return <small className="p-error">O número de caracteres é superior à dimensão máxima permitida</small>
      } else if (errors[name].type === 'pattern') {
        return <small className="p-error">Formato não permitido</small>
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
    <React.Fragment>      

      <TabMenu model={tabItems} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} />

      <OverlayPanel ref={op} showCloseIcon dismissable>
          <div className="p-fluid p-grid">
            <label>Adicionar escala</label>
            <InputMask id="addScale" 
              onChange={(e) => { 
                if (e.originalEvent.key === 'Enter' || e.originalEvent.keyCode === 13) {
                    if (e.value) {
                      setScaleList([...scaleList, e.value].sort((a, b)=>{return a-b}));
                      op.current.hide();
                    }
                }
              }}
              mask="1:9?99999999" unmask={true} autoClear={false} />
          </div>
      </OverlayPanel> 

      <form onSubmit={handleSubmit(onSubmit)}>

        <Toast ref={toast} baseZIndex={2000} />       

        {activeIndex === 0 ?

          <div className="card">

            <div className="p-fluid p-formgrid p-grid">

              <div className="p-field p-col-1">
                <label htmlFor="id">Id</label>
                <InputText id="id" type="text" value={data.id || ''} />
              </div>

              <div className="p-field p-col-12 p-md-2">
                <label htmlFor="code">Código</label>        
                <InputText id="code" name="code" {...register('code', { required: 'Campo obrigatório.' })} autoFocus className={classNames({ 'p-invalid': errors.code })} />
                {getFormErrorMessage(errors, 'code')}
                {/*{errors.name && <span>This field is required</span>}*/}
              </div>

              <div className="p-field p-col-12 p-md-7">
                <label htmlFor="name">Título</label>        
                <InputText id="title" name="title" {...register('title', { required: 'Campo obrigatório.' })} autoFocus className={classNames({ 'p-invalid': errors.title })} />
                {getFormErrorMessage(errors, 'title')}       
              </div>              

              <div className="p-field p-col-12 p-md-2">
                <label>&nbsp;</label>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => {
                    return <ToggleButton {...field} checked={field.value} onChange={(e) => field.onChange(e.target.value)} onLabel="Grupo Ativo" offLabel="Grupo Não Ativo" onIcon="pi pi-check" offIcon="pi pi-times" />
                  }} 
                />                 
              </div>



              <div className="p-field p-col-12 p-md-12">
                <label htmlFor="name">Descrição</label>        
                <InputText id="description" name="description" {...register('description')} />   
              </div>

              <div className="p-field p-col-12 p-md-6">
                <Panel header="Opções de Escalas">
                  <div className="p-grid">
                    <div className="p-col p-field p-mt-2">
                      <Controller name="free_scale" control={control}
                        render={({ field }) => {                      
                          return <Checkbox id="free_scale" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}                    
                      />                            
                      <label htmlFor="map_scale" className="p-checkbox-label" style={{display: "inline"}}>Escala livre</label>
                    </div>
                    <div className="p-col p-field p-mt-2">
                      <Controller name="map_scale" control={control}
                        render={({ field }) => {                      
                          return <Checkbox id="map_scale" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}                    
                      />                            
                      <label htmlFor="map_scale" className="p-checkbox-label" style={{display: "inline"}}>Escala do mapa</label>
                    </div>                    
                  </div>
                  <div className="p-grid">
                    <div className="p-col p-field p-mt-3">
                      <Controller name="restrict_scales" control={control}
                        render={({ field }) => {                      
                          return <Checkbox id="restrict_scales" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}                    
                      />
                      <label htmlFor="cb1" className="p-checkbox-label" style={{display: "inline"}}>Escalas restritas</label>
                    </div>
                    {restrictScales && (
                    <div className="p-col p-field p-mt-2">
                      <div className="p-inputgroup"> 
                        <Controller name="restrict_scales_list" control={control}
                          render={({ field }) => {                                                  
                            return <MultiSelect id="restrict_scales_list"
                              {...field}
                              value={field.value}
                              options={scaleList.map(s => {return {value: s, name: '1:' + s}})}
                              onChange={(e) => field.onChange(e.value)}
                              optionValue="value" optionLabel="name"
                              selectedItemsLabel="{0} escalas selecionadas" />                          
                          }}
                        />
                        <Button type="button" icon="pi pi-ellipsis-v" className="p-button-primary" 
                          onClick={(e) => op.current.toggle(e)} />
                      </div>                           
                    </div>
                    )}                                       
                  </div>
                </Panel>

                <Panel header="Marcação de local e geometrias" className="p-mt-2">
                  <div className="p-grid">
                    <div className="p-col p-field p-mt-2">
                      <Controller name="allow_drawing" control={control}
                        render={({ field }) => {
                          return <Checkbox id="allow_drawing" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}
                      />
                      <label htmlFor="allow_drawing" className="p-checkbox-label" style={{display: "inline"}}>Permitir desenhar</label>
                    </div>
                    <div className="p-col p-field p-mt-2">
                      <Controller name="location_marking" control={control}
                        render={({ field }) => {
                          return <Checkbox id="location_marking" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}
                      />
                      <label htmlFor="location_marking" className="p-checkbox-label" style={{display: "inline"}}>Obrigatório marcar local</label>
                    </div>
                  </div>
                  <div className="p-grid">
                    <div className="p-col p-field p-mt-2">
                      <Controller name="draw_location" control={control}
                        render={({ field }) => {
                          return <Checkbox id="draw_location" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}
                      />
                      <label htmlFor="cb1" className="p-checkbox-label" style={{display: "inline"}}>Desenhar local</label>
                    </div>
                    <div className="p-col p-field p-mt-2">
                      <Controller name="multi_geom" control={control}
                        render={({ field }) => {                      
                          return <Checkbox id="multi_geom" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}                    
                      />
                      <label htmlFor="cb1" className="p-checkbox-label" style={{display: "inline"}}>Múltiplas geometrias</label>
                    </div>
                  </div>
                </Panel>                 

              </div>

              <div className="p-field p-col-12 p-md-6">
                <Panel header="Filtro Geográfico">
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
                </Panel>

                <Panel header="Opções de Grupo" className="p-mt-2">
                  <div className="p-grid">
                    <div className="p-col p-field p-mt-2">
                      <Controller name="select_prints" control={control}
                        render={({ field }) => {                      
                          return <Checkbox id="select_prints" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}                    
                      />                            
                      <label htmlFor="select_prints" className="p-checkbox-label" style={{display: "inline"}}>Permitir selecionar plantas</label>
                    </div>
                    <div className="p-col p-field p-mt-2">
                      <Controller name="group_prints" control={control}
                        render={({ field }) => {                      
                          return <Checkbox id="group_prints" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}                    
                      />
                      <label htmlFor="group_prints" className="p-checkbox-label" style={{display: "inline"}}>Agrupar plantas</label>
                    </div>
                  </div>
                  <div className="p-grid">
                    <div className="p-col p-field p-mt-2">
                      <Controller name="show_all_prints" control={control}
                        render={({ field }) => {                      
                          return <Checkbox id="show_all_prints" {...field} onChange={(e) => field.onChange(!e.value)} checked={field.value} className="p-mr-2" style={{float: "left"}} />
                        }}                    
                      />                            
                      <label htmlFor="show_all_prints" className="p-checkbox-label" style={{display: "inline"}}>Mostar filhos vazios</label>
                    </div>
                  </div>                  
                </Panel>
              </div>              

            </div>  

          </div>     

        : null}

        {activeIndex === 1 ?

          <div className="card">

            <FormFieldsEditor data={formFields} onChange={(data) => {
              setFormFields(data);
            }} />

          </div>

        : null}          
          
        {activeIndex === 2 ?

          <div className="card">

            <div className="p-fluid p-formgrid p-grid">
              <PrintLayoutsEditor data={layouts}
                pageFormatList={pageFormatList} pageOrientationList={pageOrientationList}
                onChange={(data) => {
                  setLayouts(data);
                }}
              />
            </div>

          </div>

        : null}

        {activeIndex === 3 ?

          <div className="card">

            <PrintGroupChildsEditor 
              data={groupChilds} 
              printsList={printsList}
              groupsList={data.id ? groupsList.filter(g=>g.id !== data.id) : groupsList}
              onChange={(data) => {
                setGroupChilds(data);
              }} 
            />

          </div>

        : null}        


        <Toolbar className="p-mt-4 p-mb-4" right={rightToolbarTemplate}></Toolbar>        

      </form>


    </React.Fragment>

  );

}

export default connect(state => ({ auth: state.auth }))(withRouter(PrintGroupForm));