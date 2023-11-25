import React from 'react';
import { useTranslation} from "react-i18next";
import { Button } from 'primereact/button';
import { withRouter } from 'react-router-dom';

function Page404({ history }) {

  const { t } = useTranslation();

  return (
    <div className="p-d-flex p-jc-center" style={{ height: '100%' }}>
      <div className="p-as-center" style={{ backgroundColor: 'white', padding: '6rem' }}>
        <h1>{t("pageNotFound", "Página não encontrada")}</h1>
        <p>{t("viewerNotFound", "O visualizador solicitado não existe.")}</p>
        <p>{t("goHomeMsg", "Clique para ir para a página inicial")}</p>
        <p>
          <Button label={t("Home", "Página Inicial")} onClick={e => history.push({ pathname: "/" })}></Button>
        </p>
      </div>
  </div>
  )
}

export default withRouter(Page404);