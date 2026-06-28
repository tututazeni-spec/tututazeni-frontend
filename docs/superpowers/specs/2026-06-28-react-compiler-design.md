# Spec — Ligar o React Compiler (otimização de re-renders)

> Data: 2026-06-28
> Repo: innova-frontend (Next.js 15.3 + React 19.2)
> Branch: `perf/react-compiler`
> Origem: pedido de otimização de performance (memoização: react.memo/useCallback/useMemo).

## Contexto e problema

O frontend tem ~84 componentes client, 660 `useState`, 874 `.map(` e **zero
memoização** (`React.memo`/`memo()`: 0; `useCallback`: 23; `useMemo`: 3). As
páginas são monolíticas (employees 1033 linhas, processes 997, courses 907…).
Re-renders desnecessários são prováveis e generalizados.

Em React 19, a forma moderna e segura de resolver isto é o **React Compiler**,
que auto-memoiza componentes e hooks no build — equivalente a aplicar
`memo`/`useMemo`/`useCallback` corretamente em todo o lado, sem espalhar
memoização à mão por dezenas de ficheiros grandes (propenso a erros/esquecimentos).

Estado atual: `next.config.ts` **não** tem o compiler ativado.

Decisão do utilizador (brainstorming): **React Compiler** (não manual).

## Objetivo

Ativar o React Compiler para que os componentes client sejam auto-memoizados no
build, sem alterar o código dos componentes nem o comportamento da aplicação, e
com visibilidade dos componentes que o compiler salta (violações das Regras do
React).

## Design

### 1. Ativar o compiler

- Instalar `babel-plugin-react-compiler` (versão compatível com React 19).
- `next.config.ts`: adicionar `experimental: { reactCompiler: true }`, preservando
  `images` e `rewrites` já existentes.
- Efeito: no build, o compiler memoiza automaticamente componentes/hooks. Onde um
  componente viola as Regras do React, o compiler **salta-o** (sem memoizar, sem
  partir). Sem dependência de runtime nova (build-time apenas).
- Custo conhecido: o passo do compiler usa Babel → builds um pouco mais lentos.
  Trade-off aceitável.

### 2. ESLint do compiler (visibilidade dos bailouts)

- Ativar a regra do React Compiler no `eslint.config.mjs` (via
  `eslint-plugin-react-hooks` v5 — regra `react-hooks/react-compiler` — ou
  `eslint-plugin-react-compiler`).
- Serve de mapa: assinala os componentes que o compiler vai saltar. Não é
  obrigatório corrigir todos; corrigir apenas os **críticos** (páginas pesadas)
  quando a violação for trivial.

### 3. Verificação (sem testes automatizados no projeto)

O projeto não tem jest/test script. Verificação manual:
1. `npm run build` (`next build`) → compila sem erros; o compiler reporta no build.
2. `npm run dev` → arranca sem erros; smoke a 2-3 páginas pesadas (`employees`,
   `users`, `courses`) — renderizam e interagem na mesma.
3. `npx tsc --noEmit` → zero erros TypeScript.
4. `npm run lint` → ver bailouts do compiler; corrigir os críticos triviais.

## Critério de sucesso

1. `experimental.reactCompiler: true` ativo e `babel-plugin-react-compiler`
   instalado.
2. `next build` e `next dev` funcionam; comportamento das páginas inalterado.
3. `tsc --noEmit` limpo.
4. Lista de bailouts conhecida (críticos triviais corrigidos).

## Fora de âmbito

- Virtualização de listas grandes, code-splitting/`dynamic()`, `next/image` —
  ganhos estruturais complementares para um ciclo seguinte.
- Restantes pontos do `FRONTEND-AUDIT-GUIDE.md` (JWT, middleware, paginação,
  error boundary, etc.) — não fazem parte deste pedido.
- Memoização manual (substituída pelo compiler).
