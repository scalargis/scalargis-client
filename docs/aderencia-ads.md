# Aderência ao Ágora Design System (ADS)

Este documento descreve como o `scalargis-client` adere ao Ágora Design System (ADS), o sistema de design da Administração Pública portuguesa. Explica a via de aderência escolhida, onde vive no código e o que fica dentro e fora do âmbito.

## A via de aderência

O ADS permite duas vias. Uma é adotar os componentes React do próprio ADS e conduzi-los pela sua configuração Tailwind. A outra, a via das **normas de construção** (artigo 2.5.6), permite tecnologia alternativa desde que as normas sejam seguidas com rigor: adotam-se os tokens, as regras e o piso de acessibilidade, sem embarcar os componentes do ADS.

O `scalargis-client` segue a via 2.5.6. O ADS fornece a camada de tokens (cor, tipografia, espaçamento) e o contrato de acessibilidade WCAG 2.1 AA; a Mantine fornece a camada de componentes que obedece a essa camada. A superfície de mapa OpenLayers e o modelo de plugins não encaixam no modelo de aplicação do ADS, por isso a via das normas é a adequada.

O estado a comunicar é honesto e condicional: o cliente está **alinhado por tokens e por acessibilidade** com o ADS pela via das normas de construção. Não usa o pacote nem os componentes do ADS, e não tem adesão formal nem o Selo de Usabilidade e Acessibilidade da AP.

## Onde vive no código

A aderência está encapsulada em `libs/ui`, na pasta `src/theme/`, e aplica-se pelo provider `AdsProviders` de `@scalargis/ui`, que monta o `MantineProvider` sobre o tema base em ambos os apps. Três ficheiros formam o núcleo: `ads-mantine-theme.ts` traduz as restrições do ADS para o `createTheme()` da Mantine; `ads-tokens.css` expõe os tokens crus como propriedades CSS personalizadas para o CSS escrito à mão; `ads-globals.css` carrega as regras de acessibilidade que o objeto de tema da Mantine não consegue exprimir. A ordem de carregamento de CSS é fixa: estilos do `@mantine/core`, depois `ads-tokens.css`, depois `ads-globals.css`.

## Cor

As paletas do ADS vão de 50 a 900 e mapeiam diretamente no tuple da Mantine de índice 0 a 9. A fundação de cor é **imutável**: `neutral`, `informative`, `success`, `warning` e `danger` não podem ser alterados. Só a `primary` e a `secondary` são marcáveis, e apenas por um tema de cliente. O `primaryShade` é 5, porque o "main" do ADS é o tom 500. O texto de corpo é `neutral-900` (12.4:1 em branco), nunca preto puro. O `autoContrast` com `luminanceThreshold` de 0.3 escolhe rótulo preto ou branco por luminância, o que mantém o branco fora do preenchimento claro do `warning-500`.

## Tipografia

A Noto Sans é a única família tipográfica, servida localmente. A escala de tamanhos é a do ADS: `sm` 14, `md` 16 (base), `lg` 20, `xl` 24, mais os títulos de h1 (40) a h6 (14) com os pesos e alturas de linha do ADS. O tamanho `xs` de 11 é um desvio documentado, reservado aos elementos de interface do mapa e das barras de ferramentas, nunca para texto de corpo.

## Espaçamento, raio e sombra

O espaçamento assenta na grelha de 8px (`xs` 8, `sm` 16, `md` 24, `lg` 32, `xl` 48). O raio vai de 4 a 32, com 8 por omissão para botões, campos e cartões. As sombras seguem a escala `bottom-*` do ADS. Os breakpoints sancionados pelo ADS são o `xs` (360), o `md` (768) e o `xl` (1280); o `sm` e o `lg` são interpolados para preencher a escala da Mantine.

## Acessibilidade

O WCAG 2.1 AA é obrigatório e legal (DL 83/2018), não opcional, e é imposto no tema base. O anel de foco é magenta (`#F408FC`), 2px sólido com 2px de offset, deliberadamente fora do tom de marca para se manter visível sobre qualquer controlo colorido; aplica-se a todo o `:focus-visible` e é reforçado nos quatro componentes que pintam o anel num elemento irmão (Switch, Chip, Rating, SegmentedControl). O foco nunca é removido sem substituto.

O movimento reduzido é honrado por dois caminhos com o mesmo efeito: a preferência do sistema operativo (`prefers-reduced-motion`) e um interruptor de projeto. Os indicadores de carregamento são informação de estado, por isso a sua animação é re-afirmada em ambos os caminhos para um indicador parado não se ler como bloqueio. O contraste é corrigido onde a Mantine falhava o piso: o texto `dimmed` passa a `neutral-7` (4.9:1) e as molduras a `neutral-3`. As ligações têm sublinhado por omissão (não sinalizar por cor apenas). O alvo de toque de 44px é opt-in, pela classe `.ads-touch-target`, para não distorcer as tabelas densas do backoffice, mas o piso de 24px do WCAG mantém-se sempre.

## Defaults de componente

Os valores por omissão são poucos e ao nível do padrão. Todos os controlos de introdução de dados (campos de texto, número, palavra-passe, listas de seleção, seletores de data e afins) tomam a altura de ~42px pela `size: 'md'`, para nenhum campo aparecer mais baixo do que o vizinho. O `ActionIcon` (botão só com ícone) toma a `size: 'lg'` e exige `aria-label` de quem o usa. As camadas sobrepostas seguem a escada de z-index do ADS (painel lateral 5000, caixa de diálogo 6000, notificação 7000, dica 8000), com as listas pendentes temporárias acima do diálogo que as gera, para não ficarem escondidas por trás dele. O `Accordion` é emoldurado por omissão, compacto e com contorno.

## Só claro

O ADS é um sistema só de tema claro. O `AdsProviders` força o esquema claro; um esquema escuro seria uma especificação própria, fora deste âmbito.

## A fronteira mutável e imutável

Esta é a linha que mantém um tema de cliente como uma mudança de aparência e não como uma bifurcação do sistema. Um tema de cliente pode alterar **apenas** a `primary` e a `secondary` (os dois pontos de marca autorizados). Ficam fixos: a `neutral` e o resto da fundação de cor, a família e a escala tipográfica, o espaçamento, o raio, as sombras, os limiares de ecrã e todos os pisos de acessibilidade. Um tema que precise de mexer numa dessas superfícies deixa de ser uma mudança de aparência e tem de ser levado a decisão.

## O que fica fora do âmbito

De propósito, não aderem: a **superfície de mapa OpenLayers e os seus elementos de interface densos**, porque o ADS não tem conceito de mapa, e ficam como desvios documentados (o tamanho `xs` de 11px para esses elementos, a banda de z-index abaixo das camadas sobrepostas para os diálogos cobrirem sempre o mapa); os **componentes React do ADS**, para os quais se renderizam equivalentes Mantine, sendo o comportamento e o contrato de acessibilidade do ADS a referência a igualar, não o seu código; o **Tailwind**, cuja configuração de tema se traduz no `createTheme()` e em propriedades CSS personalizadas; e os **elementos federados do gov.pt** (cabeçalho unificado, rodapé federado, ligações de início de sessão único), que são uma obrigação de integração de portal e não de tokens de tema.
