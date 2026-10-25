# CLAUDE.md (app)

App Expo e React Native do Podcast Editor: um único app para iOS, Android e Web, na arquitetura do pust/mobile.

## Stack

Expo, Expo Router, React Native e React Native Web, TypeScript strict, pnpm, TanStack Query, i18next (somente pt-BR).

## Arquitetura

```
app/              # rotas do Expo Router (só entrypoints)
src/
├── components/   # layout, shared e ui (reutilize antes de criar outro)
├── config/       # api.ts (BASE_URL)
├── constants/    # theme.ts (tokens do design system)
├── hooks/        # hooks entre módulos
├── i18n/         # pt-BR
├── modules/      # um por domínio
├── providers/    # CoreProvider: I18n, Query, ColorScheme, Theme, Toast
└── shared/       # lib e ui
```

Cada módulo em `src/modules/[nome]/` tem `[nome].api.ts`, `[nome].types.ts`, `[nome].queries.ts`, `[nome].mutations.ts`, `[nome].storage.ts` (quando precisa) e `components/` no padrão **Container e View**, com a lógica em hooks. Consulte as skills `component-architecture` e `design-system-layout` em `.claude/skills/`.

## Aliases

- `@/*` para a raiz (Expo Router, assets)
- `@src/*` para `./src/`

## Regras

- O app é só layout. Nunca calcula corte, respiro, duração, quebra de legenda nem sugestão da IA: mostra o que a API devolve e envia a intenção do usuário.
- Estado do app é só estado de tela (aba aberta, zoom, seleção, texto digitado).
- Tokens de cor, raio, espaçamento e tipografia vêm de `src/constants/theme.ts`, que reproduz o `style.css` do template de interface em `docs/template-editor/`. Nada de valor solto nos componentes.
- Reproduza as telas do template (`Upload`, `Processando`, `Edicao`, `Concluido`) com o mesmo texto e comportamento.
- Mensagens de erro vêm do `code` devolvido pela API, traduzido em `i18n/errors.json`. Nunca invente mensagem que a API não mandou.
- Arquivos específicos de plataforma usam sufixo `.web.tsx` ou `.native.tsx`.
- O mínimo de comentários. Máximo de 300 linhas por arquivo.
