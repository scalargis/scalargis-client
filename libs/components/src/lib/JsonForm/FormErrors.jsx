import React from "react";
import { Button, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Dialog } from '@scalargis/ui';

const displayModes = {
  STATIC: 'static',
  INLINE: 'inline',
  DIALOG: 'dialog',
}

function FormErrors(props) {
  const { errors, data, show, displayMode, t } = props;

  const [showErrors, { toggle, close }] = useDisclosure(false);

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
          onClick={toggle}>
          {lblErrorsBtn}
        </Button>
      </div>}
        { props?.displayMode === displayModes.DIALOG ?
          <Dialog title={props?.title || "Erros do formulário"} opened={showErrors} size="50vw" onClose={close}
            footer={
              <Group justify="flex-end">
                <Button onClick={close}>{t("close", "Fechar")}</Button>
              </Group>
            }>
            <div aria-live="polite" className="dataform-inline-message p-component dataform-inline-message-error mt-2 mb-2" role="alert">
              {buildErrorsList()}
            </div>
          </Dialog> :
          showErrors &&
            <div aria-live="polite" className="dataform-inline-message p-component dataform-inline-message-error mt-2 mb-2" role="alert">
              {buildErrorsList()}
            </div>
          }
      </>
  )

}

export default FormErrors;
