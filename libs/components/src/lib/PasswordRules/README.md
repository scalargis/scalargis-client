# PasswordRules

Checklist de requisitos de password **conduzida pela policy do servidor**, mais os _helpers_ que os
formulários usam para validar antes de submeter. Uma só fonte para os cinco formulários que pedem uma
password (viewer e backoffice), para nenhum deles voltar a listar regras à mão.

- `index.jsx` — tudo: a tabela de regras, o _fetch_ da policy, os _helpers_ puros e o componente `PasswordRules`
- `PasswordRules.module.css` — a transição do _label_ (risca + esbate ao ser cumprido; respeita `prefers-reduced-motion`)
- `PasswordRules.spec.jsx` — testes do componente, dos _helpers_ e do _cache_ do _fetch_

Exportado pelo barril `libs/components/src/lib/components.tsx`, logo consome-se com
`import { PasswordRules, usePasswordPolicy, validatePasswordAgainstPolicy } from '@scalargis/components'`.

## Fonte de verdade: o servidor

As regras **não vivem aqui**. Vivem em `app/utils/password_policy.py` (server), numa tabela única
`_CHARACTER_RULES` mais o `MIN_LENGTH`. Essa tabela é percorrida por dois pontos:

- `validate_password()` — impõe a regra (é o que o `set_password`/`register_user` chamam, e o que
  devolve `failed_rules`);
- `describe_policy()` — publica a mesma regra como dados.

Por percorrerem a mesma tabela, uma regra nunca fica **imposta-mas-não-anunciada** nem o contrário.
`describe_policy()` é servido, **sem autenticação**, em `GET /api/security/password_policy` (o registo e o
reset precisam das regras antes de haver sessão) e devolve só metadados:

```json
{ "min_length": 12, "require_uppercase": true, "require_lowercase": true,
  "require_digit": true, "require_special": true }
```

### Configurável por _deploy_

Cada regra tem um _default_ (`_DEFAULTS`) e é sobreponível por config
`SCALARGIS_PASSWORD_<CHAVE>` (`MIN_LENGTH`, `REQUIRE_UPPERCASE`, `REQUIRE_LOWERCASE`, `REQUIRE_DIGIT`,
`REQUIRE_SPECIAL`) no `instance/…py`. Baixar o `MIN_LENGTH` para 8 ou desligar o `REQUIRE_SPECIAL` num
_deploy_ muda **ao mesmo tempo** o que os formulários dizem, o que aceitam antes de submeter e o que o
servidor impõe — sem uma linha de código editada dos dois lados.

### O que "uma vez arrancado o servidor" significa

`_get()` lê `current_app.config` **no momento do pedido**, mas a config é carregada no arranque
(`APP_CONFIG_FILE`). Na prática: o valor efetivo é o que estava na config quando o processo subiu, e
**mudá-lo obriga a reiniciar o servidor**. Consequência a ter presente: um servidor **já a correr não
serve o endpoint novo nem a policy nova até ser reiniciado** — um processo velho deixa o
`/security/password_policy` cair no _catch-all_ do SPA e devolve o HTML do viewer; o cliente, ao não
conseguir _parse_ do JSON, não mostra checklist nenhuma (ver "Degradação" abaixo).

## O que o cliente ainda tem (e porquê)

O único que este módulo detém é a **classe de caracteres que cada regra significa** — a tabela
`CHARACTER_RULES` (`uppercase = /[A-Z]/`, etc.), que espelha as _regex_ do servidor. A policy do servidor
diz **quais** regras estão ligadas e **que comprimento**; o cliente diz **o que conta** como maiúscula ou
símbolo, para poder pintar a checklist e fazer o pré-check sem uma ida à API por tecla. O `failed_rules`
do servidor continua a ser a autoridade.

## API (exports)

| Export | O quê |
|---|---|
| `usePasswordPolicy(apiUrl)` | _hook_; devolve a policy (ou `null`). `apiUrl` é a base `/api` de cada app |
| `fetchPasswordPolicy(apiUrl)` | o _fetch_ por baixo do _hook_; **um pedido por base por _page load_** (_cache_ partilhado) |
| `resetPasswordPolicyCache()` | limpa o _cache_ (testes / _re-fetch_ deliberado) |
| `getPasswordRules(policy)` | as regras ativas da policy, com `text` e `test`, por ordem |
| `validatePasswordAgainstPolicy(policy, password)` | os `id`s das regras quebradas (os mesmos do `failed_rules`); `[]` sem policy |
| `PasswordRules` (default) | o componente da checklist ao vivo |

O `apiUrl` é argumento porque cada app resolve a base de forma diferente — o módulo fica agnóstico. O
componente recebe a `policy` já buscada (passar a do `usePasswordPolicy` do formulário) para não repetir
o _fetch_.

```jsx
const policy = usePasswordPolicy(getAppApiUrl());        // viewer
// const policy = usePasswordPolicy(core.API_URL);       // backoffice
// no Controller: validate: (v) => validatePasswordAgainstPolicy(policy, v).length ? msg : true
<PasswordRules policy={policy} password={watchedPassword} />
```

## Quem consome

| Form | App | Base da API |
|---|---|---|
| `PasswordWidget` (definir/reset) | viewer | `getAppApiUrl()` |
| `RegistrationWidget` (registo) | viewer | `getAppApiUrl()` |
| `security/UserForm` (criar utilizador) | backoffice | `core.API_URL` |
| `account/PasswordChange` (alterar a própria) | backoffice | `core.API_URL` |

(o `login` do viewer partilha o mesmo _plumbing_ via `PasswordWidget`/`RegistrationWidget`.)

## A checklist ao vivo

Cada regra é uma _checkbox_ Mantine só-de-leitura: por cumprir = caixa vazia, _label_ normal; cumprida =
visto verde, _label_ **riscado e esbatido** ("feito, segue"). Nunca vermelho — é orientação, não erro. A
`checkbox` fica fora da ordem de tabulação mas **na árvore de acessibilidade e nomeada** (`aria-label`),
para um leitor de ecrã anunciar a regra e se está cumprida (o estado não é só cor); o _label_ visível é a
duplicação decorativa (`aria-hidden`). O título sai da chave i18n `passwordRequirements`.

## Adicionar ou mudar uma regra

1. **Servidor** — acrescentar a linha em `_CHARACTER_RULES` (`app/utils/password_policy.py`); fica logo
   imposta **e** publicada.
2. **Cliente** — acrescentar a entrada correspondente em `CHARACTER_RULES` (`index.jsx`) com a _regex_ e a
   chave i18n; adicionar a chave às _bundles_ do viewer.
3. **Reiniciar o servidor** para a policy nova ser servida.

Nunca fixar o comprimento numa _string_ traduzida: `passwordSizeRule` usa `{{min_length}}`, interpolado da
policy, ou um `min_length` re-afinado passa a mentir.

## Degradação

Se a policy não for buscada (offline, endpoint em baixo, servidor por reiniciar), o `usePasswordPolicy`
devolve `null`: a checklist não aparece e o pré-check não dá veredicto. Não se adivinha — o servidor
rejeita a password fraca na mesma, tal como antes de existir o endpoint.
