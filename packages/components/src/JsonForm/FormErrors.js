import React, { useState } from "react";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

const displayModes = {
  STATIC: 'static',
  INLINE: 'inline',
  DIALOG: 'dialog',
}

function FormErrors(props) {
  const { errors, data, show, displayMode, t } = props;
  
  const [showErrors, setShowErrors] = useState(false);

  if (!show || !errors?.length) return null;

  const buildErrorsList = ()=> {
    return <ul>
      {(errors || []).map(err => {
        return <li>{err.message}</li>
      })}
    </ul>;
  }

  if (!displayMode || displayMode === displayModes.STATIC && show) {
    return (
      <div aria-live="polite" class="dataform-inline-message p-component dataform-inline-message-error p-mt-2 p-mb-2" role="alert">
        {buildErrorsList()}
      </div>
    );
  }

  let lblErrorsBtn = t("showErrors", "Ver erros");
  if (showErrors && props?.displayMode !== displayModes.DIALOG) {
    lblErrorsBtn = t("hideErrors", "Ocultar erros");
  }  

  const footer = (
    <div>
        <Button label={t("close", "Fechar")} onClick={()=>setShowErrors(false)} />
    </div>
  );  

  return (
    <>
      {<div className="p-text-right">
        <Button label={lblErrorsBtn} className="p-button-danger p-button-text"
          onClick={(e) => setShowErrors(!showErrors)}
       />
      </div>}
        { props?.displayMode === displayModes.DIALOG ? <Dialog header={props?.title || "Erros do formulário"} footer={footer} visible={showErrors} style={{ width: '50vw' }}  onHide={() => setShowErrors(false)}>
            <div aria-live="polite" class="dataform-inline-message p-component dataform-inline-message-error p-mt-2 p-mb-2" role="alert">
              {buildErrorsList()}
            </div>
          </Dialog> :
          showErrors &&
            <div aria-live="polite" class="dataform-inline-message p-component dataform-inline-message-error p-mt-2 p-mb-2" role="alert">
              {buildErrorsList()}
            </div>
          }
      </>    
  )

}

export default FormErrors;