# ExportMapFeatures

Ferramenta por-camada do TOC que deixa o utilizador **selecionar geometrias clicando no mapa** e **exportá-las como GeoJSON**. Aparece como uma tabelinha "Selecionar Elementos" na row de uma camada vetorial, por baixo dos ícones de ferramentas (lápis/remover/info/opacidade).

- `src/Main.jsx` — o componente
- `src/index.css` — estilo (`.export-map-features`)
- `src/config.example.json` — exemplo de montagem

## O que faz

1. Um **Switch "Selecionar Elementos"** liga/desliga um `ol/interaction/Select` limitado à camada da row.
2. Com o switch ligado, cada clique numa feature adiciona uma row à tabela:
   - **Geometria** → botão *Exportar* → descarrega `selecao.geojson` (a geometria **dessa** row).
   - **Ponto** → botão *Exportar* → descarrega `coordenada.geojson` (a coordenada clicada como ponto).
   - Cada label tem um ícone de ajuda (ⓘ) com tooltip: *"O ponto onde clicou no mapa"* / *"A geometria que selecionou no mapa"*, para o utilizador perceber que **"Ponto" é a coordenada do clique** (não uma geometria dos dados) e **"Geometria" é a feature selecionada**.
3. A exportação é **inteiramente client-side** (`ol/format/GeoJSON` + um `<a download>` com data-URI); não toca no servidor.

### Seleção múltipla e export por-row (nota de manutenção)

A tabela renderiza **uma row "Geometria" por feature selecionada** (`selected.items.map`). Com clique simples o `Select` substitui a seleção (1 feature = 1 row); com **shift+clique** a seleção acumula e aparecem várias rows. Cada botão exporta a **sua própria** feature: `onClick={() => exportSelected([feat])}`.

Dois bugs pré-existentes (iguais na versão Prime) impediam isto de funcionar, corrigidos juntos:

1. **A seleção lia o delta do evento, não a coleção.** O handler fazia `setSelected({ items: e.selected })`, mas num `SelectEvent` o `e.selected`/`e.deselected` são só o **delta daquele clique** — a seleção corrente vive em `select.getFeatures()`. Resultado: cada shift+clique substituía a linha pela última feature e **nunca acumulava** (selecionar 3 mostrava sempre 1 row). Além disso o `if (e.selected.length)` ignorava eventos de **desseleção**, deixando estado stale. Passou a ler `select.getFeatures().getArray()` em cada evento, por isso a tabela reflete a seleção completa e a desseleção remove a row.
2. **O botão exportava a seleção toda.** `exportSelected` escrevia `selected.items` inteiro e ignorava o `feat` da row — todas as rows exportavam tudo. Passou a `exportSelected([feat])`, cada row exporta a sua geometria.

Só se notavam com seleção múltipla (shift+clique), por isso passaram despercebidos até ao re-teste do cluster C.

## Ativação: config-driven, não automático

**A ferramenta nunca aparece sozinha** — nem antes nem depois da migração Mantine. Tem de ser declarada na config do viewer (um componente `type: "ExportMapFeatures"` com `target: "layer_tools_block"`) **e** o seu id tem de constar nos `children` do componente TOC (ver secção abaixo). Sem isso, não monta. O mecanismo de montagem (`Core.renderComponents`) é o mesmo em Prime e em Mantine; a migração só trocou os widgets (`InputSwitch`→`Switch`, `Button` Prime→Mantine), não a forma como o componente se liga às camadas. Onde está declarado, mostra-se para **qualquer camada vetorial não-system** dessa árvore.

## Onde monta (contrato)

O componente é montado pelo `config_json.components[]` do viewer, com **`target: "layer_tools_block"`**. O `Core.renderComponents` percorre os componentes cujo `target` bate na região e renderiza-os para **cada row de camada** da árvore do TOC, passando a camada dessa row em `config.layer`.

Regiões do TOC (ver `TOC/src/TOC/Node.jsx`):

