import React, { useState } from "react";
import { Button, Group, Modal } from '@mantine/core';

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
      {(errors || []).map((err, k) => {
        return <li key={k}>{err.message}</li>
      })}
    </ul>;
  }

  if (!displayMode || displayMode === displayModes.STATIC && show) {
    return (
      <div aria-live="polite" className="dataform-inline-message p-component dataform-inline-message-error mt-2 mb-2" role="alert">
        {buildErrorsList()}
      </div>
    );
  }

  let lblErrorsBtn = t("showErrors", "Ver erros");
  if (showErrors && props?.displayMode !== displayModes.DIALOG) {
    lblErrorsBtn = t("hideErrors", "Ocultar erros");
  }

  return (
    <>
      {<div className="text-right">
        <Button variant="subtle" color="danger"
          onClick={(e) => setShowErrors(!showErrors)}>
          {lblErrorsBtn}
        </Button>
      </div>}
        { props?.displayMode === displayModes.DIALOG ?
          <Modal title={props?.title || "Erros do formulário"} opened={showErrors} size="50vw" onClose={() => setShowErrors(false)}>
            <div aria-live="polite" className="dataform-inline-message p-component dataform-inline-message-error mt-2 mb-2" role="alert">
              {buildErrorsList()}
            </div>
            <Group justify="flex-end" mt="md">
              <Button onClick={()=>setShowErrors(false)}>{t("close", "Fechar")}</Button>
            </Group>
          </Modal> :
          showErrors &&
            <div aria-live="polite" className="dataform-inline-message p-component dataform-inline-message-error mt-2 mb-2" role="alert">
              {buildErrorsList()}
            </div>
          }
      </>
  )

}

export default FormErrors;
