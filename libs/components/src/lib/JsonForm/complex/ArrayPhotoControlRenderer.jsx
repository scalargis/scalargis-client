import React, { useCallback, useContext, useState } from 'react';

import { ActionIcon, Alert, Badge, Button, Group, Image, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { confirm, Lightbox, IconPencil, IconTrash, IconInfoCircle } from '@scalargis/ui';

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
import PhotoForm from './PhotoForm';
import { translateMsg } from './../util/i18n';

/** Prime Image `preview` twin: the thumbnail is a real button that opens the
 *  full-size photo in a modal. */
const PhotoPreview = ({ src, alt, title }) => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <UnstyledButton type="button" onClick={open} title={title} aria-label={title}>
        <Image src={src} alt={alt} w={100} fit="contain" />
      </UnstyledButton>
      <Lightbox opened={opened} onClose={close} title={alt} src={src} alt={alt} />
    </>
  );
};

export const ArrayPhotoControlRenderer = (props) => {

  const {
    schema,
    uischema,
    path,
    label,
    t,
    locale
  } = props;

  const i18Props = {t, schema, uischema, path};

  const ctx = useContext(JsonFormContext);

  const { removeItems } = props;

  const [rowIndex, setRowIndex] = useState(undefined);
  const [rowData, setRowData] = useState(undefined);
  const [showPhotoForm, { open: openPhotoForm, close: closePhotoForm }] = useDisclosure(false);

  const deleteConfirm = useCallback((index) => {
    removeItems(props.path, [index])();
  }, [props.path]);

  return(
    <div className="grid">
      {showPhotoForm && (
        <PhotoForm
          schema={schema}
          uischema={uischema}
          path={path}
          label={label}
          t={t}
          locale={locale}
          data={rowData}
          index={rowIndex}
          utils={ctx.utils}
          showForm={showPhotoForm}
          setShowForm={(v) => (v ? openPhotoForm() : closePhotoForm())}
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
            closePhotoForm();
          }}
        />
      )}

      <div className="field col-12 mb-0 pb-0">
        { (props?.data?.length) ?
          <div className="col-12">
            <div className="text-center mb-1 p-0">
              <Badge variant="light" color="informative" radius="xl" style={{width:'80%'}}>
                {props.data.length + " " + (props.data.length > 1 ?
                  translateMsg("common.photos", "photos", "Fotografias", i18Props) :
                  translateMsg("common.photo", "photo", "Fotografia", i18Props))}
              </Badge>
            </div>
            <table style={{"width": "100%"}}>
              <tbody>
                {
                  (props.data).map((item, index) => {
                    const f = item.file || {};
                    return (
                      <tr key={index}>
                        <td className="" style={{"wordBreak": "break-all", "textAlign": "center"}}>
                          <PhotoPreview src={f.data || `${f.file_url}`} alt={f.filename}
                            title={translateMsg("common.viewPhoto", "viewPhoto", "Ver fotografia", i18Props)} />
                        </td>
                        <td className="col-9" style={{"wordBreak": "break-all", "textAlign": "center"}}>{(f?.original_filename || f?.filename)}</td>
                        <td className="col-1" style={{"verticalAlign": "top", "textAlign": "center"}}>
                          <ActionIcon variant="outline" radius="xl" size="md" mb="xs"
                            title={translateMsg("common.editPhoto", "editPhoto", "Editar fotografia", i18Props)}
                            aria-label={translateMsg("common.editPhoto", "editPhoto", "Editar fotografia", i18Props)}
                            onClick={(e) => {
                              e.preventDefault();
                              openPhotoForm();
                              setRowIndex(index);
                              setRowData(item);
                            }}>
                            <IconPencil />
                          </ActionIcon>
                          <ActionIcon variant="outline" color="danger" radius="xl" size="md"
                            title={translateMsg("common.deletePhoto", "deletePhoto", "Eliminar fotografia", i18Props)}
                            aria-label={translateMsg("common.deletePhoto", "deletePhoto", "Eliminar fotografia", i18Props)}
                            onClick={(e) => {
                              e.preventDefault();

                              confirm({
                                message: `${translateMsg("common.deleteFileConfirmation", "deleteFileConfirmation", "Deseja remover a ficheiro", i18Props)} "${f.original_filename || f.filename}"?`,
                                header:  translateMsg("common.confirmation", "confirmation", "Confirmação", i18Props),
                                severity: 'danger',
                                acceptLabel: translateMsg("yes", null, "Sim", i18Props),
                                rejectLabel: translateMsg("no", null, "Não", i18Props),
                                accept: () => {
                                  deleteConfirm(index);
                                },
                                reject: () =>  { /* noop */ }
                              });

                          } }>
                            <IconTrash />
                          </ActionIcon>
                        </td>
                    </tr>)
                  })
                }
              </tbody>
            </table>
          </div> :
          <Alert color="informative" py="xs">
            <Group justify="center" gap="xs" wrap="nowrap">
              <IconInfoCircle />
              <span>{translateMsg("noPhotosInfo", null, "Não existem fotografias. Pode adicioná-las através do botão 'Adicionar fotografia'.", i18Props)}</span>
            </Group>
          </Alert>
        }
      </div>

      <div className="col-12 text-center">
        <Button variant="subtle" style={{width: 'auto'}}
          onClick={(e) => {
            e.preventDefault();
            openPhotoForm();
            setRowIndex(null);
            setRowData(null);
          }}>
          {translateMsg("addPhoto", null, "Adicionar Fotografia", i18Props)}
        </Button>
      </div>
    </div>

  );

};

// Rank 5 (not 4): the Mantine set's generic `mantineArrayLayoutTester` is
// rank 4 for any object array *with nesting*, and our item schema nests a
// `file` object — a rank-4 tie there loses on registration order. 5 wins.
export const arrayPhotoControlTester = rankWith(
  5,
  and(
    or(isObjectArrayControl, isPrimitiveArrayControl),
    optionIs('format', 'photo')
  )
);

export default withTranslateProps(withJsonFormsArrayControlProps(ArrayPhotoControlRenderer));
