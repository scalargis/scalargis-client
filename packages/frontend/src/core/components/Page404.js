import React from 'react'
import { Button } from 'primereact/button';
import { withRouter } from 'react-router-dom';

function Page404({ history }) {
  return (
    <div className="p-d-flex p-jc-center" style={{ height: '100%' }}>
      <div className="p-as-center" style={{ backgroundColor: 'white', padding: '6rem' }}>
        <h1>Ops...</h1>
        <p>O visualizador pedido não existe.</p>
        <p>Clique para voltar a página inicial</p>
        <p>
          <Button label="Página Inicial" onClick={e => history.push({ pathname: "/" })}></Button>
        </p>
      </div>
  </div>
  )
}

export default withRouter(Page404);