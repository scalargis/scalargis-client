import React, { useContext, useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Toast } from 'primereact/toast';
import { TabMenu } from 'primereact/tabmenu';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Chips} from 'primereact/chips';
import { Button } from 'primereact/button';
import { ToggleButton } from 'primereact/togglebutton';
import { MultiSelect } from 'primereact/multiselect';
import { ListBox } from 'primereact/listbox';
import { Message } from 'primereact/message';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { BlockUI } from 'primereact/blockui';

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/mode-css";
import 'ace-builds/src-noconflict/ext-searchbox';

import { classNames } from 'primereact/utils';

import AppContext from '../../../AppContext';
import dataProvider from '../../../service/DataProvider';
import { isAdminOrManager } from '../../utils';

import PrintGroupChildsEditor from "../common/PrintGroupChildsEditor";


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
  { label: 'UI', icon: 'pi pi-fw pi-home' },
  { label: 'Configuração', icon: 'pi pi-fw pi-cog' },
  { label: 'Plantas', icon: 'pi pi-fw pi-print' }
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

  const [activeIndex, setActiveIndex] = useState(0);

  const [data, setData] = useState(props.data || {});

  const [configJson, setConfigJson] = useState(data?.config_json ? JSON.stringify(data.config_json, null, 2) : '{}');
  const [manifestJson, setManifestJson] = useState(data?.manifest_json ? JSON.stringify(data.manifest_json, null, 2) : null);
  const [customStyle, setCustomStyle] = useState(data?.custom_style ? data.custom_style : null);

  const [roles, setRoles] = useState(props?.data?.roles ? sortRolesArray([...props.data.roles]) : []);
  const [availableRoles, setAvailableRoles] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState(null);
  const [removedRoles, setRemovedRoles] = useState(null);
  const [filterRolesValue, setFilterRolesValue] = useState('');

  const [availableUsers, setAvailableUsers] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(data?.owner ? { id: data.owner.id, username: data.owner.username, name: data.owner.name, active: data.owner.active } : null);

  const [printsList, setPrintsList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [printChilds, setPrintChilds] = useState({ prints: props.data?.prints || [], groups: props.data?.print_groups || [] });


  const [customStyleEditorSearchText, setCustomStyleEditorSearchText] = useState(null);
  const [jsonConfigEditorSearchText, setJsonConfigEditorSearchText] = useState(null);  

  const toast = useRef(null);
  const op = useRef(null);
  const jsonManifestEditor = useRef(null);
  const customStyleEditor = useRef(null);
  const jsonConfigEditor = useRef(null);

  const { core } = useContext(AppContext);

  const adminOrManager = isAdminOrManager(props.auth);

  const API_URL = core.API_URL;

  /*
  const { register, control, handleSubmit, watch, formState: { errors }, setValue } = useForm({
    defaultValues: {name: props.data.name, title: props.data.title, slug: props.data.slug,
      keywords: props.data.keywords}
  });
  */
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
      //console.log(error)
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
    if (location?.state?.from) {
      /*
      const location = {
        pathname: history.location.state.from,
        state: { 
          searchParams: {...history.location.state.previousSearchParams}
        }
      }
      history.replace(location);
      */
      const state = { 
        searchParams: {...location.state.previousSearchParams}
      }
      navigate(location.state.from, { state });
    } else {
      //history.goBack();
      navigate(-1);
    }
  }  

  const onSubmit = (formData) => {
    let manifest_json = null;
    let config_json = null;

    try {
      manifest_json = manifestJson ?  JSON.parse(manifestJson) : null;
    } catch (e) {
        return false;
    }    

    try {
      config_json = JSON.parse(configJson);
    } catch (e) {
        return false;
    }

    const new_data = { 
      //...formData,
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
        toast.current.show({life: 3000, severity: 'success', summary: 'Editar Registo', detail: 'Registo alterado com sucesso'});

      }).catch(e => {
        toast.current.show({life: 3000, severity: 'error', summary: 'Editar Registo', detail: 'Ocorreu um erro ao alterar o registo'});        
      }).finally(() => {
        setIsSaving(false);
      });
    } else {
      const params = {
        data: {...new_data}
      }
      provider.create('viewers', params).then(d => {
        setData({...data, id: d.data.id});
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

      <BlockUI blocked={isLoading}
        template={<i className="p-blockui-loading-icon pi-spin pi pi-spinner"></i>} >

        <TabMenu model={tabItems} activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} />

        <form onSubmit={handleSubmit(onSubmit)}>

          <Toast ref={toast} baseZIndex={2000} />

          {activeIndex === 0 ?

            <div className="card">

              <div className="p-fluid p-formgrid p-grid">

                <div className="p-field p-col-3">
                  <label htmlFor="id">Id</label>
                  <InputText id="id" type="text" value={data.id || ''} />
                </div>

                <div className="p-field p-col-4">
                  <label>&nbsp;</label>
                  <Controller
                    control={control}
                    name="is_active"
                    render={({ field }) => {
                      return <ToggleButton {...field} checked={field.value} onChange={(e) => field.onChange(e.target.value)} onLabel="Mapa Ativo" offLabel="Mapa Não Ativo" onIcon="pi pi-check" offIcon="pi pi-times" />
                    }} 
                  />                   
                </div>
                
                { adminOrManager &&
                <div className="p-field p-col-4">
                  <label>Dono</label>
                  <div>                
                      <div className="p-inputgroup">
                        { selectedOwner?.id > 0 ?
                          <React.Fragment>
                            <span className="p-inputgroup-addon"><i className={ selectedOwner.active ? "fas fa-user-alt" : "fas fa-user-alt-slash" }></i></span>
                            <span className="p-inputgroup-addon">{selectedOwner.name} ({selectedOwner.username})</span>
                          </React.Fragment>
                          :
                          <React.Fragment>
                            <span className="p-inputgroup-addon"><i className="far fa-user"></i></span>
                            <span className="p-inputgroup-addon">Anómimo</span>
                          </React.Fragment>
                        }
                        <Button type="button" tooltip="Alterar" icon="fas fa-user-edit" className="p-button-primary"
                          onClick={(e) => { op.current.toggle(e); }}/>
                        
                        { (selectedOwner?.id > 0) &&
                          <Button type="button" icon="pi pi-times" className="p-button-danger" 
                            onClick={(e) => { setSelectedOwner(null); }} />
                        }

                        <OverlayPanel ref={op} showCloseIcon id="overlay_panel" breakpoints={{'960px': '75vw', '640px': '100vw'}} style={{width: '450px'}} className="overlaypanel-demo">
                          <div className="p-fluid">
                              <div className="p-field">
                                  <label htmlFor="observacoes">Utilizadores</label>
                                  <DataTable value={availableUsers} selectionMode="single" paginator rows={10}
                                    selection={selectedOwner}
                                    onSelectionChange={ e=> { setSelectedOwner({...e.value}); op.current.hide(); }}>
                                    <Column field="username" header="Username" sortable filter filterMatchMode="contains" />
                                    <Column field="name" header="Nome" sortable filter filterMatchMode="contains" />
                                </DataTable>                                
                              </div>              
                          </div>
                        </OverlayPanel>

                      </div>
                  </div>
                </div>
                }              

                <div className="p-field p-col-12 p-md-6">
                  <label htmlFor="name">Designação</label>        
                  <InputText id="name" name="name" {...register('name', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.name })} />
                  {getFormErrorMessage(errors, 'name')}
                  {/*{errors.name && <span>This field is required</span>}*/}
                </div>

                <div className="p-field p-col-12 p-md-6">
                  <label htmlFor="name">Título</label>        
                  <InputText id="title" name="title" {...register('title', { required: 'Campo obrigatório.' })} className={classNames({ 'p-invalid': errors.title })} />
                  {getFormErrorMessage(errors, 'title')}       
                </div>          

                <div className="p-field p-col-12 p-md-6">
                  <label htmlFor="slug">Slug</label>
                  <InputText id="slug" name="slug" {...register('slug')} />
                </div>

                <div className="p-field p-col-6">
                  <label htmlFor="tags">Tags</label>
                  <Controller name="keywords" control={control} defaultValue={data.keywords} render={(props) => (
                      <Chips id="keywords" value={props.field.value} onChange={(e) => props.field.onChange(e.value) } />
                  )} />            
                </div>            

                <div className="p-field p-col-12 p-md-6">
                  <label>Perfis</label>
                  <div className="p-card p-p-2">
                    { (availableRoles && availableRoles.length > 0) && 
                    <>
                    <div className="p-field p-col-12 p-pl-0">
                      <MultiSelect value={selectedRoles} options={availableRoles} 
                        optionLabel="name" optionValue="id" display="chip" showClear 
                        filter filterValue={filterRolesValue} 
                        onFilterValueChange={(e) => setFilterRolesValue(e.value)}
                        onChange={(e) => setSelectedRoles(e.value)} placeholder="Selecionar" />
                    </div>              
                    <div className="p-grid">
                      <div className="p-col"></div>
                      <div className="p-col">
                          <Button label="Adicionar" type="button" 
                            disabled={(!selectedRoles || selectedRoles.length === 0)}
                          onClick={addRoles} />
                      </div>
                      <div className="p-col"></div>
                    </div>
                    </>
                    }
                    { (roles && roles.length > 0) ?
                      <>        
                      <div className="p-field p-col-12 p-pl-0 p-pt-2">
                        <ListBox optionLabel="name" optionValue="id" className="p-p-1"
                          options={roles} value={removedRoles}
                          onChange={(e) => setRemovedRoles(e.value)} multiple />
                      </div>
                      <div className="p-grid">
                        <div className="p-col"></div>
                        <div className="p-col">
                          <Button label="Remover" type="button" 
                          disabled={(!removedRoles || removedRoles.length === 0)}
                          onClick={removeRoles} />
                        </div>
                        <div className="p-col"></div>
                      </div>
                      </> :
                      <div className="p-grid p-justify-center">
                        <div className="p-col-12 p-mt-4 p-mb-2">
                          <Message severity="warn" text="Adicione um ou mais Perfis" />
                        </div>
                      </div>
                    }
                  </div>
                </div>

              </div>

            </div>

          : null}

          {activeIndex === 1 ?
            <div className="card">            
              <div className="p-fluid p-formgrid p-grid">

                <div className="p-field p-col-4">
                  <label htmlFor="img_icon">Icon</label>
                  <InputText id="img_icon" name="img_icon" {...register('img_icon')} />
                </div>

                <div className="p-field p-col-4">
                  <label htmlFor="img_logo">Logo</label>
                  <InputText id="img_logo" name="img_logo" {...register('img_logo')} />
                </div>

                <div className="p-field p-col-4">
                  <label htmlFor="img_logo_alt">Logo Alternativo</label>
                  <InputText id="img_logo_alt" name="img_logo_alt" {...register('img_logo_alt')} />
                </div>

                <div className="p-field p-col-12" id="manifest-editor-parent">
                  <label htmlFor="manifest_editor">App Manifest</label>
                    <AceEditor
                      ref={jsonManifestEditor}
                      id="manifest_editor"
                      mode="json"
                      theme="github"
                      onLoad={editorInstance => {                
                        editorInstance.container.style.setProperty('width', (document.getElementById('manifest-editor-parent').offsetWidth - 20) + 'px');              
                      }}
                      onChange={(newValue) => {
                        setManifestJson(newValue);
                      }}
                      value={manifestJson}
                      name="UNIQUE_ID_OF_MANIFEST"         
                      editorProps={{ $blockScrolling: true }}
                      setOptions={{
                        useWorker: false,
                        tabSize: 2,
                        maxLines: 20,
                        printMargin: false                    
                      }}              
                    />
                </div>

                <div className="p-field p-col-12" id="style-editor-parent">
                <Toolbar className="p-mb-1" left={() => { return (
                <React.Fragment>
                  <Button icon="pi pi-undo" className="p-mr-2 p-pl-3 p-pr-3"
                  title="Undo"
                  onClick={e => {
                    e.preventDefault();
                    customStyleEditor.current.editor.undo();
                  }} />
                  <Button icon="pi pi-refresh" className="p-mr-2 p-pl-3 p-pr-3"
                  title="Redo"
                  onClick={e => {
                    e.preventDefault();
                    customStyleEditor.current.editor.redo();
                  }} />
                  <div className="p-inputgroup">                  
                    <InputText placeholder="Pesquisar" 
                      value={customStyleEditorSearchText}
                      onChange={e=>{
                        if (!e.target.value) {
                          customStyleEditor.current.editor.find('', {
                            backwards: false,
                            wrap: true,
                            caseSensitive: false,
                            wholeWord: false,
                            regExp: false
                          });                        
                        }
                        setCustomStyleEditorSearchText(e.target.value)
                        }} />
                    <Button icon="pi pi-search" className="p-button-warning"
                      title="Pesquisar texto"
                      onClick={e=>{
                        e.preventDefault();
                        customStyleEditor.current.editor.find(customStyleEditorSearchText, {
                          backwards: false,
                          wrap: true,
                          caseSensitive: false,
                          wholeWord: false,
                          regExp: false
                        });
                        return false;                      
                      }}/>
                  </div>

                </React.Fragment>
                )}} />                
                  <label htmlFor="style_editor">Style (Código)</label>
                  <AceEditor
                    ref={customStyleEditor}
                    id="style_editor"
                    mode="css"
                    theme="github"
                    onLoad={editorInstance => {                
                      editorInstance.container.style.setProperty('width', (document.getElementById('style-editor-parent').offsetWidth - 20) + 'px');              
                    }}
                    onChange={(newValue) => {
                      setCustomStyle(newValue);
                    }}
                    value={customStyle}
                    name="UNIQUE_ID_OF_DIV2"         
                    editorProps={{ $blockScrolling: true }}
                    setOptions={{
                      useWorker: false,
                      tabSize: 2,
                      maxLines: 20,
                      printMargin: false                    
                    }}              
                  />
                </div> 

              </div>
            </div>
          : null}

          {activeIndex === 2 ?
            <div className="card" id="editor-parent">
              <Toolbar className="p-mb-1" left={() => { return (
                <React.Fragment>
                  <Button icon="pi pi-undo" className="p-mr-2 p-pl-3 p-pr-3"
                  title="Undo"
                  onClick={e => {
                    e.preventDefault();
                    jsonConfigEditor.current.editor.undo();
                  }} />
                  <Button icon="pi pi-refresh" className="p-mr-2 p-pl-3 p-pr-3"
                  title="Redo"
                  onClick={e => {
                    e.preventDefault();
                    jsonConfigEditor.current.editor.redo();
                  }} />
                  <div className="p-inputgroup">                  
                    <InputText placeholder="Pesquisar" 
                      value={jsonConfigEditorSearchText}
                      onChange={e=>{
                        if (!e.target.value) {
                          jsonConfigEditor.current.editor.find('', {
                            backwards: false,
                            wrap: true,
                            caseSensitive: false,
                            wholeWord: false,
                            regExp: false
                          });                        
                        }
                        setJsonConfigEditorSearchText(e.target.value)
                        }} />
                    <Button icon="pi pi-search" className="p-button-warning"
                      title="Pesquisar texto"
                      onClick={e=>{
                        e.preventDefault();
                        jsonConfigEditor.current.editor.find(jsonConfigEditorSearchText, {
                          backwards: false,
                          wrap: true,
                          caseSensitive: false,
                          wholeWord: false,
                          regExp: false
                        });
                        return false;                      
                      }}/>
                  </div>

                </React.Fragment>
                )}} />
              <AceEditor
                ref={jsonConfigEditor}
                mode="json"
                theme="github"
                onLoad={editorInstance => {                
                  editorInstance.container.style.setProperty('width', (document.getElementById('editor-parent').offsetWidth - 30) + 'px');
                  /*
                  editorInstance.container.style.resize = "both";
                  // mouseup = css resize end
                  document.addEventListener("mouseup", e => (
                    editorInstance.resize()
                  ));
                  */               
                }}
                onChange={(newValue) => {
                  setConfigJson(newValue);
                }}
                value={configJson}
                name="UNIQUE_ID_OF_DIV"         
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  useWorker: false,
                  tabSize: 2,
                  printMargin: false 
                }}              
              />
            </div>
          : null}

          {activeIndex === 3 ?

            <div className="card">

              <PrintGroupChildsEditor 
                data={printChilds} 
                printsList={printsList}
                groupsList={groupsList}
                onChange={(data) => {
                  setPrintChilds(data);
                }} 
              />

            </div>
          : null}

          <Toolbar className="p-mt-4 p-mb-4" right={rightToolbarTemplate}></Toolbar>

        </form>
      
      </BlockUI>

    </React.Fragment>

  );

}

export default connect(state => ({ auth: state.auth }))(ViewerForm);