import React from 'react';
import { useTranslation} from "react-i18next";
import { useNavigate } from 'react-router';
import { Button, Group } from '@mantine/core';

function Page404({ history }) {

  const { t } = useTranslation();

  const navigate = useNavigate();

  return (
    <div className="flex justify-content-center" style={{ height: '100%' }}>
      <div className="align-self-center p-6 sm:p-8" style={{ backgroundColor: 'white' }}>
        <h1>{t("pageNotFound", "Página não encontrada")}</h1>
        <p>{t("viewerNotFound", "O visualizador solicitado não existe.")}</p>
        <p>{t("goHomeMsg", "Clique para ir para a página inicial")}</p>
        <Group justify="center" pt="md">
          <Button onClick={e => navigate("/")}>{t("Home", "Página Inicial")}</Button>
        </Group>
      </div>
  </div>
  )
}

export default Page404;