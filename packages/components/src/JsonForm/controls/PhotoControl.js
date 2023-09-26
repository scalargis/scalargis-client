import React, { useRef, useContext, useMemo } from 'react';
import {
  optionIs,
  rankWith,
} from '@jsonforms/core';
import {
  withTranslateProps,
  withJsonFormsControlProps
} from '@jsonforms/react';

import { Toast } from 'primereact/toast';
import { Chip } from 'primereact/chip';
import { FileUpload } from 'primereact/fileupload';
import Resizer from "react-image-file-resizer";

import { JsonFormContext } from './../JsonFormContext';
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

  const ctx = useContext(JsonFormContext);
  
  const { showOnPortal } = ctx.utils;

  const { schema, uischema, path, label, t, locale } = props;
 
  const file_upload = useRef();

  const toast = useRef(null);

  let maxFileSize = 51200 //KB
  if (props.config && props.config.viewer && props.config.viewer.upload_maxfilesize) {
    maxFileSize = props.config.viewer.upload_maxfilesize;
  }
  
  const file = props?.data ? {...props?.data}  : {...fileDefaultValues};

  function selectFile(e) {
    if (file_upload.current && file_upload.current.files && file_upload.current.files.length) {
      const reader = new FileReader();
      reader.onload = async function() {
        let data = reader.result;

        try {
          const image = await resizeFile(file_upload.current.files[0]);
          const imageThumb = await resizeThumbFile(file_upload.current.files[0]);

          const stringLength = image.length - 'data:image/jpg;base64,'.length;
          const sizeInBytes = 4 * Math.ceil((stringLength / 3))*0.5624896334383812;
          const sizeInKb = sizeInBytes/1000;
          
          const data = {
            ...file,
            file_url: null,
            thumb_url: null,
            original_filename: file_upload.current.files[0].name,
            filename: file_upload.current.files[0].name,            
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
            original_filename: file_upload.current.files[0].name,            
            filename: file_upload.current.files[0].name,
            size: file_upload.current.files[0].size, 
            data: data,
            data_thumb: null
          };
          props.handleChange(props.path, data);
        }

        file_upload.current.clear();
        file_upload.current.files = []; 
      };
      reader.readAsDataURL(file_upload.current.files[0]);    

    }
  }

  function fileValidationFail(e) {
    toast.current.show({life: 5000, severity: 'warn', summary: 'Selecionar Ficheiro', detail: 'Não foi possível selecionar o ficheiro. Por favor, verifique se o ficheiro selecionado ultrapassa a dimensão máxima permitida.'});
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
      upload: translateMsg(`${elem}.upload`, `${fallbackElem}.upload`, 'Upload', {t, schema, uischema, path}),
      cancel: translateMsg(`${elem}.cancel`, `${fallbackElem}.cancel`, 'Cancel', {t, schema, uischema, path}),
      maxFileSize: translateMsg(`${elem}.maxFileSize`, `${fallbackElem}.maxFileSize`, 'Max file size', {t, schema, uischema, path}),
    }
  }, [locale, schema, uischema, path]);

  return (
    <>
      {showOnPortal(<Toast ref={toast} baseZIndex={2000} />)}
      <form onSubmit={(e)=>{ e.preventDefault(); }}>
        <div className="p-fluid">    
          <div className="p-field">
            { (file && file.data && file.original_filename) ?
            <div>
              <div><strong>{labels.file}: </strong>{file.original_filename} <Chip label={` ${labels.newfile}`} icon="pi pi-info-circle" className="p-ml-2" style={{color:"var(--primary-color)"}} /></div>
              <div><strong>{labels.size}: </strong>{file.file_size ? Math.round(file.file_size/1024) + " KB": ""}</div>
            </div>
            :
            <div>
              <div><strong>{labels.file}: </strong><a href={`${file.file_url}`} target="_blank">{file.original_filename}</a></div>
              <div><strong>{labels.size}: </strong>{file.file_size ? Math.round(file.file_size/1024) + " KB": ""}</div>
            </div>
            }
          </div>
          <div className="p-field p-col-12">
            <FileUpload
              ref={file_upload} 
              name="upload"
              mode="basic"
              maxFileSize={maxFileSize*1024}
              customUpload 
              onSelect={selectFile}
              onValidationFail={fileValidationFail}
              disabled={false}
              url="./upload"
              chooseLabel={labels.choose}
              uploadLabel={labels.upload}
              cancelLabel={labels.cancel}
              invalidFileSizeMessageDetail=""
              invalidFileSizeMessageSummary=""
            />
            { (maxFileSize > 0) ?
            <small id="upload-help" className="p-warn">{labels.maxFileSize}: {Math.round((maxFileSize/1024) * 100) / 100} MB</small>
            : null }
          </div>
          <div className="p-field p-col-12">
            { (file?.data || file?.file_url) &&
            <div className="p-field p-col-6">
              <img src={file.data || `${file.file_url}`} alt={file.original_filename} style={{"maxWidth": "300px"}} />
            </div> }
          </div>
        </div>
      </form>
    </>

  );
};

export const photoControlTester = rankWith(
  3,
  optionIs('format', 'photo')
);

export default withTranslateProps(withJsonFormsControlProps(PhotoControl));