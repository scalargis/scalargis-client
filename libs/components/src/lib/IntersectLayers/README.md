# IntersectLayers

Ferramenta de **interseção de temas**: o utilizador desenha (ou copia) uma geometria no mapa, opcionalmente
dá-lhe uma área de influência (buffer), carrega em *Executar*, e o componente devolve — agrupado por
tema — o que cruza com essa geometria, com área/comprimento e percentagem por registo. Monta na
**barra de menu esquerda** (é um `MainMenuButton`, não tem slot próprio) e está registado em
`libs/components/src/lib/components.tsx`.

Este é o IntersectLayers **de base**, não o do MapasPT.

- `src/Main.jsx` — o `MainMenu` (botão) e o `default` (o painel)
- `src/Intersect.jsx` — cria a camada OL `intersect` e aplica os `styles`
- `src/IntersectForm.jsx` — desenho, buffer, `maxArea`, o POST ao backend
- `src/IntersectResults.jsx` — resultados inline, export, e o diálogo de tabelas
- `src/components/ResultsTablesTabs.jsx`, `src/components/ResultsTable.jsx` — o conteúdo do diálogo
- `src/config.example.json` — sample de montagem (o do viewer)
- `src/server.config.example.json` — sample do `setting_value` do backend
- `src/config/styles.json` — estilos default da camada

## Antes de mexer na config: são três peças

A interseção é ponta-a-ponta. A config do componente **sozinha não chega** — precisa do `site_settings`
com o `code = config_id` e da função `intersects_layers` na DB. Isso, o fluxo do pedido, o schema do
`setting_value` e os gotchas do backend estão todos no guia, e **não** se repetem aqui:

→ **`references/guides/component_configure/configure-intersectlayers.md`**

Este README cobre só o que é do lado do componente: as chaves do `config_json` e o que cada uma faz.

## Chaves do `config_json`

Cada chave abaixo está atada à linha que a lê. O que não está nesta tabela, o componente não lê.

| Chave | Default | O que faz | Lido em |
|---|---|---|---|
| `config_id` | `null` | Vai como `code` no pedido → tem de bater certo com `site_settings.code`. Sem isto não há resultados. | `IntersectForm.jsx:260` |
| `apiUrl` | `/spatial_toolbox/api` + path `intersect` | Endpoint da análise. Também é a base do export, salvo override. | `IntersectForm.jsx:195`, `IntersectResults.jsx:104` |
| `header` | — | Título do `CollapsiblePanel`; também prefixa o header do diálogo de tabelas. | `Main.jsx:54`, `IntersectResults.jsx:250` |
| `btn_icon` | `pi pi-objects-column` | Ícone do botão do menu esquerdo. | `Main.jsx:37` |
| `btn_image` | — | Imagem de fundo do botão; **ganha ao `btn_icon`**. | `Main.jsx:22` |
| `content.title` | — | `<h3>` no topo do painel. | `IntersectForm.jsx:436` |
| `content.description` | — | Bloco de texto no topo, renderizado com **`dangerouslySetInnerHTML`** (aceita HTML; é config de admin). | `IntersectForm.jsx:438` |
| `drawTools` | `["Point","LineString","Polygon","Copy","Modify"]` | Ferramentas da barra de desenho. Ver o gotcha do `Select` mais abaixo. | `IntersectForm.jsx:64`, `utils.jsx:3` |
| `bufferOption` | `true` | O campo "Área de influência". Só desliga com **`false`** explícito. | `IntersectForm.jsx:460` |
| `maxArea` | — | Guard **client-side** em **m²** (notify de aviso, não submete). Só é avaliado para polígonos ou quando há buffer. | `IntersectForm.jsx:226,245,254` |
| `dataSrid` | projeção do mapa | **Não** muda o SRID enviado (a geometria vai sempre em 4326). Serve para (a) o cálculo do `maxArea` e (b) o `buffer_srid`, para o buffer ser em metros. | `IntersectForm.jsx:229,264` |
| `groupResults` | `false` | Junta as camadas por `group` na lista inline em vez de uma entrada por camada. | `IntersectForm.jsx:499` |
| `showExport` | `true` | A barra de export. Só desliga com **`false`**. | `IntersectResults.jsx:510` |
| `exportFormats` | `["xls","csv","pdf","gpkg"]` | Formatos. **Com mais de 3 a barra vira um menu dropdown**; até 3, botões soltos. | `IntersectResults.jsx:34,442` |
| `export.<formato>.apiUrl` | — | Override do endpoint só desse formato (ex. o `pdf`). | `IntersectResults.jsx:107` |
| `export_crs` | `viewer.export_crs` → `viewer.display_crs` | SRID dos ficheiros exportados. | `IntersectResults.jsx:111` |
| `showResultMeasure` | `true` | A coluna/célula de área ou comprimento. Desliga com **`false`**. | `IntersectResults.jsx:36` |
| `showResultPercentage` | `true` | A coluna/célula de `%`. Desliga com **`false`**. | `IntersectResults.jsx:37` |
| `showResultGeometries` | `true` | Com **`false`**, os resultados perdem as checkboxes de seleção — deixa de dar para pintar/zoomar a geometria de um registo. | `IntersectResults.jsx:409` |
| `highlightFeatures` | `true` | Pinta a feature ao clicar no registo. Desliga com **`false`**. | `IntersectResults.jsx:83` |
| `zoomToFeatures` | `true` | Faz zoom à feature ao clicar no registo. Desliga com **`false`**. | `IntersectResults.jsx:86` |
| `showTables` | `false` | Destranca o botão "Tabelas" → o diálogo de tabelas. Ver abaixo. | `IntersectResults.jsx:39,496` |
| `styles` | `src/config/styles.json` | Estilos OL da camada `intersect`, por chave (`output`, `results`, …). **Arrays acumulam** sobre os default; valores soltos substituem. | `Intersect.jsx:66-73` |

