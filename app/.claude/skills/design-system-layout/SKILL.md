---
name: design-system-layout
description: Design system enforcement for this project. Apply whenever creating or editing any component, screen, or view, ensures correct use of palette tokens, spacing scale, typography, radius, shadows, z-index, opacity, breakpoints, icon sizes, and interactive states.
when_to_use: Activate when creating or editing any .tsx/.jsx file in src/components/, src/modules/, or app/. Also activate when the user mentions layout, screen, view, component, UI, design, token, cor, espaçamento, tipografia, sombra, borda, ícone, or estado visual.
paths: src/components/**/*.tsx, src/modules/**/components/**/*.tsx, app/**/*.tsx
allowed-tools: Read Grep Glob
---

# Design System Layout

A documentação completa dos tokens está em `design-system/`. Esta skill define as **regras de aplicação** no código.

---

## Regra 0, Antes de implementar qualquer UI

1. Verifique se o componente já existe em `src/components/` (cheque os índices).
2. Verifique se o token que você precisa já está documentado em `design-system/`.
3. Nunca crie valores visuais avulsos, use sempre os tokens abaixo.

---

## 1. Cores

**Fonte:** `design-system/colors.md`

- **SEMPRE** acesse cores via `usePalette()`, nunca use hex direto.
- Exceções permitidas (hex fixo): redes sociais (`#E1306C`, `#0A66C2`, `#0F1419`), status (`#22c55e`, `#f59e0b`, `#ef4444`).
- Para tints de fundo sobre `primary`: use `palette.primary + '18'` (hex alpha).
- Texto sobre fundo `primary` → sempre `palette.primaryInk` (`#fff`).

```tsx
// ✅ Correto
const p = usePalette();
<View style={{ backgroundColor: p.surface }} />

// ❌ Errado
<View style={{ backgroundColor: '#FFFFFF' }} />
```

---

## 2. Tipografia

**Fonte:** `design-system/typography.md`

Escala de tamanhos de referência rápida:

| Uso                        | fontSize |
| -------------------------- | -------- |
| Caption auxiliar           | 10–11    |
| Texto de UI geral          | 12–13    |
| Título de card / label btn | 14–14.5  |
| Título de seção            | 15–16    |
| Headline                   | 18–26    |

Pesos: `500` (medium), `600` (semibold), `700` (bold).  
Nunca use tamanhos fora da escala documentada sem justificativa.

---

## 3. Espaçamento

**Fonte:** `design-system/spacing.md`

Valores válidos (múltiplos de 4 preferencialmente): `2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24`.

| Contexto                       | Valor |
| ------------------------------ | ----- |
| Padding lateral de tela mobile | `16`  |
| Padding bottom mobile (nav)    | `110` |
| Gap entre colunas desktop      | `16`  |
| Gap entre itens de lista       | `10`  |

```tsx
// ✅ Correto
<View style={{ padding: 16, gap: 10 }} />

// ❌ Errado
<View style={{ padding: 17, gap: 11 }} />
```

---

## 4. Border Radius

**Fonte:** `design-system/borders.md`

| Token | px  | Quando usar                             |
| ----- | --- | --------------------------------------- |
| xs    | 6   | Social chips, badges de hora            |
| sm    | 8   | Botão sm, avatares quadrados sm         |
| md    | 10  | Botão default, inputs, items de sidebar |
| lg    | 12  | Alerts, icon buttons de header          |
| xl    | 14  | Botão lg, imagem de post, composer      |
| 2xl   | 16  | Nav central desktop                     |
| 3xl   | 18  | Bottom nav, cards de post               |
| 4xl   | 20  | Sidebar, right panel                    |
| full  | 999 | Pills, stories ring, status dots        |

**Regra:** nunca use `borderRadius: '50%'` em React Native, use `full` ou metade da dimensão.

---

## 5. Sombras

**Fonte:** `design-system/shadows.md`

| Nível | Web (box-shadow)                       | RN elevation |
| ----- | -------------------------------------- | ------------ |
| soft  | `0 4px 20px -4px rgba(26,11,46,0.10)`  | `4`          |
| nav   | `0 10px 30px -10px rgba(0,20,60,0.15)` | `10`         |
| pop   | `4px 4px 0 0 #1A0B2E`                  | ,            |

