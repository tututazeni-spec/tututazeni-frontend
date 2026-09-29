# Spec — Fundação do sistema de design (Fase A)

> Data: 2026-08-10
> Repo: innova-frontend (Next.js 15.3 + React 19.2 + Tailwind v4)
> Branch: `feat/design-system-foundation`
> Origem: pedido directo — os 60+ módulos da plataforma (`app/(platform)/*`) têm
> aparência inconsistente entre si (cada módulo reinventa o seu próprio
> `atoms.tsx` local, com paletas e valores de raio/sombra/espaçamento
> divergentes). Este spec cobre só a **fundação**: tokens + biblioteca de
> componentes partilhados. A migração dos módulos existentes para a consumir
> é a **Fase B**, spec à parte.

## Contexto

Levantamento actual (ver `components/`):

- `components/ui/` tem só 4 primitivos: `ConfirmDialog`, `PdfDownloadButton`,
  `Skeleton`, `StatusBadge`.
- Cada módulo (`engagement`, `payslips`, `courses`, …) tem o seu próprio
  `atoms.tsx` privado que reimplementa skeleton, badge, KPI card, avatar —
  cada um com escolhas divergentes: `gray-*` vs `slate-*`, `indigo-*` vs
  `blue-*` vs `violet-*`, raios e sombras diferentes.
- Não há tokens de design partilhados nem marca definida — só SVGs
  placeholder do Next.js em `public/`.
- Stack: Tailwind v4 (CSS-first, `@theme`), `lucide-react` para ícones
  (já consistente entre módulos, só falta convenção de tamanho/stroke), sem
  Radix nem `clsx`/`cva` instalados.
- `vitest` está configurado só para lógica pura (`lib/*.test.ts`) — sem
  `@testing-library/react`/jsdom. Segue-se a mesma convenção dos specs
  anteriores (ex.: `2026-06-28-confirm-dialog-design.md`): sem testes de
  componente automatizados, verificação por `tsc`, `next build` e smoke visual.

## Decisões já validadas (companion visual)

- **Direcção visual "Percurso"**: verde-pinho + ocre quente sobre papel
  neutro; tipografia Sora (títulos) + Inter (corpo) + IBM Plex Mono (dados/
  código); motivo de assinatura = indicador de percurso em pontos-e-linha
  (usado em progresso de curso, PDI, plano de carreira, qualquer sequência
  real de passos — não decorativo).
- Estados de botão/input/badge/card/skeleton/empty state aprovados tal como
  mostrados no companion (`components-a.html`).
- Só tema claro por agora; tokens desenhados como variáveis CSS nomeadas
  semanticamente (não hex soltos no código) para que um tema escuro futuro
  seja só um segundo bloco de valores para as mesmas variáveis — sem tocar
  nos componentes.

## Objectivo

Uma fundação de design única e reutilizável — tokens + biblioteca de
componentes primitivos + convenções — que resolve na origem os pontos que
motivaram o pedido: hierarquia visual, grid, whitespace, alinhamento,
tipografia, cor, espaçamento, cantos, sombras, ícones, responsividade,
transições, skeletons, feedback de acções e empty states. A Fase B (rollout
aos módulos) consome esta fundação sem a alterar.

## Design

### 1. Tokens (`app/globals.css`, bloco `@theme`)

Definidos directamente no bloco `@theme` do Tailwind v4 — isto gera em
simultâneo a variável CSS e as classes utilitárias (`bg-primary`,
`text-ink-muted`, `rounded-card`, `shadow-hover`, …), substituindo o uso actual
de paletas cruas (`gray-500`, `indigo-600`, …) por nomes semânticos:

> **Colisão de namespace evitada de propósito:** o Tailwind v4 já define
> `--radius-sm/md/lg/xl/2xl/3xl` e `--shadow-2xs/xs/sm/md/lg/xl/2xl` no seu
> tema por omissão. Reutilizar esses nomes no `@theme` reescreveria
> silenciosamente o raio/sombra de **todo** `rounded-md`/`shadow-sm` já
> em uso nos 60+ módulos existentes — precisamente o que o critério de
> sucesso 7 proíbe nesta fase. Por isso os tokens de forma abaixo usam
> nomes próprios (`--radius-control`, `--shadow-resting`, …) que não
> colidem com a escala nativa; a única sobreposição deliberada é
> `--font-mono` (sem uso prévio no projecto, seguro trocar).

