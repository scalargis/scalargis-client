import React from 'react'
import { Button } from 'primereact/button';
import { withRouter } from 'react-router-dom';

function Page401({ history }) {
  return (
    <div className="p-d-flex p-jc-center" style={{ height: '100%' }}>
      <div className="p-as-center" style={{ backgroundColor: 'white', padding: '6rem' }}>
        <h1>Ops...</h1>
        <p>Não está autorizado a aceder ao visualizador pedido.</p>
        <p>Clique para voltar a página inicial ou clique para efetuar login</p>
        <p>
          <Button label="Página Inicial" onClick={e => history.push({ pathname: "/" })}></Button>{' '}
          <Button label="Entrar" onClick={e => history.push({ pathname: "/login" })}></Button>
        </p>
      </div>
  </div>
  )
}

export default withRouter(Page401);