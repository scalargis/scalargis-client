# ContactForm

Formulário de contacto do viewer: **Nome / Email / Descrição**, anexos opcionais e um bloco de
**informação de contacto** em HTML. Submete para `POST {API_URL}/app/viewer/{viewer_id}/contact_message`.

- `src/Main.jsx` — os dois exports (`MainMenu` e `default`) e os triggers de cada target
- `src/ContactForm.jsx` — o formulário em si (validação + submit + upload)
- `src/ContactInfo.jsx` — o bloco HTML de contactos (usado dentro do form e em vez dele com `hideForm`)
- `src/index.css` — estilo do trigger do rodapé (`.contactform-footer-button`)
- `src/config.example.json` — exemplo de montagem
- `src/Main.spec.jsx` — testes dos triggers por região

## Onde monta (targets)

O componente é montado pelo `config_json.components[]` do viewer. **Não há target automático**: sem um
record com `type: "ContactForm"`, não aparece.

| `target` | Quem monta | O que aparece |
|---|---|---|
| `mainmenu` | `Core.renderMainMenu` (export `MainMenu`) + `Core.renderComponents({ region: 'mainmenu', as: 'panel' })` (export `default`) | Botão no rail do menu lateral; ao selecionar, o form abre num `CollapsiblePanel` dentro do painel |
| `mainmenu` **com `"as": "popup"` no record** | export `MainMenu`, ramo popup | Botão no rail que abre o form num **modal**, sem ocupar o painel (ver nota) |
| `topbar_right` | `TopbarRight.jsx` (export `default`) | Ícone de envelope na tira do topbar (`layout-topbar-icon`), abre o modal |
| `footer_left` | `FooterLeft.jsx` (export `default`) | Envelope **à escala do rodapé** + label, ao lado do "© … ScalarGIS"; abre o modal |
| `footer_right` | `FooterRight.jsx` (export `default`) | O mesmo, no canto direito do rodapé (onde já vive o CRSSelect) |

> **`footer_left`/`footer_right` são os valores de `target`; `layout-footer` é a classe CSS** da tira
> (`apps/viewer/src/app/core/components/Layout.jsx`). Não é um target.

> **Nota sobre `mainmenu` + `"as": "popup"`:** o `record.as` chega aos **dois** exports
> (`renderComponents` passa `as={c.as || as}`). O rail fica com o modal, como se quer, mas o export
> `default` também é renderizado no painel com `as: 'popup'` — cai no ramo genérico e emite lá um
> trigger de topbar. Na prática não se vê (o painel só se mostra quando o menu está selecionado, e com
> este ramo o botão do rail nunca o seleciona), mas é um resíduo pré-existente do contrato, não um
> desenho. Os targets exercidos ao vivo foram `mainmenu` (painel), `topbar_right` e o rodapé.

### Nota de manutenção: o rodapé nunca precisou de mexer no `Core.jsx`

As regiões do rodapé **já eram** montáveis: o `FooterLeft.jsx`/`FooterRight.jsx` chamam
`core.renderComponents({ region: 'footer_left' | 'footer_right', as: "popup" })` e o
`Core.renderComponents` filtra por `c.target === region` como em qualquer outra região — é o mesmo
mecanismo que põe o **CRSSelect** no `footer_right` desde sempre.

O que faltava era do lado do componente: o ramo genérico do `Main` emitia markup do topbar
(`layout-topbar-item-text` / `layout-topbar-icon`), que no rodapé pintava um envelope à escala errada
e no meio do chrome errado. O `Main` passou a olhar para a prop `region` e a usar um trigger próprio
(`.contactform-footer-button`) nas duas regiões do rodapé. O modal é **o mesmo** de todos os targets —
só muda o trigger.

## Chaves de `config_json`

Todas opcionais.

