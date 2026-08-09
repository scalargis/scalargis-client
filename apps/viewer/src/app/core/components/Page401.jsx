import React from 'react'
import { useNavigate } from 'react-router';
import { Button, Group } from '@mantine/core';

function Page401(props) {

  const navigate = useNavigate();

  return (
    <div className="flex justify-content-center" style={{ height: '100%' }}>
      <div className="align-self-center p-6 sm:p-8" style={{ backgroundColor: 'white' }}>
        <h1>Ops...</h1>
        <p>Não está autorizado a aceder ao visualizador pedido.</p>
        <p>Clique para voltar a página inicial ou clique para efetuar login</p>
        <Group justify="center" pt="md">
          <Button onClick={e => navigate("/")}>Página Inicial</Button>
          <Button onClick={e => navigate("/login")}>Entrar</Button>
        </Group>
      </div>
  </div>
  )
}

export default Page401;