| Região | Onde | Gate |
|---|---|---|
| `layer_tools` | fila de **ícones** da row (flex, horizontal) | só `!data.system` |
| `layer_tools_block` | **bloco full-width** por baixo dos ícones (`.detail-container`, `width:100%`), visível quando a engrenagem está expandida | só quando expandida |

> **Usar `layer_tools_block`, não `layer_tools`.** A `.theme-tools` (região `layer_tools`) é `display:flex` de ícones — uma `<table>` lá dentro é esmagada para uma coluna de 1 caractere de largura (texto na vertical). O bloco full-width é o sítio semântico para conteúdo em tabela.

### Dependência obrigatória: a `children` do TOC

`renderComponents` filtra também por `parent.children.includes(c.id)` (`apps/viewer/src/app/Core.jsx`, ~linha 401), onde `parent` é o record do componente **TOC**. Ou seja, **o id do ExportMapFeatures tem de constar na lista `children` do componente TOC**, senão nunca monta — sem erro, simplesmente não aparece.

```jsonc
{
  "id": "toc",
  "type": "TOC",
  "target": "mainmenu",
  "children": ["3", "4", "5", "7", "2", "ExportMapFeatures"]  // ← o id tem de estar aqui
}
```

Foi exatamente esta a armadilha no viewer de teste `cluster-c`: a children dizia `"exportfeat"` (≠ id `"ExportMapFeatures"`), e o componente era silenciosamente excluído.

## Quando aparece (e quando não)

Renderiza `null` (sem UI) se qualquer uma falhar:

1. **Camada não encontrada no mapa** — resolve a camada OL por id (`layer.id === olLayer.get('id')`). Se a camada ainda não foi adicionada ao mapa, não há nada a mostrar.
2. **Fonte não é `VectorSource`** — só faz sentido para vetorial (GeoJSON, WFS, KML, GML, camadas de desenho). Numa camada raster (WMS/WMTS/Tile) devolve `null`.
3. **Camada `system`** — o `layer_tools_block` mostra-se com a row expandida, mas as camadas `system` (ex. a "Camada do Utilizador" de rascunho) tipicamente não abrem a engrenagem de ferramentas. Testar com uma camada **não-system** (um GeoJSON/WFS carregado).

## Resolução da camada OL (nota de manutenção)

A camada OL é resolvida **por-render** com uma travessia recursiva do mapa:

```js
const olLayer = findOlLayer(layer.id);   // percorre mainMap.getLayers() (recursivo em grupos)
```

**Não memoizar isto com `useMemo([mainMap, layer.id])`.** As ferramentas do TOC montam quando o tema entra na árvore — *antes* de a camada OL ser adicionada ao mapa (a adição é assíncrona). Como nem `mainMap` nem `layer.id` mudam quando a camada aparece, um `useMemo` resolve `undefined` uma vez e **congela** aí para sempre (era este o bug C-12). O TOC re-renderiza quando os temas mudam, e a instância OL é estável, por isso o lookup por-render apanha a camada assim que ela existe e o `useEffect([olLayer, mainMap])` (que instala o `Select`) corre exatamente uma vez.

## Carregar uma camada de teste

Para exercitar o componente é preciso uma camada vetorial não-system. Serve o **ThemeWizard → GeoJSON**, seja pela aba **URL** (carrega no cliente, sem servidor) ou pela aba **Ficheiro** (upload ao `spatial_toolbox`; o C-26 corrigiu o servidor a aceitar `.json`, que o fiona antes recusava). Para testar o export por-row com seleção múltipla, carrega um ficheiro com várias features e usa **shift+clique** no mapa.

## Referências

- Guia geral de componentes/extensões: `references/architecture/components-extensions/`
- Diagnóstico completo do C-12 (as 3 causas empilhadas): `references/projects/client/migration2/mantine/qa/cluster-c-walkthrough.md` (secção `### C-12`)