| Chave | Default | O que faz |
|---|---|---|
| `header` | `record.title`, senão `"Formulário de Contacto"` | Título do modal / do painel |
| `closeLabel` | `"Fechar"` | Label do botão que fecha o modal |
| `footerLabel` | `"Contacto"` | **Só nos targets do rodapé.** Texto ao lado do envelope. `""` deixa o trigger **só com o ícone**; abaixo de 667px o label esconde-se sozinho e fica só o ícone |
| `hideForm` | `false` | `true` mostra **apenas** o `ContactInfo` (bloco HTML), sem formulário |
| `hideContactInfo` | `false` | `true` esconde o bloco de contactos dentro do formulário |
| `contact_info` | `viewer.contact_info` | HTML injetado com `dangerouslySetInnerHTML`. Aceita string, ou objeto `{ "default": "…", "pt": "…", "en": "…" }` escolhido pelo idioma resolvido |
| `requiredFieldMessage` | `"Campo de preenchimento obrigatório"` | Mensagem por baixo dos campos obrigatórios |
| `upload` | — | Ver abaixo. Sem `upload.enabled: true` não há anexos |

### `config_json.upload`

| Chave | Default | O que faz |
|---|---|---|
| `enabled` | `false` | Liga o bloco "Anexos" |
| `minFiles` | — | Mínimo de ficheiros; validado no submit |
| `maxFiles` | — | Máximo de ficheiros; validado no submit |
| `maxFileSize` | `1000000` | Bytes. Também alimenta o "Tamanho máximo do ficheiro: X MB" |
| `accept` | `"image/*, application/pdf"` | Lista separada por vírgulas |
| `chooseLabel` / `cancelLabel` | `"Selecionar"` / `"Limpar"` | Labels dos botões do upload |
| `emptyMessage` | `"Arraste para aqui os ficheiros a enviar."` | Placeholder da drop zone |
| `invalidFileSizeMessageDetail` | `"Ficheiro com dimensão superior ao permitido ({0})."` | `{0}` é substituído pelo tamanho máximo em MB |

`invalidFileSizeMessageSummary` continua aceite na config mas **não é lido** pelo componente.

## Exemplo: montar no rodapé

```jsonc
{
  "id": "contactform_footer",
  "type": "ContactForm",
  "title": "",
  "target": "footer_left",          // ou "footer_right"
  "config_json": {
    "header": "Formulário de Contacto",
    "footerLabel": "Contacto",       // "" = só o envelope
    "contact_info": "<div>geral@exemplo.pt</div>",
    "upload": { "enabled": true, "maxFiles": 3, "maxFileSize": 3000000 }
  },
  "regions": [],
  "children": []
}
```

Resultado na tira do rodapé:

```
[© 2026 ScalarGIS  ✉ Contacto]                          [CRSSelect]
                        ↓ clique
              ┌────────────────────────┐
              │ Formulário de Contacto │
              └────────────────────────┘
```

## Gotchas

- **O envio depende de config do servidor.** O `send_viewer_contact_message` faz
  `os.path.exists(get_config_value('EMAIL_NOTIFICATIONS_FOLDER'))`; com o `EMAIL_NOTIFICATIONS_FOLDER`
  a `None` (é o caso do `development_local.py`) rebenta com `TypeError` **antes** de enviar. O
  formulário submete na mesma — a falha é de ambiente, não do componente.
- **`isMobile` é lido no render, não num listener de `resize`.** O tamanho do modal (`90%` vs `45vw`)
  vem de `getWindowSize()` (`core/utils.jsx`), que ninguém reavalia num resize; só muda quando algo
  provoca um re-render. É um problema transversal pré-existente (família B1-01/B1-12), não deste
  componente.
- **`hideForm: true` sem `contact_info`** (e sem `viewer.contact_info`) renderiza um modal vazio: o
  `ContactInfo` devolve `null` quando não há HTML.

## Referências

- Precedente do mesmo slot do rodapé: `libs/components/src/lib/CRSSelect/`
