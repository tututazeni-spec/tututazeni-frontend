# Spec — Otimização de performance do frontend (Compiler + estrutural)

> Data: 2026-06-28
> Repo: innova-frontend (Next.js 15.3 + React 19.2)
> Branch: `perf/react-compiler`
> Origem: pedido de otimização (memoização + ganhos estruturais).

## Contexto e problema

O frontend tem ~84 componentes client, 660 `useState`, 874 `.map(` e **zero
memoização** (`React.memo`/`memo()`: 0; `useCallback`: 23; `useMemo`: 3). Páginas
monolíticas (employees 1033 linhas, courses 907…). Além disso: **46 `<img>` raw**
(0 `next/image`), listas **sem paginação** em services/hooks (renderizam tudo), e
0 `dynamic()`.

Decisões do utilizador (brainstorming):

- Memoização via **React Compiler** (não manual).
- Incluir ganhos estruturais: **`next/image`** e **virtualização**.
- **Sem** code-split manual — o Next já divide por rota e não há libs pesadas
  (só `dompurify`) nem subárvores client óbvias; forçá-lo seria prematuro.

## Objetivo

Reduzir re-renders e custo de render/carregamento sem alterar comportamento:
(1) auto-memoização via React Compiler; (2) imagens otimizadas com `next/image`;
(3) virtualização das listas genuinamente grandes. Entregue em **3 fases
independentes**.

## Design

### Fase 1 — React Compiler

- Instalar `babel-plugin-react-compiler` (compatível com React 19).
- `next.config.ts`: `experimental: { reactCompiler: true }`, preservando
  `images`/`rewrites`.
- Efeito: auto-memoiza componentes/hooks no build. Componentes que violam as
  Regras do React são **saltados** (sem memoizar, sem partir). Build-time apenas.
- ESLint: ativar a regra do React Compiler no `eslint.config.mjs`
  (`eslint-plugin-react-hooks` v5 — `react-hooks/react-compiler` — ou
  `eslint-plugin-react-compiler`) para ver os bailouts. Corrigir só os críticos
  triviais.
- Custo: builds um pouco mais lentos (Babel). Trade-off aceitável.

### Fase 2 — `next/image`

- Converter os **46 `<img>` raw** para `<Image>` do `next/image`. O
  `next.config.ts` já permite imagens remotas (http/https `**`).
- Cada conversão: `width`/`height` (avatares/thumbnails) ou `fill` + container
  dimensionado (responsivas); **`alt` sempre** (a11y).
- Exceções: SVG/data-URI inline ficam como estão.
- Ganho: lazy-load, WebP, redimensionamento → Core Web Vitals.

### Fase 3 — Virtualização

> **RESOLVIDA POR PAGINAÇÃO (2026-08-20), sem `@tanstack/react-virtual`.** Entre a
> escrita deste spec e a sua execução, `useEmployees`/`UserListView` passaram a
> paginar no servidor (`limit: 20`, ver `hooks/useEmployees.ts` e o `useApiQuery`
> inline em `components/users/UserListView.tsx`) em vez de carregar as ~6000
> linhas de uma vez. Isto elimina
> o problema que a virtualização resolveria — o DOM nunca chega a ter mais que
> uma página de linhas montadas — pelo que instalar `@tanstack/react-virtual` e
> reintroduzir scroll infinito seria trabalho não-necessário (YAGNI) só para
> reconstruir manualmente o que a paginação já dá de graça. Ver auditoria de
> performance de 2026-08-20 (React Compiler bailout visibility) para a decisão.

- ~~Instalar `@tanstack/react-virtual`.~~
- Alvo: as **2-3 listas genuinamente grandes** — `users` (~6000) e `employees`
  primeiro. (As services não paginam → renderizam tudo.) — **já não aplicável:
  ambas as listas são paginadas no servidor.**
- ~~Refactor por lista: container com altura fixa + virtualizer que só renderiza as
  linhas visíveis.~~
- NÃO virtualizar as 85 páginas — só as de listas enormes (YAGNI).

### Verificação (sem testes automatizados no projeto)

Por fase: `npm run build` (compila), `npm run dev` (arranca + smoke a páginas
pesadas), `npx tsc --noEmit` (zero erros), `npm run lint` (bailouts do compiler /
regras). Fase 2: sem layout-shift visível. Fase 3: scroll fluido, dados corretos.

## Critério de sucesso

1. `reactCompiler: true` ativo, `babel-plugin-react-compiler` instalado, build/dev
   ok, comportamento inalterado.
2. Os 46 `<img>` convertidos para `next/image` (exceto SVG/data-URI), com `alt`.
3. ~~`users` e `employees` (e outra lista enorme, se houver) virtualizadas.~~
   Resolvido por paginação no servidor em vez de virtualização (ver Fase 3).
4. `tsc --noEmit` limpo em todas as fases.

## Fora de âmbito

- Code-split manual / `dynamic()` (Next já divide por rota; sem libs pesadas).
- Restantes pontos do `FRONTEND-AUDIT-GUIDE.md` (JWT, middleware, paginação,
  error boundary, etc.).
- Memoização manual (substituída pelo compiler).
- Virtualizar listas pequenas / todas as páginas.
