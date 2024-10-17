import React from 'react';
import { useTranslation} from "react-i18next";
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

function Page404({ history }) {

  const { t } = useTranslation();

  const { navigate } = useNavigate();

  return (
    <div className="p-d-flex p-jc-center" style={{ height: '100%' }}>
      <div className="p-as-center" style={{ backgroundColor: 'white', padding: '6rem' }}>
        <h1>{t("pageNotFound", "Página não encontrada")}</h1>
        <p>{t("viewerNotFound", "O visualizador solicitado não existe.")}</p>
        <p>{t("goHomeMsg", "Clique para ir para a página inicial")}</p>
        <p>
          <Button label={t("Home", "Página Inicial")} onClick={e => navigate("/")}></Button>
        </p>
      </div>
  </div>
  )
}

export default Page404;