> **Repara no padrão `!== false`.** A maioria dos toggles está ligada por omissão e só desliga com o
> literal `false` — omitir a chave **não** a desliga. As exceções são o `groupResults` e o `showTables`,
> que são opt-in (`|| false` / `!!`).

`id`, `type`, `title` e `target` são do **record** do componente, não do `config_json`.

## O diálogo de tabelas (`showTables`)

Sem `showTables`, os resultados saem **só inline no painel esquerdo**, em lista expansível. Com
`showTables: true` aparece um botão **"Tabelas"** (`pi pi-table`) no cabeçalho dos resultados
(`IntersectResults.jsx:496`) que abre um `DialogWindow` com os mesmos resultados em **grelha, uma tab por
camada**, com filtros e ordenação por coluna (`ResultsTablesTabs.jsx` + `ResultsTable.jsx`).

O diálogo **não é configurável**. O `showTable()` (`IntersectResults.jsx:247`) fixa em código o
`maximizable: true`, o `style { width: '75vw', height: '75vh' }` e a `className`, e não despacha `modal`
— logo o `DialogWindows` assume modal (`withOverlay={modal !== false}`). A única coisa que a config lhe
dá é o **header**, via `header` (fica `<title do record> - <header>`).

> **`dialogOptions` não faz nada aqui.** A linha `IntersectResults.jsx:278` faz
> `Object.assign({}, data?.dialogOptions)` sobre um `const data = {}` declarado duas linhas acima — é
> **código morto**, o `data` nunca traz nada. Pôr `dialogOptions` na config do IntersectLayers não muda
> o diálogo. (Quem lê `dialogOptions` a sério é o **DocumentBrowser**, `DocumentBrowser/src/Main.jsx:31`.)

**Filtro de grupos.** O MultiSelect "Grupos:" no topo do diálogo é alimentado pelo array `groups` do
backend, cruzado com o `group` de cada camada (`ResultsTablesTabs.jsx:24`). Se o `setting_value` não
declarar `groups`, o diálogo abre na mesma e mostra todas as tabs, mas o filtro fica **vazio e inútil**.

## Gotchas do lado do componente

**1. `as: 'popup'` não é suportado.** Ao contrário do DocumentBrowser, do PanelHTML, do PanelJSON, do
Print e do HelpButton, o `Main.jsx` do IntersectLayers só distingue `as === 'panel'` (`Main.jsx:76`) —
não tem ramo de popup. O `as` é uma chave do **record** (irmã do `id`/`target`, **não** dentro do
`config_json`), e o `Core` usa `as={c.as || as}` (`apps/viewer/src/app/Core.jsx:430`). Pôr `as: 'popup'`
num IntersectLayers não abre diálogo nenhum: só faz o componente perder o `CollapsiblePanel` e sair sem
header. O único diálogo que este componente tem é o das tabelas, acima.

**2. `Select` nos `drawTools` quase nunca é o que queres — é o `Copy`.** Os seis valores válidos são os
do `DrawingToolbar` (`DrawingToolbar.jsx`): `Point`, `LineString`, `Polygon`, `Copy`, `Select`, `Modify`.
Mas o `Select` do IntersectLayers está filtrado a `layer.get('id') !== 'print'` (`IntersectForm.jsx:387`)
— só apanha features da camada do **Print**, e não faz nada com elas no fluxo da interseção. Quem copia a
geometria de uma camada do mapa para a análise é o **`Copy`** (`IntersectForm.jsx:103,112`), que está nos
default e pede confirmação antes de copiar. Várias configs por aí trazem `"Select"` e não trazem `"Copy"`,
o que dá uma ferramenta morta na barra e tira a útil.

**3. O `maxArea` é em m² e o exemplo antigo tinha `1000`** — ≈30×30 m, pequeno demais para desenhar à
mão. Para dados nacionais (CAOP) `1e8` (100 km²) é um valor sensato.

**4. Uma geometria de cada vez.** Cada `drawend`/`Copy` limpa as features anteriores deste componente
(`IntersectForm.jsx:91,120`) — não há multi-geometria.

## Sample

[`src/config.example.json`](src/config.example.json) — a montagem do viewer, na versão que corresponde ao
setup de teste `cc_intersect` (Concelhos + Freguesias CAOP, SRID 3763), verificado contra o endpoint.
O par do backend está em [`src/server.config.example.json`](src/server.config.example.json) e o
`setting_value` de teste completo em `references/configs/site/cc_intersect.site_setting.json`.

## Referências

- Guia de configuração ponta-a-ponta: `references/guides/component_configure/configure-intersectlayers.md`
- Guia geral de componentes/extensões: `references/architecture/BUILDING_COMPONENTS_AND_EXTENSIONS.md`
