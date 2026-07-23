import React from 'react';
import { useNavigate } from 'react-router';
import { Button, Group } from '@mantine/core';

function Page401() {
  // Routing
  const navigate = useNavigate();

  return (
    <div className="flex justify-content-center" style={{ height: '100%' }}>
      <div className="align-self-center p-8" style={{ backgroundColor: 'white' }}>
        <h1>Ops...</h1>
        <p>Não está autorizado a aceder à página pedida.</p>
        <p>Clique para voltar à página inicial ou para efetuar login</p>
        <Group gap="sm" mt="md">
          <Button onClick={e => navigate("/")}>Página Inicial</Button>
          <Button onClick={e => navigate("/login")}>Entrar</Button>
        </Group>
      </div>
    </div>
  )
}

export default Page401;
