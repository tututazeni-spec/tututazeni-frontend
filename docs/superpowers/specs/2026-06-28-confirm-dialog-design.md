# Spec — Confirmação destrutiva reutilizável e acessível (P3)

> Data: 2026-06-28
> Repo: innova-frontend (Next.js 15.3 + React 19.2)
> Branch: `feat/confirm-dialog`
> Origem: P3 do `FRONTEND-AUDIT-GUIDE.md` — confirmação antes de ações destrutivas.

## Contexto

Não existe primitivo de confirmação reutilizável (0 componentes Confirm/Modal/
Dialog). As ações destrutivas usam `window.confirm` nativo em **11 ficheiros** —
inconsistente com o design e fora do padrão do guia ("melhor: modal de confirmação
customizado"). Verificado: **todos os `api.delete(...)` já estão atrás de um
`confirm`** (os 6 ficheiros com `.delete` estão contidos nos 11) — não há deletes
sem confirmação; o trabalho é **substituir o `window.confirm` por um modal próprio
acessível**.

Ficheiros com `window.confirm` (alvo da migração):
`api-integrations`, `automation`, `courses/[courseId]/learn`, `courses/modulos`,
`enrollments`, `events`, `leave`, `live-classes`, `processes`, `roles-permissions`,
`users` (todos `app/(platform)/.../page.tsx`).

## Objetivo

Um primitivo de confirmação acessível e reutilizável, e a migração de todos os
`window.confirm` para ele, sem mudar o comportamento (cancelar não age, confirmar
age), com melhor acessibilidade e consistência visual.

## Design

### 1. Primitivo

- `components/ui/ConfirmDialog.tsx` — modal acessível: `role="dialog"`,
  `aria-modal="true"`, `aria-labelledby` (título) + `aria-describedby` (mensagem);
  foco no botão de confirmação ao abrir; **ESC** e clique no backdrop cancelam;
  foco preso no diálogo. Botões **Cancelar** + confirmação (label configurável,
  default "Confirmar"; estilo destrutivo quando `destructive`). Tailwind.
- `providers/ConfirmProvider.tsx` — Context Provider que guarda o estado e
  renderiza o `ConfirmDialog` uma vez. Expõe `useConfirm()`:
  ```ts
  const confirm = useConfirm();
  if (!(await confirm({ title, message, confirmLabel: 'Apagar', destructive: true }))) return;
  ```
  `confirm(options): Promise<boolean>` — mesma ergonomia do `window.confirm`.
- Registar o `ConfirmProvider` nos providers da app (no `app/layout.tsx` ou no
  ficheiro de providers existente, envolvendo a árvore).

### 2. Migração dos 11 ficheiros

Em cada um, no topo do componente `const confirm = useConfirm();` e substituir:
```ts
if (!window.confirm('…')) return;
```
por:
```ts
if (!(await confirm({ title: '…?', message: '…', confirmLabel: 'Apagar', destructive: true }))) return;
```
O handler já é (ou passa a ser) `async`. Título/mensagem adaptados ao contexto.
Agrupar por área em tarefas (no plano).

### 3. Verificação (sem testes automatizados)

`npx tsc --noEmit` + `npm run build` + smoke (um delete por área: modal aparece;
Cancelar não age; Confirmar age; ESC fecha).

## Critério de sucesso

1. `ConfirmDialog` + `useConfirm` acessíveis e a funcionar.
2. **0 `window.confirm`** restantes no código.
3. Todas as ações destrutivas passam pelo `confirm`; comportamento inalterado.
4. `tsc` limpo e `next build` verde.

## Fora de âmbito

- A11y dos labels (`htmlFor`/`id`) — ciclo 2.
- Outros modais (edição/criação).
- Testes de componente (projeto sem jest/RTL).