Use `shadowColor: '#1A0B2E'` em React Native.

---

## 6. Z-index

**Fonte:** `design-system/z-index.md`

| Token   | Valor | Elemento              |
| ------- | ----- | --------------------- |
| base    | 0     | Conteúdo de tela      |
| raised  | 10    | Cards elevados        |
| header  | 20    | MobileHeader (sticky) |
| nav     | 30    | MobileBottomNav       |
| overlay | 40    | Overlays              |
| modal   | 50    | Modais e drawers      |
| toast   | 60    | Notificações          |

Nunca use `zIndex: 9999`.

---

## 7. Opacidade

**Fonte:** `design-system/opacity.md`

| Contexto          | Valor     |
| ----------------- | --------- |
| Hover (button)    | 0.88      |
| Pressed (button)  | 0.72      |
| Disabled          | 0.40      |
| Tint de fundo     | 0.18      |
| Caption sobre cor | 0.85      |
| Blob decorativo   | 0.30–0.35 |

---

## 8. Layout e Breakpoints

**Fonte:** `design-system/grid-layout.md`

| Hook            | Breakpoint  | Layout                               |
| --------------- | ----------- | ------------------------------------ |
| `useIsMobile()` | `< 900px`   | Coluna única + bottom nav            |
| `useIsNarrow()` | `< 1280px`  | 2 colunas (sem right panel)          |
| ,               | `>= 1280px` | 3 colunas (sidebar + center + right) |

Dimensões fixas:

- Left Sidebar: `240px`
- Right Panel: `320px`
- Padding bottom mobile: `110px` (espaço para bottom nav)

---

## 9. Tamanhos Padrão de Componentes

**Fonte:** `design-system/sizes.md`

| Componente     | w × h |
| -------------- | ----- |
| Avatar sm      | 28×28 |
| Avatar default | 36×36 |
| Avatar lg      | 48×48 |
| Icon button    | 38×38 |
| Brand avatar   | 26×26 |
| Logo icon      | 34×34 |
| Social chip    | 22×22 |
| Story circle   | 56×56 |

---

## 10. Ícones

**Fonte:** `design-system/icons.md`

| Contexto               | size |
| ---------------------- | ---- |
| Ícone em label / alert | 14   |
| Ícone em botão de nav  | 16   |
| Ícone em header mobile | 17   |
| Ícone em bottom nav    | 18   |

- `strokeWidth` inativo: `1.8` | ativo: `2.2` | padrão UI: `2`.
- Sempre use o componente `Icon`, nunca SVG inline avulso.

---

## 11. Estados Interativos

**Fonte:** `design-system/states.md`

Todo elemento interativo DEVE implementar:

| Estado   | Regra                                          |
| -------- | ---------------------------------------------- |
| hover    | `opacity: 0.88` (via Pressable state)          |
| pressed  | `opacity: 0.72` (via Pressable state)          |
| active   | `backgroundColor: primary`, texto `primaryInk` |
| disabled | `opacity: 0.40` + `disabled={true}`            |
| focus    | `borderWidth: 2, borderColor: primary`         |

```tsx
// ✅ Padrão correto de Pressable
<Pressable
  style={(state) => [baseStyle, (state as any).hovered && { opacity: 0.88 }, state.pressed && { opacity: 0.72 }]}
/>
```

---

## Checklist ao criar/editar um componente

- [ ] Cores via `usePalette()`, sem hex avulso
- [ ] fontSize dentro da escala documentada
- [ ] Espaçamentos múltiplos de 4 (ou da escala)
- [ ] borderRadius usando o token correto para o contexto
- [ ] zIndex usando o nível semântico correto
- [ ] Breakpoints respeitados (`useIsMobile`, `useIsNarrow`)
- [ ] Tamanho de ícone conforme contexto
- [ ] Estados hover/pressed/disabled implementados
- [ ] Sombra via token (não valor avulso)
- [ ] Componentes existentes em `src/components/` verificados antes de criar novo
