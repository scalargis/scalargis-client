import React from 'react';
import { Button } from 'primereact/button';

const messages = {
  network: 'Não foi possível contactar o servidor.',
  server: 'O servidor respondeu com um erro.',
  invalid: 'O servidor enviou uma resposta inválida.'
};

/** Error page of the backoffice boot, with a retry that keeps the session. */
function PageBootError({ error, onRetry }) {
  const message = messages[error?.kind] || messages.invalid;
  const status = error?.kind === 'server' && error?.status ? ` (HTTP ${error.status})` : '';

  return (
    <div className="flex justify-content-center" style={{ height: '100%' }}>
      <div className="align-self-center p-8" style={{ backgroundColor: 'white' }} role="alert">
        <h1>Ops...</h1>
        <p>{message}{status}</p>
        <p>A sua sessão mantém-se. Tente de novo dentro de momentos.</p>
        <p>
          <Button label="Tentar de novo" onClick={onRetry}></Button>
        </p>
      </div>
    </div>
  )
}

export default PageBootError;
