import React from 'react'
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

function Page401() {

  const { navigate } = useNavigate()

  return (
    <div className="flex justify-content-center" style={{ height: '100%' }}>
      <div className="align-self-center p-6 sm:p-8" style={{ backgroundColor: 'white' }}>
        <h1>Ops...</h1>
        <p>Não está autorizado a aceder ao visualizador pedido.</p>
        <p>Clique para voltar a página inicial ou clique para efetuar login</p>
        <p className="text-center pt-4">
          <Button label="Página Inicial" onClick={e => navigate("/")}></Button>{' '}
          <Button label="Entrar" onClick={e => navigate("/login")}></Button>
        </p>
      </div>
  </div>
  )
}

export default Page401;