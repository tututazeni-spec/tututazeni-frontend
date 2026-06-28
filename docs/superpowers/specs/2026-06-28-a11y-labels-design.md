# Spec — a11y: associar labels nos gaps claros (P3)

> Data: 2026-06-28
> Repo: innova-frontend
> Branch: `fix/a11y-labels`
> Origem: P3 do `FRONTEND-AUDIT-GUIDE.md` — acessibilidade de formulários.

## Contexto

A métrica "htmlFor=0" da auditoria exagerou o problema: a maioria dos forms usa
o padrão **`<label>` a envolver o `<input>`** (associação implícita, válida em
a11y, sem precisar de `htmlFor`) — ex.: o componente `Field` dos crm/library.
Os gaps **reais** (label-irmão ou `<span>` em vez de `<label>`) são poucos:

1. `app/(platform)/users/page.tsx` — o `Field` inline renderiza `<div><label/>
   <input/></div>` (irmãos, sem associação).
2. `app/(platform)/settings/page.tsx` — usa `<span style={labelStyle}>X</span>` +
   input (3 campos de senha), sem `<label>` nenhum.

## Objetivo

Associar os labels aos inputs nestes 2 gaps claros (sem mudar o visual), tornando-os
acessíveis a screen readers e a clicar-no-label-foca-o-input.

## Design

1. **`users` `Field`**: importar `useId` do React; `const fieldId = useId();`;
   `<label htmlFor={fieldId}>` e `<input id={fieldId} ... />`.
2. **`settings`** (3 pares): converter cada `<span style={labelStyle}>X</span>` em
   `<label style={labelStyle} htmlFor="<id>">X</label>` e adicionar `id="<id>"` ao
   input correspondente. IDs estáveis: `current-password`, `new-password`,
   `confirm-password`.

## Verificação (sem testes automatizados)

`npx tsc --noEmit` + `npm run build` + smoke (clicar no label foca o input).

## Critério de sucesso

1. `users` `Field` associa label↔input via `useId`/`htmlFor`/`id`.
2. Os 3 campos de senha do `settings` têm `<label htmlFor>` + `id`.
3. `tsc` limpo e `next build` verde; visual inalterado.

## Fora de âmbito

- Forms já acessíveis (envolvimento).
- Varredura de toda a app por casos dispersos de label-irmão (documentado; baixo
  valor — a maioria já está acessível).
