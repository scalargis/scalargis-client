import React, { useContext, useEffect, useCallback, useState } from 'react';

import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import { Image } from 'primereact/image';

import {
  isObjectArrayControl,
  isPrimitiveArrayControl,
  optionIs,
  and,
  or,
  rankWith,
} from '@jsonforms/core';
import {
  withTranslateProps,
  withJsonFormsArrayControlProps
} from '@jsonforms/react';

import { JsonFormContext } from './../JsonFormContext';
import FileForm from './FileForm';
import { translateMsg } from './../util/i18n';

export const ArrayFileControlRenderer = (props) => {

  const { 
    data,
    schema,
    uischema,
    path,
    label,
    t,
    locale
  }= props;

  const i18Props = {t, schema, uischema, path};
  
  const ctx = useContext(JsonFormContext);

  const { showOnPortal } = ctx.utils; 

  const { removeItems } = props;
 
  const [rowIndex, setRowIndex] = useState(undefined);
  const [rowData, setRowData] = useState(undefined);
  const [showFileForm, setShowFileForm] = useState(false);

  const buttonAddStyle = {
    width: 'auto'
  };
  
  const deleteConfirm = useCallback((index) => {
    removeItems(props.path, [index])();
  }, [props.path]);
  
  return(    
    <div className="p-grid">
      {showFileForm && showOnPortal(
        <FileForm
          schema={schema}
          uischema={uischema}
          path={path}
          label={label}
          t={t}
          locale={locale}
          data={rowData}
          index={rowIndex}
          utils={ctx.utils}
          showForm={showFileForm}
          setShowForm={setShowFileForm}
          onChange={(data) => {
            // TODO
          }}
          onSave={(data) => {
            const newData = [...(props?.data || [])];
            if (rowIndex === null) {
              newData.push({...data});
            } else {              
              newData[rowIndex] = {...data};
            }            
            props.handleChange(props.path, newData);
            setShowFileForm(false);
          }}
        />
      )}

      <div className="p-field p-col-12 p-mb-0 p-pb-0">
        { (props?.data?.length) ? 
          <div className="p-col-12">
            <div className="card p-text-center  p-mb-1 p-p-0">
              <Tag severity="info" rounded style={{width:'80%'}} 
                value={props.data.length + " " + (props.data.length > 1 ? 
                  translateMsg("common.files", "files", "Ficheiros", i18Props) : 
                  translateMsg("common.file", "file", "Ficheiro", i18Props))}></Tag>
            </div>
            <table style={{"width": "100%"}}>
              <tbody>
                {
                  (props.data).map((item, index) => {
                    const f = item.file || {};
                    return (
                      <tr key={index}>                 
                        <td className="p-col-9" style={{"verticalAlign": "top", "wordBreak": "break-all"}}>
                          <div>{(f?.original_filename || f?.filename)}</div>
                          <div className="file-description" style={{"fontSize": "0.9rem","color": "#b7bdbb"}}>{(item?.description)}</div>
                        </td>
                        <td className="p-col-1" style={{"verticalAlign": "middle", "textAlign": "center"}}>
                          <Button icon="pi pi-pencil" className="p-button-rounded p-button-outlined p-mb-2"
                            tooltip={translateMsg("common.editFile", "editFile", "Editar ficheiro", i18Props)}
                            onClick={(e) => {
                              e.preventDefault();
                              setShowFileForm(true);
                              setRowIndex(index);
                              setRowData(item);                              
                            }} />                                                                            
                          <Button icon="pi pi-trash" className="p-button-rounded p-button-outlined p-button-danger"
                            tooltip={translateMsg("common.deleteFile", "deleteFile", "Eliminar ficheiro", i18Props)}
                            onClick={(e) => { 
                              e.preventDefault();

                              confirmDialog({
                                message: `${translateMsg("common.deleteFileConfirmation", "deleteFileConfirmation", "Deseja remover a ficheiro", i18Props)} "${f.original_filename || f.filename}"?`,
                                header:  translateMsg("common.confirmation", "confirmation", "Confirmação", i18Props),
                                icon: 'pi pi-exclamation-triangle p-mr-1',
                                acceptLabel: 'Sim',
                                rejectLabel: 'Não',
                                accept: () => {
                                  deleteConfirm(index);
                                },
                                reject: () =>  { }      
                              });

                          } } />                    
                        </td>
                    </tr>                      
                    )
                  })
                }
              </tbody>
            </table>
          </div> : 
          <Message
            severity="info"
            text={translateMsg("noFilesInfo", null, "Não existem ficheiros. Pode adicioná-las através do botão 'Adicionar ficheiro'.", i18Props)} 
          />
        }              
      </div>

      <div className="p-col-12 p-text-center">
        <Button label={translateMsg("addFile", null, "Adicionar Ficheiro", i18Props)} className="p-button-text" style={buttonAddStyle} 
          onClick={(e) => {
            e.preventDefault();
            setShowFileForm(true);
            setRowIndex(null);
            setRowData(null);
          }} />
      </div>
    </div>

  );

};

export const arrayFileControlTester = rankWith(
  4,
  and(
    or(isObjectArrayControl, isPrimitiveArrayControl),
    optionIs('format', 'file')
  )
);

export default withTranslateProps(withJsonFormsArrayControlProps(ArrayFileControlRenderer));