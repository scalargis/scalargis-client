import React from 'react';
import { useTranslation} from "react-i18next";
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

function Page404({ history }) {

  const { t } = useTranslation();

  const { navigate } = useNavigate();

  return (
    <div className="flex justify-content-center" style={{ height: '100%' }}>
      <div className="align-self-center p-6 sm:p-8" style={{ backgroundColor: 'white' }}>
        <h1>{t("pageNotFound", "Página não encontrada")}</h1>
        <p>{t("viewerNotFound", "O visualizador solicitado não existe.")}</p>
        <p>{t("goHomeMsg", "Clique para ir para a página inicial")}</p>
        <p className="text-center pt-4">
          <Button label={t("Home", "Página Inicial")} onClick={e => navigate("/")}></Button>
        </p>
      </div>
  </div>
  )
}

export default Page404;