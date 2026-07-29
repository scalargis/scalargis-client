import React, { useRef, useMemo } from 'react';
import {
  optionIs,
  rankWith,
} from '@jsonforms/core';
import {
  withTranslateProps,
  withJsonFormsControlProps
} from '@jsonforms/react';

import { Badge, Button, FileButton } from '@mantine/core';
import { notify } from '@scalargis/ui';
import Resizer from "react-image-file-resizer";

import { translateMsg } from './../util/i18n';

const fileDefaultValues = {
  file_url: null,
  file_size: null,
  filename: null
};

const resizeFile = (file) =>
new Promise((resolve) => {
  Resizer.imageFileResizer(
    file,
    2400,
    1600,
    "JPEG",
    90,
    0,
    (uri) => {
      resolve(uri);
    },
    "base64"
  );
});

const resizeThumbFile = (file) =>
new Promise((resolve) => {
  Resizer.imageFileResizer(
    file,
    165,
    165,
    "JPEG",
    90,
    0,
    (uri) => {
      resolve(uri);
    },
    "base64"
  );
});

export const PhotoControl = (props) => {

  const { schema, uischema, path, t, locale } = props;

  const resetPicker = useRef(null);

  let maxFileSize = 51200 //KB
  if (props.config && props.config.viewer && props.config.viewer.upload_maxfilesize) {
    maxFileSize = props.config.viewer.upload_maxfilesize;
  }

  const file = props?.data ? {...props?.data}  : {...fileDefaultValues};

  function selectFile(selected) {
    if (!selected) return;

    if (maxFileSize > 0 && selected.size > maxFileSize * 1024) {
      notify.warn('Selecionar Ficheiro', 'Não foi possível selecionar o ficheiro. Por favor, verifique se o ficheiro selecionado ultrapassa a dimensão máxima permitida.');
      resetPicker.current?.();
      return;
    }

    const reader = new FileReader();
    reader.onload = async function() {
      const raw = reader.result;

      try {
        const image = await resizeFile(selected);
        const imageThumb = await resizeThumbFile(selected);

        const stringLength = image.length - 'data:image/jpg;base64,'.length;
        const sizeInBytes = 4 * Math.ceil((stringLength / 3))*0.5624896334383812;

        const data = {
          ...file,
          file_url: null,
          thumb_url: null,
          original_filename: selected.name,
          filename: selected.name,
          file_size: sizeInBytes,
          data: image,
          data_thumb: imageThumb
        };
        props.handleChange(props.path, data);

      } catch (err) {
        const data = {
          ...file,
          file_url: null,
          thumb_url: null,
          original_filename: selected.name,
          filename: selected.name,
          size: selected.size,
          data: raw,
          data_thumb: null
        };
        props.handleChange(props.path, data);
      }

      // Reset the native input so re-picking the same file fires again
      // (Prime's file_upload.clear() behaviour).
      resetPicker.current?.();
    };
    reader.readAsDataURL(selected);
  }

  const labels = useMemo(() => {
    const prefix = "PhotoControl";
    const elem = `${locale}.${prefix}`;
    const fallbackElem = `${locale}.controls`;
    return {
      file: translateMsg(`${elem}.file`, `${fallbackElem}.file`, 'File', {t, schema, uischema, path}),
      size: translateMsg(`${elem}.size`, `${fallbackElem}.size`, 'Size', {t, schema, uischema, path}),
      newfile: translateMsg(`${elem}.newfile`, `${fallbackElem}.newfile`, 'New file', {t, schema, uischema, path}),
      choose: translateMsg(`${elem}.choose`, `${fallbackElem}.choose`, 'Choose', {t, schema, uischema, path}),
      maxFileSize: translateMsg(`${elem}.maxFileSize`, `${fallbackElem}.maxFileSize`, 'Max file size', {t, schema, uischema, path}),
    }
  }, [locale, schema, uischema, path]);

  return (
    <form onSubmit={(e)=>{ e.preventDefault(); }}>
      <div className="p-fluid">
        <div className="field">
          { (file && file.data && file.original_filename) ?
          <div>
            <div><strong>{labels.file}: </strong>{file.original_filename} <Badge variant="light" ml="xs" leftSection={<i className="pi pi-info-circle" aria-hidden="true" />}>{labels.newfile}</Badge></div>
            <div><strong>{labels.size}: </strong>{file.file_size ? Math.round(file.file_size/1024) + " KB": ""}</div>
          </div>
          :
          <div>
            <div><strong>{labels.file}: </strong><a href={`${file.file_url}`} target="_blank" rel="noreferrer">{file.original_filename}</a></div>
            <div><strong>{labels.size}: </strong>{file.file_size ? Math.round(file.file_size/1024) + " KB": ""}</div>
          </div>
          }
        </div>
        <div className="field col-12">
          <FileButton onChange={selectFile} resetRef={resetPicker} accept="image/*">
            {(buttonProps) => (
              <Button {...buttonProps} leftSection={<i className="pi pi-plus" aria-hidden="true" />}>
                {labels.choose}
              </Button>
            )}
          </FileButton>
          { (maxFileSize > 0) ?
          <small id="upload-help" className="p-warn block">{labels.maxFileSize}: {Math.round((maxFileSize/1024) * 100) / 100} MB</small>
          : null }
        </div>
        <div className="field col-12">
          { (file?.data || file?.file_url) &&
          <div className="field col-6">
            <img src={file.data || `${file.file_url}`} alt={file.original_filename} style={{"maxWidth": "300px"}} />
          </div> }
        </div>
      </div>
    </form>
  );
};

export const photoControlTester = rankWith(
  3,
  optionIs('format', 'photo')
);

export default withTranslateProps(withJsonFormsControlProps(PhotoControl));
