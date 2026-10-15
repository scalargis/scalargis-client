import React, { useEffect, useState } from 'react';

import { Alert, Button, Group, Stack } from '@mantine/core';
import { IconCheckCircle, IconEnvelope, IconXCircle } from '@scalargis/ui';

import { i18n as i18nUtils } from '../../components';


/** Sends the activation email again through `onResend`, at most once per `cooldown` seconds. */
function ResendConfirmationButton({ onResend, cooldown = 60, hint }) {

  const [seconds, setSeconds] = useState(cooldown);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const resend = () => {
    setSending(true);
    setResult(null);
    Promise.resolve()
      .then(() => onResend())
      .then(() => setResult('sent'))
      .catch(() => setResult('error'))
      .finally(() => {
        setSending(false);
        setSeconds(cooldown);
      });
  };

  const label = seconds > 0
    ? i18nUtils.translateValue("resendEmailIn", "Reenviar email ({{seconds}} s)", undefined, undefined, undefined, { seconds })
    : i18nUtils.translateValue("resendEmail", "Reenviar email");

  const hintText = hint === undefined
    ? i18nUtils.translateValue("resendEmailHint", "Não recebeu o email? Verifique a pasta de SPAM ou peça um novo email.")
    : hint;

  return (
    <Stack align="center" gap="xs" my="md">
      { hintText && <span className="text-center line-height-3">{hintText}</span> }
      <Button
        type="button"
        variant="light"
        leftSection={<IconEnvelope />}
        loading={sending}
        disabled={seconds > 0}
        onClick={resend}
      >{label}</Button>
      { result === 'sent' &&
        <Alert color="success" py="xs">
          <Group justify="center" gap="xs" wrap="nowrap">
            <IconCheckCircle />
            <span>{i18nUtils.translateValue("resendEmailSent", "O email de ativação foi enviado novamente.")}</span>
          </Group>
        </Alert> }
      { result === 'error' &&
        <Alert color="danger" py="xs">
          <Group justify="center" gap="xs" wrap="nowrap">
            <IconXCircle />
            <span>{i18nUtils.translateValue("unavailableService", "Serviço Indisponível")}</span>
          </Group>
        </Alert> }
    </Stack>
  );
}

export default ResendConfirmationButton;
