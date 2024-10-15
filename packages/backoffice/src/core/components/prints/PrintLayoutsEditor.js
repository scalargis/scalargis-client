import React, { useState, useEffect, useRef } from "react";
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { confirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useForm, Controller } from 'react-hook-form';

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";


const LayoutEditor = props => {

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {...props.data}
  });

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

  const onSave = (formData) => {
    props.onSave(formData);
  }

  const renderFooter = (name) => {
    return (
        <div className="p-mt-4">
            <Button 
              label="Fechar"
              icon="pi pi-times"
              onClick={() => props.onHide()} className="p-button-text" />
            <Button 
              label="Gravar"
              icon={"pi pi-check"}
              onClick={handleSubmit((d) => onSave(d))}
              autoFocus />
        </div>
    );
  }

  return (
    <Dialog header={"Edição de Layout"} visible={props.show} style={{ width: '50vw' }} footer={renderFooter} onHide={() => { props.onHide(); }}>
      <form>
        <div className="p-fluid p-formgrid p-grid">
          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="format">Formato</label>
            <Controller name="format" control={control} rules={{ required: 'Campo obrigatório.' }}
              render={({ field }) => {
                return <Dropdown id="format" {...field}
                  options={props.pageFormatList.map(val=>{return {label: val, value: val}})}
                  onChange={(e) => field.onChange(e.value)}
                  className={classNames({ 'p-invalid': errors.format})} />
              }}                    
            />            
            {getFormErrorMessage(errors, 'format')}
          </div>
          <div className="p-field p-col-12 p-md-6">
            <label htmlFor="orientation">Orientação</label>
            <Controller name="orientation" control={control} rules={{ required: 'Campo obrigatório.' }}
              render={({ field }) => {
                return <Dropdown id="orientation" {...field}
                  options={props.pageOrientationList.map(val=>{return {label: val, value: val}})}
                  onChange={(e) => field.onChange(e.value)}
                  className={classNames({ 'p-invalid': errors.format})} />
              }}                    
            />             
            {getFormErrorMessage(errors, 'orientation')}
          </div>
          <div className="p-field p-col-12">
            <label htmlFor="config">Configuração</label>
            <div id="editor-parent">

              <Controller
                control={control}
                name="config"
                render={({ field }) => {

                  return <AceEditor
                    mode="json"
                    theme="github"
                    onLoad={editorInstance => {                
                      editorInstance.container.style.setProperty('width', (document.getElementById('editor-parent').offsetWidth - 50) + 'px');               
                    }}
                    {...field}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                    }}
                    value={field.value}
                    name="layout-config"         
                    editorProps={{ $blockScrolling: true }}
                    setOptions={{
                      useWorker: false,
                      tabSize: 2
                    }}              
                  />
                }}
              />
            </div>
          </div>

        </div>
      </form>
    </Dialog>
  );
}


const PrintLayoutsEditor = props => {

  const [records, setRecords] = useState(props.data ? [...props.data] : []);
  const [selectedRecords, setSelectedRecords] = useState(null);  

  const [layoutEdition, setLayoutEdition] = useState();
  const [showLayoutForm, setShowLayoutForm] = useState(false);

  const toast = useRef(null);

  const dt = useRef(null);

  useEffect(() => {
   if (props?.data) setRecords(props.data.map((l) => { return {...l, key: createKey()} }));
  }, [props.data]);

  const findIndexByKey = (key) => {
    let index = -1;
    for (let i = 0; i < records.length; i++) {
        if (records[i].key === key) {
            index = i;
            break;
        }
    }
    return index;
  }  

  const createKey = () => {
      let key = '';
      let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 5; i++) {
          key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return key;
  }

  const onRowReorder = (e) => {
    props.onChange(e.value.map(r => (({ id, format, orientation, config }) => ({ id, format, orientation, config }))(r)));
  }  
  
  const editRecord = (record) => {
    setLayoutEdition({...record});
    setShowLayoutForm(true);
  }

  const deleteRecord = (e, record) => {
    confirmPopup({
      target: e.currentTarget,
      message: 'Tem a certeza que pretende eliminar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const _records = records.filter(val => val.key !== record.key);
        props.onChange(_records.map(r => (({ id, format, orientation, config }) => ({ id, format, orientation, config }))(r)));
        setSelectedRecords([]);
      }
    });
  }

  const deleteSelectedRecords = (e) => {
    confirmPopup({
      target: e.currentTarget,
      message: 'Tem a certeza que pretende eliminar todos os layouts selecionados?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const _keys = selectedRecords.map((r) => r.key);
        const _records = records.filter(r => !_keys.includes(r.key));
        props.onChange(_records.map(r => (({ id, format, orientation, config }) => ({ id, format, orientation, config }))(r)));
        setSelectedRecords([]);
      }
    });
  }


  const onLayoutFormHide = () => {
    setShowLayoutForm(false);
    setLayoutEdition(null);
  }

  const onLayoutFormSave = (data) => {
    const _records = [...records];
    const _record = {...data}

    if (data.key) {
      const index = findIndexByKey(data.key);
      _records[index] = _record;
    } else {
      _record.key = createKey();
      _records.push(_record);
    }

    props.onChange(_records.map(r => (({ id, format, orientation, config }) => ({ id, format, orientation, config }))(r)));
    setSelectedRecords([]);
    setShowLayoutForm(false);
  }  

  const leftToolbarTemplate = () => {
    return null
  }

  const rightToolbarTemplate = () => {
    return (
      <React.Fragment>
          <Button type="button" label="Novo" icon="pi pi-plus" className="p-button-success p-mr-2" 
            onClick={() => {
              editRecord({ key: '' });
            }}
          />
          <Button type="button"  label="Eliminar" icon="pi pi-trash" className="p-button-danger" 
            disabled={!selectedRecords || !selectedRecords.length} 
            onClick={(e) => {
              deleteSelectedRecords(e);
            }}
          />
      </React.Fragment>
    )
  }

  const actionBodyTemplate = (rowData) => {
    return (
      <div style={{textAlign: "right"}}>
          <Button type="button" icon="pi pi-pencil" className="p-button-rounded p-button-success p-mr-2" onClick={(e) => {
            editRecord(rowData);
          }} />
          <Button type="button" icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={(e) => {
            deleteRecord(e, rowData);
          }} />
      </div>
    );
  }  

  return (
    <div>
      <Toast ref={toast} baseZIndex={2000} />

      { showLayoutForm && 
        <LayoutEditor data={layoutEdition} 
          pageFormatList={props.pageFormatList}
          pageOrientationList={props.pageOrientationList}
          show={showLayoutForm} 
          onHide={onLayoutFormHide} 
          onSave={onLayoutFormSave} />
      }

      <div className="card">
        <Toolbar className="p-mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>

        <DataTable ref={dt} value={records ? records : []}
          selection={selectedRecords} onSelectionChange={(e) => setSelectedRecords(e.value)}
          reorderableColumns onRowReorder={onRowReorder}
          emptyMessage="Não foram encontrados registos." >
            <Column rowReorder rowReorderIcon="fas fa-arrows-alt" style={{width: '3em'}} />
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column field="format" header="Formato" filterPlaceholder="Format" />
            <Column field="orientation" header="Orientação" filterPlaceholder="Orientação" />
            <Column body={actionBodyTemplate} />
        </DataTable>
      </div>
    </div>
  )

}

export default PrintLayoutsEditor;