```css
@theme {
  /* superfícies */
  --color-canvas: #f7f5ef;
  --color-surface: #ffffff;
  --color-surface-sunken: #f1eee5;
  --color-border: #e7e2d4;
  --color-border-strong: #d8d1be;

  /* texto */
  --color-ink: #20241f;
  --color-ink-muted: #6e756b;
  --color-ink-faint: #9aa097;

  /* marca */
  --color-primary: #163a2e;
  --color-primary-hover: #1f4e3d;
  --color-primary-active: #0e2820;
  --color-primary-subtle: #e7efea;
  --color-accent: #d6963a;
  --color-accent-hover: #c2822a;
  --color-accent-subtle: #f3e1be;

  /* semântica de estado — 4 pares (o pedido não mencionava "info";
     acrescentado porque os módulos já usam azul para "novo/informativo"
     de forma ad-hoc e sem token) */
  --color-success: #2f9e63;
  --color-success-subtle: #e4f5ec;
  --color-success-ink: #1e7a4c;
  --color-warning: #c97a1f;
  --color-warning-subtle: #fbeedc;
  --color-warning-ink: #9c5f17;
  --color-danger: #b3432e;
  --color-danger-subtle: #fbe7e2;
  --color-danger-ink: #8f3421;
  --color-info: #3b6fa0;
  --color-info-subtle: #e7eef5;
  --color-info-ink: #2c557e;

  /* forma — nomes próprios, não colidem com a escala nativa do Tailwind */
  --radius-control: 6px; /* inputs, botões, badges não-pill */
  --radius-card: 10px; /* cards */
  --radius-panel: 14px; /* modais, painéis grandes */
  --radius-pill: 999px; /* badges de estado, avatar, chips */

  /* profundidade — subtil por omissão; cards assentam sobretudo no
     border, a sombra só cresce em hover/elevação real */
  --shadow-resting: 0 1px 2px rgba(22, 58, 46, 0.06); /* card em repouso */
  --shadow-hover: 0 4px 12px rgba(22, 58, 46, 0.08); /* hover, menus */
  --shadow-elevated: 0 12px 32px rgba(22, 58, 46, 0.14); /* modal, popover */

  /* ritmo de espaçamento — a regra explícita que o pedido descreveu
     ("espaço entre secções maior que dentro de uma secção") */
  --space-stack: 12px; /* gap entre elementos dentro da mesma secção */
  --space-section: 40px; /* gap entre secções maiores de uma página */

  /* movimento */
  --duration-micro: 150ms; /* hover, press */
  --duration-base: 200ms; /* aparecer/desaparecer pequenos */
  --duration-panel: 250ms; /* modal, painel lateral */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* tipografia — via next/font (ver secção 2) */
  --font-display: var(--font-sora);
  --font-body: var(--font-inter);
  --font-mono: var(--font-plex-mono);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 2. Tipografia

`next/font/google` em `app/layout.tsx` (self-hosted pelo Next, sem pedido
externo em runtime): Sora (600/700/800) para títulos, Inter (400/500/600)
para corpo/UI, IBM Plex Mono (400/500) para dados tabulares (payslips,
audit, IDs). Escala (mantém o `body` a 14px que já está em uso, para não
mudar a densidade geral da app):

| Nome        | Tamanho/altura | Peso                           | Uso                                                   |
| ----------- | -------------- | ------------------------------ | ----------------------------------------------------- |
| `display`   | 32/40          | 800                            | hero raro (ex.: número grande de dashboard executivo) |
| `h1`        | 24/32          | 700                            | título de página                                      |
| `h2`        | 20/28          | 700                            | título de secção                                      |
| `h3`        | 16/24          | 600                            | título de card/sub-secção                             |
| `body`      | 14/22          | 400                            | texto corrente (default actual)                       |
| `body-sm`   | 13/20          | 400                            | texto secundário                                      |
| `caption`   | 12/16          | 500, uppercase, tracking .04em | eyebrows, labels de campo                             |
| `mono-data` | 13/20          | 500, tabular-nums              | valores monetários, IDs, timestamps                   |

### 3. Biblioteca de componentes (`components/ui/`)

Base técnica: `class-variance-authority` (variantes tipo `intent`/`size`
declaradas, não `if/else` de className espalhado) + `clsx` +
`tailwind-merge` (via helper `lib/cn.ts`) — o trio standard para este tipo
de stack, resolve directamente o problema de cada módulo inventar a sua
própria lógica de variante. Para os componentes que precisam de mecânica de
acessibilidade real (focus trap, keyboard nav, ARIA), usa-se `radix-ui`
(pacote unificado) como base não-estilizada, com a aparência aplicada pelos
tokens acima:

| Componente                                 | Base                                      | Notas                                                                                                                                                                       |
| ------------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                                   | custom + cva                              | variantes `primary/secondary/ghost/danger`, tamanhos `sm/md`, estado `loading` (spinner + `aria-busy`), `disabled`                                                          |
| `IconButton`                               | custom + cva                              | mesmas variantes, alvo de toque ≥ 36px                                                                                                                                      |
| `Input`, `Textarea`, `Select`              | Radix Select p/ `Select`; custom p/ resto | label, hint, estado de erro (`aria-invalid` + `aria-describedby`) integrados num só `FormField` wrapper                                                                     |
| `Card`                                     | custom                                    | `shadow-resting` em repouso, `shadow-hover` em hover quando interactivo                                                                                                     |
| `Badge` (`StatusBadge` existente, revisto) | custom                                    | usa os 4 pares semânticos + neutro, pill                                                                                                                                    |
| `Modal`                                    | Radix Dialog                              | `ConfirmDialog` passa a consumir este primitivo em vez de reimplementar foco/ESC                                                                                            |
| `Tabs`                                     | Radix Tabs                                |                                                                                                                                                                             |
| `DropdownMenu`                             | Radix DropdownMenu                        |                                                                                                                                                                             |
| `Tooltip`                                  | Radix Tooltip                             | delay 400ms, só desktop (hover)                                                                                                                                             |
| `Toast` + `ToastProvider`                  | Radix Toast                               | fila, auto-dismiss 4s, pausa em hover                                                                                                                                       |
| `Table`                                    | custom                                    | `Table`, `TableHead`, `TableRow`, `TableCell`, zebra opcional                                                                                                               |
| `Avatar`                                   | custom                                    | iniciais + gradiente determinístico por nome (substitui o de `engagement/atoms.tsx`), ou imagem                                                                             |
| `ProgressBar`                              | custom                                    | barra linear simples (substitui as várias versões locais)                                                                                                                   |
| `PathProgress`                             | custom (**assinatura**)                   | indicador de passos em ponto-e-linha; usar apenas onde a ordem é real (progresso de curso/módulo, PDI, plano de carreira, wizard multi-passo) — não como decoração genérica |
| `KpiCard`                                  | custom                                    | ícone + valor + label + tendência opcional (substitui os `KpiCard` locais de `engagement`, etc.)                                                                            |
| `EmptyState`                               | custom                                    | ícone num círculo `accent-subtle`, título, descrição curta, acção primária opcional                                                                                         |
| `Skeleton`                                 | extende o existente                       | shimmer com `prefers-reduced-motion` a cair para pulso estático sem gradiente animado                                                                                       |

Ícones: `lucide-react` (já em uso, mantém-se), convenção fixada —
`strokeWidth={1.75}`, `currentColor`, tamanhos nomeados `14/16/18/20/24`
(inline → botão → nav → empty-state), nunca um tamanho arbitrário fora
desta escala.

### 4. Rota interna de referência viva (styleguide)

Em vez de Storybook (adicionaria uma dependência pesada só para 60 módulos
internos), uma rota `app/(platform)/_styleguide/page.tsx`, atrás do mesmo
guard de `ADMIN_ROLES` já usado no `Sidebar`, que renderiza cada componente
em todos os estados — é o mesmo conteúdo que foi validado no companion
visual, mas vivo no código e a servir de referência para a Fase B (equivalente
ao que o companion mostrou em `components-a.html`, mas versionado e sempre
actualizado).

### 5. Convenções de layout

- Ritmo vertical: `--space-section` (40px) entre blocos maiores de uma
  página, `--space-stack` (12px) entre elementos dentro do mesmo bloco —
  substitui os `gap`/`mb` arbitrários actuais.
- Breakpoints Tailwind por omissão (`sm/md/lg/xl`) — sem breakpoints
  customizados; sidebar já colapsa para ícones abaixo de `lg`, mantém-se.
- Estados interactivos obrigatórios em qualquer elemento clicável:
  `:hover`, `:focus-visible` (anel com `--color-accent`, nunca suprimido
  com `outline:none` sem substituto), `:active`, `:disabled`.

## Critério de sucesso

1. `app/globals.css` com o bloco `@theme` acima; `next/font` a servir Sora/
   Inter/Plex Mono.
2. `lib/cn.ts` + `class-variance-authority` instalados e usados por todos os
   componentes novos.
3. Todos os componentes da tabela da secção 3 implementados em
   `components/ui/`, cada um com os estados (hover/focus/active/disabled/
   loading/erro conforme aplicável) tal como validados no companion visual.
4. `ConfirmDialog` refeito sobre o novo `Modal` (Radix Dialog), sem regressão
   de comportamento (mesmo contrato `useConfirm()`).
5. Rota `_styleguide` acessível só a `ADMIN_ROLES`, a mostrar todos os
   componentes/estados.
6. `tsc --noEmit`, `next build` e `npm test` (vitest) verdes; smoke manual
   de foco por teclado em `Button`, `Modal`, `DropdownMenu`, `Tabs`.
7. Nenhum módulo existente é tocado nesta fase — só `components/ui/`,
   `lib/`, `app/globals.css`, `app/layout.tsx` e a nova rota `_styleguide`.

## Fora de âmbito

- Migração dos 60+ módulos para consumir a nova biblioteca — Fase B, spec
  à parte.
- Tema escuro (valores concretos) — só a estrutura de variáveis fica
  pronta para o receber.
- Testes de componente automatizados (sem `@testing-library/react`/jsdom
  configurado neste repo — mesma convenção do spec `confirm-dialog`).
- Nova identidade de marca/logo — continua sem logo definido, fora do
  âmbito deste spec.
