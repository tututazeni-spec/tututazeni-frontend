# Payroll — workflow de runs (frontend RH), Sub-projecto C

**Data:** 2026-09-03
**Âmbito:** frontend `tututazeni-frontend` apenas — consome a API já mergeada em
`innova` (`feat(payroll): PayrollRun workflow + salary catalogue + ESS compensation`,
PR #230, e `feat(payroll): GET /payroll/compensation/all`, PR #231)
**Tipo:** subsistema novo (página + máquina de estados na UI) sobre uma API já estável

---

## Problema

O backend do módulo `payslips` já expõe o workflow completo de folhas de vencimento em
lote (`@Controller('payroll/runs')`, `PayrollWorkflowService`) — criar run, processar/
simular, rever exceções, recalcular/excluir recibos individuais, submeter, aprovar/
rejeitar, publicar, cancelar. Nada disto tem interface. O Sub-projecto B (PRs #393-#396)
já entregou as duas outras peças do domínio payroll no frontend — catálogo de componentes
salariais e compensação por colaborador — como abas dentro de `/payslips`. O run workflow
é a peça que falta para o ciclo de vida ficar completo ponta-a-ponta (criar run →
processar → rever → aprovar → publicar → colaborador vê o recibo).

## Decisões (validadas em brainstorming com o utilizador, 2026-09-03)

| # | Decisão | Alternativa rejeitada |
|---|---|---|
| 1 | **Rota dedicada `/payroll`** (página própria, nav local lista⇄detalhe), não uma 8ª aba de `/payslips`. | Aba extra em `/payslips` — a página já tem 7 abas e o detalhe de um run (estado+timeline+tabela de recibos+painel de exceções) não cabe no layout `max-w-4xl` actual. |
| 2 | **Formulário de criar run simples**: `period` + `payGroup` + `countryCode` + `notes`. Sem selector de `departmentIds`/`userIds`. | Picker de departamentos/utilizadores no formulário — mais trabalho de UI (pesquisa/paginação) para um caso (`scope` parcial) que ainda não foi pedido; o DTO aceita os campos, só não há UI para eles nesta entrega. |
| 3 | Segue exactamente os padrões já estabelecidos por `components/payslips/CompensationsView.tsx` / `CompensationDetailView.tsx` (lista paginada → detalhe, `useApiQuery`/`useApiMutation`, `StatusBadge`, painel inline com `Textarea` para acções que exigem motivo). | Introduzir um padrão novo (ex: modais para tudo, ou React Router aninhado) — sem ganho, quebra consistência visual com o resto do módulo payroll. |
| 4 | Sem guarda client-side extra na página (`isAdmin` check) — só a sidebar filtra (`roles: ['ADMIN','RH']`); o backend já faz `@Roles(ADMIN, RH)` em todo o `PayrollRunController`. | Guarda + redirect no `page.tsx` — precedente existente é `roles-permissions/page.tsx`, que não tem guarda própria. |

## Estado actual confirmado

### API (backend, já em `main`)

`@Controller('payroll/runs')`, `@Roles(Role.ADMIN, Role.RH)` em todo o controller
(`src/payslips/payroll-run.controller.ts`):

| Método | Rota | DTO body | Devolve |
|---|---|---|---|
| POST | `/` | `CreatePayrollRunDto` | `PayrollRun` (DRAFT) |
| GET | `/` | query `PayrollRunFilterDto` | `Paginated<PayrollRun>` |
| GET | `/:id` | — | `PayrollRun & { timeline: TimelineStep[] }` |
| GET | `/:id/payslips` | query `PayrollRunFilterDto` (page/limit) | `Paginated<Payslip & { user, items }>` |
| GET | `/:id/exceptions` | — | `RunException[]` (lista plana) |
| POST | `/:id/process` | — | `PayrollRun` (SIMULATED) |
| PATCH | `/:id/payslips/:payslipId/recalc` | `RecalcPayslipInputsDto` | `Payslip` |
| PATCH | `/:id/payslips/:payslipId/exclude` | — | `Payslip` (runId=null) |
| POST | `/:id/submit` | — | `PayrollRun` (PENDING_APPROVAL) — 409 se `errorCount>0` |
| POST | `/:id/approve` | — | `PayrollRun` (APPROVED) |
| POST | `/:id/reject` | `RejectRunDto { reason }` | `PayrollRun` (volta a SIMULATED) |
| POST | `/:id/publish` | — | `PayrollRun` (PUBLISHED) |
| POST | `/:id/cancel` | `CancelRunDto { reason }` | `PayrollRun` (CANCELLED) |

**`CreatePayrollRunDto`** (`src/payslips/payroll.dto.ts`): `period: string` (obrigatório,
`"AAAA-MM"`), `payGroup?`, `countryCode?` (default `AO` no backend), `taxYear?`,
`departmentIds?: number[]`, `userIds?: number[]`, `notes?`. Só `period`/`payGroup`/
`countryCode`/`notes` têm UI nesta entrega (decisão #2).

**`RecalcPayslipInputsDto`**: `absenceDays?`, `overtimeHours?`, `bonusAmount?`,
`advanceDeduction?` — todos `number`, opcionais, `Min(0)`.

**Máquina de estados** (`PayrollWorkflowService`, `assertTransition`/`assertRunEditable`):

```
DRAFT ──process──▶ PROCESSING ──(automático)──▶ SIMULATED
SIMULATED ──process──▶ PROCESSING ──▶ SIMULATED     (reprocessar)
SIMULATED ──submit──▶ PENDING_APPROVAL   (409 se errorCount>0)
PENDING_APPROVAL ──approve──▶ APPROVED
PENDING_APPROVAL ──reject──▶ SIMULATED   (grava rejectionReason)
APPROVED ──publish──▶ PUBLISHED          (terminal; recibos DRAFT→ISSUED)
qualquer estado ≠ PUBLISHED ──cancel──▶ CANCELLED   (terminal)
```

`recalc`/`exclude` só são válidos com `run.status === 'SIMULATED'`. `EDIT_LOCKED =
{APPROVED, PUBLISHED, CANCELLED}` — `process`/`recalc`/`exclude` devolvem 403
(`ForbiddenException`) nesses estados, antes mesmo de validar a transição.

**Exceções** — 8 códigos confirmados em `payroll-calculation.service.ts`, severidade
`ERROR` (bloqueia `submit`) ou `WARNING`:

| code | severity |
|---|---|
| `NO_COMPENSATION` | ERROR |
| `ZERO_BASE_SALARY` | ERROR |
| `NEGATIVE_NET` | ERROR |
| `DUPLICATE_PAYSLIP_FOR_PERIOD` | ERROR |
| `NET_BELOW_MINIMUM_WAGE` | WARNING |
| `MISSING_BANK_DETAILS` | WARNING |
| `HIGH_VARIANCE_VS_PREV_MONTH` | WARNING |
| `USING_FALLBACK_TAX_CONFIG` | WARNING |

`RunException` (de `GET /:id/exceptions`): `{ payslipId, userId, fullName, code,
severity, message }`.

`GET /:id` timeline: array de 5 passos fixos (`created`, `processed`, `submitted`,
`approved`, `published`), cada um `{ step, at: string | null, by: { id, fullName } | null }`
— já vem pronto para renderizar directamente, sem chamada extra de auditoria.

### Frontend (padrões a reutilizar, já existentes em `components/payslips/`)

- `CompensationsView.tsx` — tabela paginada com pesquisa, `useApiQuery` +
  `keepPreviousData`, `Pagination`, clique na linha → `onOpenDetail(id)`. Modelo directo
  para `RunListView`.
- `CompensationDetailView.tsx` — cabeçalho + secções `<dl>`/`Row`, botões de acção,
  modais controlados por um `ModalState` discriminado. Modelo para `RunDetailView`.
- `PlanDetailModal.tsx` (`components/onboarding/`) — painel inline com `Textarea` +
  motivo obrigatório antes de activar o botão de confirmar. Modelo para reject/cancel.
- `StatusBadge` + `lib/statusBadge.ts` (`StatusBadgeMap<S>`, `resolveBadge` com
  fallback seguro para valores de enum não mapeados) — usado para o estado do run e a
  severidade das exceções.
- `useApiQuery`/`useApiMutation` (`hooks/useApiQuery.ts`) — `invalidateKeys` faz
  `qc.invalidateQueries` após sucesso.
- `lib/queryKeys.ts` — bloco `payslips.*` já existe como referência directa de forma.
- `lib/format.ts` — `formatKz`, `formatDate` (reutilizados, sem duplicar em
  `components/payroll/`).
- `Sidebar.tsx` — grupo "Recursos Humanos", itens `{ href, icon, label, roles? }`;
  sem `roles` = visível a todos; `roles: ['ADMIN','RH']` = filtrado (padrão de
  `roles-permissions`, `sucession`).

**Nota sobre a spec do backend** (`innova/docs/superpowers/specs/2026-09-02-payroll-workflow-design.md`,
secção 7): essa secção esboçou rotas `/payroll/runs/[id]`, `/payroll/components`,
`/payroll/compensation` como páginas Next dinâmicas separadas. O que o Sub-projecto B
efectivamente construiu (PRs #393-#396) foram abas dentro de `/payslips` para
componentes/compensação — este documento segue o padrão realmente implementado, não o
esboço original. Para o run workflow, a decisão #1 acima é deliberadamente diferente de
ambos: nem aba de `/payslips`, nem rota dinâmica `[id]` — uma página própria `/payroll`
com nav local lista⇄detalhe (mesmo padrão de `app/(platform)/payslips/page.tsx`, só que
sem `Tabs`, porque não há uma "aba B" a coexistir).

---

## Design

### 1. Rotas e ficheiros novos

```
app/(platform)/payroll/
  layout.tsx        — só <Metadata title="Folha de Pagamento">, igual a payslips/layout.tsx
  page.tsx           — nav local { view: 'list' } | { view: 'detail', runId: number }

components/payroll/
  types.ts            — PayrollRun, RunException, RunPayslip, RunStatus, TimelineStep, RUN_STATUS_MAP, EXCEPTION_SEVERITY_MAP
  RunListView.tsx      — tabela paginada + filtros + "+ Novo run"
  CreateRunModal.tsx    — form period/payGroup/countryCode/notes
  RunDetailView.tsx     — cabeçalho + acções + timeline + monta RunPayslipsTable + ExceptionsPanel
  RunPayslipsTable.tsx  — tabela paginada de recibos do run + acções por linha
  RecalcPayslipModal.tsx — form absenceDays/overtimeHours/bonusAmount/advanceDeduction
  ExceptionsPanel.tsx    — lista agrupada por severidade
```

`Sidebar.tsx`: nova linha no grupo "Recursos Humanos", logo antes ou depois de
`/payslips`:
```ts
{ href: '/payroll', icon: Wallet, label: 'Folha de Pagamento', roles: ['ADMIN', 'RH'] },
```
(`Wallet` de `lucide-react` — confirmar que já está importado no ficheiro; se não,
adicionar ao import existente.)

### 2. Camada de dados

`lib/queryKeys.ts`, novo bloco (mesma forma do bloco `payslips`):

```ts
payroll: {
  all: ['payroll'] as const,
  runList: (params: Record<string, unknown>) =>
    [...queryKeys.payroll.all, 'run-list', params] as const,
  runDetail: (id: number) => [...queryKeys.payroll.all, 'run-detail', id] as const,
  runPayslips: (id: number, params: Record<string, unknown>) =>
    [...queryKeys.payroll.all, 'run-payslips', id, params] as const,
  runExceptions: (id: number) =>
    [...queryKeys.payroll.all, 'run-exceptions', id] as const,
},
```

Regra de invalidação por mutação (todas via `useApiMutation({ invalidateKeys: [...] })`):

| Mutação | invalida |
|---|---|
| criar run | `runList` |
| process / submit / approve / reject / publish / cancel | `runDetail(id)`, `runList` |
| recalc / exclude payslip | `runDetail(id)` (totais/errorCount mudam), `runPayslips(id, *)`, `runExceptions(id)` |

`invalidateKeys` com prefixo parcial (`runPayslips(id, *)`) não é suportado directamente
por `invalidateQueries({ queryKey })` com igualdade exacta de array — usar o prefixo sem
`params`, i.e. invalidar por `[...queryKeys.payroll.all, 'run-payslips', id]` (React
Query invalida por prefixo de queryKey por omissão, `exact: false`), confirmar este
comportamento com um teste em vez de assumir.

### 3. `RunListView`

Tabela paginada (`GET /payroll/runs`, `PayrollRunFilterDto`: `period`, `status`,
`payGroup`, `page`, `limit`), no mesmo molde de `CompensationsView`:

Colunas: Período · Grupo (`payGroup ?? '—'`) · País · Estado (`StatusBadge` com
`RUN_STATUS_MAP`) · Colaboradores (`employeeCount`) · Total líquido (`formatKz(totalNet)`)
· Exceções (`exceptionsCount` total, `errorCount` em destaque se >0) · Criado em
(`formatDate(createdAt)`).

Filtros acima da tabela: `Select` de estado (todos os valores de `RunStatus` +
"Todos"), `Input` de período (texto livre, placeholder `"AAAA-MM"`), `Input` de
payGroup. Sem `useDebounce` nestes (poucos runs esperados, não é pesquisa livre por
texto longo como `CompensationsView`).

Botão "+ Novo run" (canto superior direito, como "+ Nova compensação") → abre
`CreateRunModal`. Clique na linha → `onSelect(run.id)`.

Vazio: `EmptyState` "Nenhum run encontrado" + sugestão de limpar filtros ou criar um.

### 4. `CreateRunModal`

Modal simples (`components/ui/Modal`), campos: `period` (`Input`, obrigatório, mesmo
placeholder `"AAAA-MM"`), `payGroup` (`Input`, opcional), `countryCode` (`Input`,
opcional, default visual `"AO"`), `notes` (`Textarea`, opcional). `POST /payroll/runs`
via `useApiMutation`; `onSuccess` fecha o modal e chama `onCreated(run.id)` para o
`page.tsx` navegar directamente para o detalhe do run recém-criado (evita o passo extra
de encontrar a linha na lista).

### 5. `RunDetailView`

**Cabeçalho**: `period` + `payGroup` + `countryCode`, `StatusBadge` grande
(`RUN_STATUS_MAP`), grelha de totais (`employeeCount`, `totalGross`, `totalNet`,
`totalDeductions`, `totalEmployerCost` — todos `formatKz`, `null`/`undefined` → `—`,
run ainda `DRAFT` não processado não tem totais).

**Barra de acções** — condicionada a `run.status`, replicando exactamente
`assertTransition`/`assertRunEditable` do backend para nunca oferecer uma acção que
devolveria 409/403 (tabela de referência):

| `run.status` | Acções visíveis |
|---|---|
| `DRAFT` | Processar |
| `SIMULATED` | Processar (reprocessar) · Submeter (desactivado + aviso se `errorCount>0`, mesmo texto do backend: `` `Run tem ${errorCount} exceção(ões) de erro — resolver antes de submeter.` ``) · Cancelar |
| `PROCESSING` | (transitório — nenhuma acção; mostrar spinner/estado, `useApiQuery` com `refetchInterval` curto até sair deste estado) |
| `PENDING_APPROVAL` | Aprovar · Rejeitar (painel motivo) · Cancelar |
| `APPROVED` | Publicar · Cancelar |
| `PUBLISHED` | — (terminal, sem acções) |
| `CANCELLED` | — (terminal, sem acções) |

Todas as mutações simples (`process`, `submit`, `approve`, `publish`) usam `useConfirm()`
antes de disparar — evita clique acidental numa acção irreversível (`publish`, `cancel`
não têm volta). `reject`/`cancel` abrem o painel inline com `Textarea` (padrão
`PlanDetailModal`): botão de confirmar só activo com `reason.trim()` não-vazio.

**Timeline**: renderiza `run.timeline` directamente — 5 linhas fixas (created/
processed/submitted/approved/published), cada uma com ícone de check se `at != null`
(cinzento se ainda não aconteceu), data formatada + `by.fullName` quando presente.

**Sub-secções** (sempre visíveis, mesmo com o run em `DRAFT` — ficam vazias): primeiro
`ExceptionsPanel`, depois `RunPayslipsTable` (exceções em primeiro porque é o que o RH
precisa de resolver antes de poder submeter).

### 6. `RunPayslipsTable`

Tabela paginada (`GET /:id/payslips`, `limit=50` por omissão): colaborador
(`fullName` + `employeeNumber`), bruto, líquido, indicador de exceções (ícone
`AlertCircle` se `hasExceptions`, com contagem), estado do recibo (`DRAFT`/`ISSUED` —
reutiliza `PAYSLIP_STATUS_MAP` de `components/payslips/types.ts`, não duplicar).

Acções por linha, só quando `run.status === 'SIMULATED'`:
- "Recalcular" → `RecalcPayslipModal` (form com os 4 campos opcionais do
  `RecalcPayslipInputsDto`, pré-preenchidos se o recibo já tiver `calcInputs`
  anteriores — a API devolve o `Payslip` completo, então os valores actuais estão
  disponíveis se o objecto os incluir; caso contrário começam vazios).
- "Excluir" → `useConfirm()` simples (sem motivo — o DTO de `exclude` não pede um),
  `PATCH .../exclude`.

### 7. `ExceptionsPanel`

Lista de `GET /:id/exceptions`, agrupada por severidade — `ERROR` primeiro (título
"Erros — bloqueiam submissão", `n` em badge danger), depois `WARNING` ("Avisos", badge
warning). Cada linha: nome do colaborador, `code` (mapeado para texto legível via um
`Record<string, string>` local com as 8 mensagens em português — a API já devolve
`message` em português feito no backend, então isto é só o rótulo curto do `code` para
o cabeçalho/filtro, a `message` completa da API é o texto principal da linha).

Sem exceções: nada a mostrar (painel não aparece, ou `EmptyState` compacto "Sem
exceções" só quando o run já foi processado pelo menos uma vez — distinguir de "run
ainda em DRAFT, nunca processado").

### 8. Testes (vitest, mesmo padrão de `components/payslips/*.test.tsx`)

- `RunListView`: loading/erro/vazio/happy path; filtro de estado refaz o pedido com o
  `status` certo.
- `RunDetailView`: **por cada estado da tabela da secção 5**, as acções certas aparecem
  e as erradas não (é o risco principal desta entrega — divergir da máquina de estados
  do backend); "Submeter" desactivado quando `errorCount>0`; painel de motivo não deixa
  confirmar com texto vazio.
- `RunPayslipsTable`: acções de linha só aparecem com `run.status==='SIMULATED'`.
- `RecalcPayslipModal`: submete só os campos preenchidos (undefined não vai no body).
- `CreateRunModal`: `period` obrigatório bloqueia o submit.
- Sem E2E nesta entrega (consistente com a spec do backend, secção 10).

---

## Fora de âmbito (documentado, não implementado nesta entrega)

- Selector de `departmentIds`/`userIds` no `CreateRunModal` (decisão #2).
- Edição de `payGroup`/`notes`/`countryCode` depois de criado o run (o DTO não tem
  `PUT`/`PATCH` no run em si, só nas transições — não há endpoint para isto).
- Qualquer acção em lote sobre múltiplos runs (aprovar vários de uma vez) — a API só
  opera sobre um run de cada vez.
- Reordenar/paginar a `ExceptionsPanel` separadamente da tabela de recibos — lista
  plana, sem paginação própria (a API não pagina este endpoint).

## Riscos

- **Divergência da máquina de estados**: se a UI mostrar uma acção inválida para o
  estado actual, o pedido falha com 409/403 do backend — mitigado pela tabela da
  secção 5, testada estado-a-estado (secção 8).
- **`PROCESSING` como estado transitório**: `process` é síncrono no backend (spec do
  backend, secção "Riscos" — pode exceder timeout com datasets grandes). A UI precisa de
  um `refetchInterval` curto (poll) enquanto `status==='PROCESSING'` para reflectir a
  transição para `SIMULATED` sem exigir refresh manual; parar o poll assim que sair
  desse estado.
- **`invalidateKeys` por prefixo**: a assunção da secção 2 sobre `exact: false` do React
  Query precisa de confirmação com um teste real antes de se assumir correcta em todas
  as mutações que tocam `runPayslips`.
