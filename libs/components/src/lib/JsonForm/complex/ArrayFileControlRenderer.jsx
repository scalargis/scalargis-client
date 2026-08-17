import React, { useCallback, useContext, useState } from 'react';

import { ActionIcon, Alert, Badge, Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { confirm } from '@scalargis/ui';

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
    schema,
    uischema,
    path,
    label,
    t,
    locale
  }= props;

  const i18Props = {t, schema, uischema, path};

  const ctx = useContext(JsonFormContext);

  const { removeItems } = props;

  const [rowIndex, setRowIndex] = useState(undefined);
  const [rowData, setRowData] = useState(undefined);
  const [showFileForm, { open: openFileForm, close: closeFileForm }] = useDisclosure(false);

  const deleteConfirm = useCallback((index) => {
    removeItems(props.path, [index])();
  }, [props.path]);

  return(
    <div className="grid">
      {showFileForm && (
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
          setShowForm={(v) => (v ? openFileForm() : closeFileForm())}
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
            closeFileForm();
          }}
        />
      )}

      <div className="field col-12 mb-0 pb-0">
        { (props?.data?.length) ?
          <div className="col-12">
            <div className="text-center mb-1 p-0">
              <Badge variant="light" color="informative" radius="xl" style={{width:'80%'}}>
                {props.data.length + " " + (props.data.length > 1 ?
                  translateMsg("common.files", "files", "Ficheiros", i18Props) :
                  translateMsg("common.file", "file", "Ficheiro", i18Props))}
              </Badge>
            </div>
            <table style={{"width": "100%"}}>
              <tbody>
                {
                  (props.data).map((item, index) => {
                    const f = item.file || {};
                    return (
                      <tr key={index}>
                        <td className="col-9" style={{"verticalAlign": "top", "wordBreak": "break-all"}}>
                          <div>{(f?.original_filename || f?.filename)}</div>
                          <div className="file-description" style={{"fontSize": "0.9rem","color": "#b7bdbb"}}>{(item?.description)}</div>
                        </td>
                        <td className="col-1" style={{"verticalAlign": "middle", "textAlign": "center"}}>
                          <ActionIcon variant="outline" radius="xl" size="md" mb="xs"
                            title={translateMsg("common.editFile", "editFile", "Editar ficheiro", i18Props)}
                            aria-label={translateMsg("common.editFile", "editFile", "Editar ficheiro", i18Props)}
                            onClick={(e) => {
                              e.preventDefault();
                              openFileForm();
                              setRowIndex(index);
                              setRowData(item);
                            }}>
                            <i className="pi pi-pencil" aria-hidden="true" />
                          </ActionIcon>
                          <ActionIcon variant="outline" color="danger" radius="xl" size="md"
                            title={translateMsg("common.deleteFile", "deleteFile", "Eliminar ficheiro", i18Props)}
                            aria-label={translateMsg("common.deleteFile", "deleteFile", "Eliminar ficheiro", i18Props)}
                            onClick={(e) => {
                              e.preventDefault();

                              confirm({
                                message: `${translateMsg("common.deleteFileConfirmation", "deleteFileConfirmation", "Deseja remover a ficheiro", i18Props)} "${f.original_filename || f.filename}"?`,
                                header:  translateMsg("common.confirmation", "confirmation", "Confirmação", i18Props),
                                severity: 'danger',
                                acceptLabel: 'Sim',
                                rejectLabel: 'Não',
                                accept: () => {
                                  deleteConfirm(index);
                                },
                                reject: () =>  { /* noop */ }
                              });

                          } }>
                            <i className="pi pi-trash" aria-hidden="true" />
                          </ActionIcon>
                        </td>
                    </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div> :
          <Alert color="informative" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <i className="pi pi-info-circle" aria-hidden="true" />
              <span>{translateMsg("noFilesInfo", null, "Não existem ficheiros. Pode adicioná-las através do botão 'Adicionar ficheiro'.", i18Props)}</span>
            </Group>
          </Alert>
        }
      </div>

      <div className="col-12 text-center">
        <Button variant="subtle" style={{width: 'auto'}}
          onClick={(e) => {
            e.preventDefault();
            openFileForm();
            setRowIndex(null);
            setRowData(null);
          }}>
          {translateMsg("addFile", null, "Adicionar Ficheiro", i18Props)}
        </Button>
      </div>
    </div>

  );

};

// Rank 5 (not 4): see the note in ArrayPhotoControlRenderer — the generic
// rank-4 `mantineArrayLayoutTester` matches our nested item schema too, and a
// tie loses on registration order. 5 wins.
export const arrayFileControlTester = rankWith(
  5,
  and(
    or(isObjectArrayControl, isPrimitiveArrayControl),
    optionIs('format', 'file')
  )
);

export default withTranslateProps(withJsonFormsArrayControlProps(ArrayFileControlRenderer));
