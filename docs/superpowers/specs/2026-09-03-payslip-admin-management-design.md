# Payslips — gestão de recibos (admin), Sub-projecto D

**Data:** 2026-09-03
**Âmbito:** frontend `tututazeni-frontend` (grosso do trabalho) + uma fatia
pequena no backend `innova` (2 endpoints de disputas + 2 correcções de
`include`), entregue como PR próprio mergeado primeiro — mesmo padrão do
Sub-projecto B-1.
**Tipo:** subsistema novo (conjunto de vistas admin + navegação) sobre uma API
maioritariamente já estável. Última das 4 peças da Fase 5 (A + B + C feitos).

---

## Problema

O módulo `payslips` do backend tem, desde antes da branch `feat/payroll-workflow`,
um conjunto de rotas Admin/RH que **nunca tiveram interface**: listar todos os
recibos, dashboard de compliance RH, detalhe de qualquer recibo, logs de acesso,
criar recibo individual, emitir, editar. O Sub-projecto A entregou a vista ESS
"A minha compensação"; o B entregou o catálogo salarial (componentes +
compensações) como abas de `/payslips`; o C entregou o workflow de `PayrollRun`
em `/payroll`. Falta a operação corrente sobre recibos individuais — o que um RH
faz no dia-a-dia fora de um ciclo de folha completo: emitir um recibo avulso,
corrigir um rascunho, ver quem acedeu a um recibo, tratar uma disputa aberta por
um colaborador.

Adicionalmente, o fluxo de **disputas** está meio-ligado: o colaborador abre
disputa (`POST /payslips/my/:id/dispute`) e o recibo passa a `DISPUTED`, mas não
existe endpoint para o RH listar disputas nem para as resolver, e `findOne` nem
sequer devolve `payslip.disputes`. O modelo `PayslipDispute` já tem
`status OPEN/RESOLVED` + `resolvedAt` + `resolution` à espera de serem escritos.

## Decisões (validadas em brainstorming com o utilizador, 2026-09-03)

| # | Decisão | Alternativa rejeitada |
|---|---|---|
| 1 | **Adicionar a `/payroll`** com uma tira de abas (`Runs · Recibos · Dashboard · Disputas`), no mesmo molde do `Button` tab-strip de `app/(platform)/payslips/page.tsx`. | Abas `adminOnly` em `/payslips` (como o B) — a página já tem 7 abas e o detalhe admin de um recibo (documento + emitir/editar + logs de acesso + disputas) não cabe no layout `max-w-4xl`; `/payroll` já é `max-w-6xl`. Rota nova dedicada — introduz uma terceira zona de navegação no domínio payroll sem ganho. |
| 2 | **Sem UI para `POST /payslips/bulk-create`.** D cobre só `POST /payslips` (recibo individual avulso). | Formulário de geração em massa — o workflow `PayrollRun` do Sub-projecto C já é a forma moderna e revisável de gerar recibos em lote (criar run → processar → rever excepções → aprovar → publicar). Dois caminhos concorrentes para a mesma tarefa na mesma página é confusão desnecessária. |
| 3 | **Incluir fatia backend para disputas** — `GET /payslips/disputes` + `PATCH /payslips/disputes/:id/resolve` — mergeada como PR próprio antes do frontend, tal como o B-1 (`GET /payroll/compensation/all`). | Só-leitura (mostrar `payslip.disputes` no detalhe sem acção de resolver) — deixava o gap de nunca se poder fechar uma disputa pela app. Fora de âmbito — a memória lista disputas explicitamente como parte do gap de D. |
| 4 | **Resolver disputa é opt-in quanto a reemitir.** `resolve` grava sempre `RESOLVED` + `resolution` + `resolvedAt`; só devolve o recibo a `ISSUED` se `reissue: true` for enviado (checkbox na modal, por omissão desligado). | `resolve` reemite sempre — tira ao RH o controlo sobre quando o recibo sai do estado `DISPUTED` (a correcção pode ainda não estar feita). |
| 5 | Segue exactamente os padrões já estabelecidos por `components/payroll/*` (C) e `components/payslips/*` (B): `useApiQuery`/`useApiMutation` + `invalidateKeys`, `StatusBadge` + `StatusBadgeMap`, `Pagination`, `useConfirm`/`useToast`, `KpiCard` para o dashboard, `useDirectoryUsers` para o picker de colaborador. Reutiliza `PAYSLIP_STATUS_MAP` / `formatKz` / `formatDate` / `fmtPeriod` de `components/payslips/` — **sem duplicar**. | Introduzir um padrão novo (tudo em modais, ou rota dinâmica `[id]`) — quebra a consistência do domínio payroll construído em B e C. |
| 6 | Sem guarda client-side própria na página — a sidebar já filtra `/payroll` com `roles: ADMIN_ROLES` (`['ADMIN','RH']`) e o backend faz `@Roles(Role.ADMIN, Role.RH)` em todas as rotas admin de `payslips`. | Guarda + redirect no `page.tsx` — precedente de `roles-permissions/page.tsx` e do próprio `/payroll` (C) é não ter guarda própria. |

---

## Estado actual confirmado

### API backend já em `main` (`src/payslips/payslips.controller.ts`)

`@Controller('payslips')`, `@UseGuards(JwtAuthGuard, RolesGuard)`. Rotas admin
(todas `@Roles(Role.ADMIN, Role.RH)`):

| Método | Rota | Body / Query | Devolve |
|---|---|---|---|
| GET | `/payslips` | query `PayslipFilterDto` | `{ data: Payslip[] (com `user`), total, page, limit, totalPages }` |
| GET | `/payslips/dashboard` | query `?period=AAAA-MM` (opcional, default mês corrente) | objecto de métricas (ver abaixo) |
| GET | `/payslips/:id` | — | `Payslip & { user }` (ver §2 — passa a incluir `disputes`) |
| GET | `/payslips/:id/access-logs` | — | `PayslipAccessLog[]` (`take: 50`, desc por `accessedAt`; ver §2 — passa a incluir `user`) |
| POST | `/payslips` | `CreatePayslipDto` | `Payslip & { user }` (status `DRAFT`) — **409** se já existir recibo desse `period` para o `userId` |
| PATCH | `/payslips/:id/issue` | — | `Payslip` (status `ISSUED`, notifica colaborador) — **409** se já `ISSUED`/`ACKNOWLEDGED` |
| PUT | `/payslips/:id` | `UpdatePayslipDto` (`PartialType(CreatePayslipDto)`) | `Payslip` recalculado, **status forçado a `DRAFT`** — **403** (`assertPayslipEditable`) se bloqueado |

`GET /payslips/:id/pdf` **não existe** para admin — só `GET /payslips/my/:id/pdf`
(dono ou ADMIN/RH ao nível do dado, mas prefixo `my`). Download de PDF a partir
das vistas admin fica **fora de âmbito** (follow-up de backend).

**`PayslipFilterDto`** (`extends BaseFilterDto`): `page?` (default 1),
`limit?` (default 20, `@Max(100)`), `userId?: number`, `period?: string`
(`"AAAA-MM"`, match exacto), `year?: string` (`startsWith`, ignorado se `period`
presente), `status?: PayslipStatus`. **Não há filtro por nome** — só `userId`.

**`CreatePayslipDto`**: `userId: number` (obrigatório), `period: string`
(obrigatório, `"AAAA-MM"`), `paymentDate: string` (obrigatório), `baseSalary:
number` (obrigatório). Opcionais: `mealAllowance`, `vacationAllowance`,
`christmasAllowance`, `overtime`, `bonuses`, `otherAllowances` (rendimentos);
`irtOverride`, `inssOverride`, `healthInsurance`, `loanDeduction`,
`advanceDeduction`, `otherDeductions` (deduções/overrides); `notes: string`
(notas internas, não visíveis ao colaborador). O backend calcula
`grossSalary`/`incomeTax`/`socialSecurity`/`employerInss`/`totalDeductions`/
`netSalary`/`irtBracketRate`/`irtFormula` a partir destes — o frontend **não**
envia campos calculados.

**`assertPayslipEditable`** (`payslips.service.ts`): recibo imutável quando
`status ∈ {ISSUED, ACKNOWLEDGED, DISPUTED}` **ou** `run.status === 'PUBLISHED'`.
`PUT /payslips/:id` valida isto antes de gravar (`ForbiddenException`).

**`GET /payslips/dashboard`** devolve:
```
{
  period: "AAAA-MM",
  counts: { total, issued, acknowledged, disputed, notViewed, draft },
  financials: { totalGross, totalNet, totalIRT, totalINSSEmployee,
                totalINSSEmployer, avgNet },
  compliance: { viewRate: string (ex "72.3%"), pendingAcknowledgement: number },
}
```

**Enums** (`prisma/schema.prisma`): `PayslipStatus = DRAFT | ISSUED |
ACKNOWLEDGED | DISPUTED`; `PayslipAccessAction = VIEW | ADMIN_VIEW | DOWNLOAD`;
`DisputeStatus = OPEN | RESOLVED`.

**`PayslipDispute`**: `{ id, payslipId, userId, reason, details?, status,
createdAt, resolvedAt?, resolution?, payslip }`. Relação `disputes
PayslipDispute[]` existe em `Payslip` mas `findOne` não a inclui hoje.

**`PayslipAccessLog`**: `{ id, payslipId, userId, action, ipAddress?, createdAt,
accessedAt }`. `getAccessLogs` não inclui `user` hoje → só `userId` cru.

### Frontend — padrões a reutilizar (já existentes)

- `app/(platform)/payroll/page.tsx` (C) — `max-w-6xl`, nav local
  `{ view: 'list' } | { view: 'detail', runId }`. É este ficheiro que ganha a
  tira de abas.
- `components/payroll/RunListView.tsx` / `RunPayslipsTable.tsx` — tabela paginada
  (`useApiQuery` + `keepPreviousData` + `Pagination` + `EmptyState`), filtros em
  `Select`/`Input` acima da tabela, `useApiMutation({ invalidateKeys })` com
  `useConfirm` antes de acções destrutivas. Modelo directo para `PayslipListView`
  e `DisputesView`.
- `components/payroll/RunDetailView.tsx` — cabeçalho + barra de acções
  condicionada ao `status` + sub-secções. Modelo para `AdminPayslipDetailView`.
- `components/payslips/PayslipDetailView.tsx` — bloco Remunerações/Deduções/
  Líquido (linhas ~252-383) a extrair como presentational partilhado (§5).
- `components/payslips/CompensationFormModal.tsx` — modo "create sem userId" com
  pesquisa de colaborador via `useDirectoryUsers(rawSearch, departmentId,
  enabled)` (re-exportado de `components/enrollments/enrollData.ts` através de
  `components/payslips/compensationData.ts`). Modelo directo para o picker do
  `CreatePayslipModal`.
- `components/onboarding/PlanDetailModal.tsx` — painel/modal com `Textarea` +
  motivo obrigatório antes de activar o confirmar. Modelo para
  `ResolveDisputeModal`.
- `components/ui/`: `KpiCard` (dashboard), `Card`, `StatusBadge`, `EmptyState`,
  `Pagination`, `Modal`, `FormField`, `Input`, `Select`, `Textarea`, `Button`,
  `IconButton`, `Skeleton`.
- `lib/statusBadge.ts` — `StatusBadgeMap<S>` + `resolveBadge` (fallback seguro
  para valores de enum não mapeados).
- `lib/format.ts` — `formatKz`, `formatDate`. `components/payslips/format.ts` —
  `fmtPeriod`.
- `lib/roles.ts` — `ADMIN_ROLES = ['ADMIN','RH']`. Sidebar `/payroll` já usa
  isto; **sem alteração à Sidebar**.
- `lib/queryClient.ts` — `STALE_TIME.{DYNAMIC, SEMI_STATIC, ...}`.

---

## Design

### 1. Rotas e ficheiros

```
app/(platform)/payroll/
  page.tsx            — ALTERADO: tira de abas Runs·Recibos·Dashboard·Disputas + Nav discriminado

components/payroll/
  types.ts             — ALTERADO: + AdminPayslip, PayslipAccessLog, PayslipDispute,
                          DisputeStatus, HrDashboard, DISPUTE_STATUS_MAP
  PayslipListView.tsx    — NOVO
  CreatePayslipModal.tsx — NOVO
  EditPayslipModal.tsx   — NOVO
  AdminPayslipDetailView.tsx — NOVO
  AccessLogsPanel.tsx    — NOVO
  HrDashboardView.tsx    — NOVO
  DisputesView.tsx       — NOVO
  ResolveDisputeModal.tsx — NOVO

components/payslips/
  PayslipAmountBreakdown.tsx — NOVO: presentational extraído de PayslipDetailView
  PayslipDetailView.tsx      — ALTERADO: passa a compor <PayslipAmountBreakdown>
```

`page.tsx` `Nav`:
```ts
type Nav =
  | { tab: 'runs'; view: 'list' }
  | { tab: 'runs'; view: 'detail'; runId: number }
  | { tab: 'payslips'; view: 'list' }
  | { tab: 'payslips'; view: 'detail'; payslipId: number }
  | { tab: 'dashboard' }
  | { tab: 'disputes' };
```
Tira de abas só visível quando `view === 'list'` do lado dos `runs`/`payslips`
(nos detalhes some, como em `payslips/page.tsx`). Título por aba via um
`Record<Nav['tab'], string>`. Estado inicial `{ tab: 'runs', view: 'list' }` —
não muda o comportamento actual de quem entra em `/payroll`.

### 2. Fatia backend — PR próprio, mergeado primeiro

Ramo/PR no repo `innova`: **`feat(payslips): admin disputes list + resolve; access-log & detail includes`**

**2.1 — `GET /payslips/disputes`** (`payslips.controller.ts`, `@Roles(ADMIN, RH)`,
colocar **antes** de `@Get(':id')` para não ser comido pela rota paramétrica —
mesma armadilha de ordenação de `dashboard`).
- Query `DisputeFilterDto extends BaseFilterDto`: `status?: DisputeStatus`,
  `period?: string` (filtra `payslip.period`).
- `svc.listDisputes(filters)` → `buildPaginatedResponse` com
  `include: { payslip: { select: { id, receiptCode, period, userId, status } },
  user: { select: { id, fullName, employeeNumber } } }`, `orderBy: [{ status:
  'asc' }, { createdAt: 'desc' }]` (OPEN primeiro).

**2.2 — `PATCH /payslips/disputes/:id/resolve`** (`@Roles(ADMIN, RH)`,
`@HttpCode(200)`).
- Body `ResolveDisputeDto`: `resolution: string` (`@IsString`, `@MinLength(1)`),
  `reissue?: boolean` (`@IsOptional @IsBoolean`).
- `svc.resolveDispute(id, dto)`:
  - `findUnique` a disputa com `include: { payslip: true }`; 404 se não existir.
  - Se `status === 'RESOLVED'` → 409 `ConflictException('Disputa já resolvida')`.
  - `update` disputa: `{ status: 'RESOLVED', resolvedAt: new Date(), resolution:
    dto.resolution }`.
  - Se `dto.reissue === true` **e** `payslip.status === 'DISPUTED'` →
    `payslip.update({ status: 'ISSUED' })`. Senão não toca no recibo.
  - `createNotificationSafe(prisma, logger, { userId: dispute.userId, type:
    'PAYSLIP_DISPUTE', message: `A sua disputa sobre o recibo ${receiptCode} foi
    resolvida.` })`.
  - Devolve a disputa actualizada (com `payslip` incluído).

**2.3 — `findOne` inclui disputas.** `payslips.service.ts#findOne`:
acrescentar ao `include` `disputes: { orderBy: { createdAt: 'desc' } }`. Não
altera a autorização (o `assertCanAccess` continua a filtrar por dono/ADMIN/RH).

**2.4 — `getAccessLogs` inclui `user`.** Acrescentar
`include: { user: { select: { id: true, fullName: true } } }` ao `findMany`.

**2.5 — DTOs.** `DisputeFilterDto` e `ResolveDisputeDto` em `payslips.dto.ts`.

**2.6 — Teste de integração** (`test/integration/payslip-disputes.integration-spec.ts`,
molde dos specs de payslips existentes):
- seed: 1 recibo `ISSUED` → colaborador abre disputa → recibo `DISPUTED`.
- `GET /payslips/disputes?status=OPEN` como RH devolve a disputa; como
  COLABORADOR → 403.
- `PATCH .../resolve` sem `reissue` → disputa `RESOLVED`, recibo continua
  `DISPUTED`.
- `PATCH .../resolve` com `reissue: true` (segunda disputa noutro recibo) →
  disputa `RESOLVED` **e** recibo `ISSUED`.
- `PATCH .../resolve` numa disputa já `RESOLVED` → 409.
- `resolution` vazio → 400.
- `afterAll`: apagar `PayslipDispute` (e `PayslipAccessLog`) **antes** de
  `Payslip`, filtrando por `payslipId` — nunca por `userId`
  (`PayslipAccessLog.userId` é o visualizador). Ver
  `project_innova_integration_test_infra`.

Segue as regras de `CLAUDE.md`: CI `quality` verde obrigatório antes de merge;
correr a suite de integração completa, não só o ficheiro novo.

### 3. Camada de dados — `lib/queryKeys.ts`

Estender o bloco `payslips` (todas funções — chaves estáticas rebentam com
"Cannot access before initialization", convenção já documentada):
```ts
adminList: (params: Record<string, unknown>) =>
  [...queryKeys.payslips.all, 'admin-list', params] as const,
adminDetail: (id: number) =>
  [...queryKeys.payslips.all, 'admin-detail', id] as const,
accessLogs: (id: number) =>
  [...queryKeys.payslips.all, 'access-logs', id] as const,
dashboard: (period: string) =>
  [...queryKeys.payslips.all, 'dashboard', period] as const,
disputes: (params: Record<string, unknown>) =>
  [...queryKeys.payslips.all, 'disputes', params] as const,
```

Regra de invalidação (`useApiMutation({ invalidateKeys: [...] })`):

| Mutação | Invalida |
|---|---|
| criar recibo (`POST /payslips`) | `adminList` (prefixo, sem `params`) |
| emitir (`PATCH :id/issue`) | `adminDetail(id)`, `adminList`, `dashboard` (prefixo) |
| editar (`PUT :id`) | `adminDetail(id)`, `adminList` (prefixo) |
| resolver disputa (`PATCH disputes/:id/resolve`) | `disputes` (prefixo), `adminDetail(payslipId)`, `adminList` (prefixo), `dashboard` (prefixo) |

Prefixo = passar `[...queryKeys.payslips.all, 'admin-list']` sem `params` —
React Query invalida por prefixo por omissão (`exact: false`). É o mesmo padrão
já usado e testado em `components/payroll/` (C, `runPayslipsAll`).

### 4. `PayslipListView`

`GET /payslips` via `useApiQuery<PaginatedPayslips>(queryKeys.payslips.adminList
(params), '/payslips', { params, staleTime: STALE_TIME.DYNAMIC, placeholderData:
keepPreviousData })`.

Filtros (linha acima da tabela, `Select`/`Input`, sem debounce — poucos filtros,
não é pesquisa livre):
- `Select` estado: `Todos` + os 4 valores de `PayslipStatus`.
- `Input` período: texto livre, placeholder `"AAAA-MM"`.
- `Input` ano: placeholder `"AAAA"` (ignorado pelo backend se período preenchido
  — nota visual "ignorado quando há período").
- Qualquer mudança de filtro → `setPage(1)`.

Colunas: Colaborador (`user.fullName` + `user.employeeNumber` em mono) ·
Período (`fmtPeriod`) · Pagamento (`formatDate`) · Bruto (`formatKz`) ·
Líquido (`formatKz`, semibold) · Estado (`StatusBadge` + `PAYSLIP_STATUS_MAP`,
`variant="dot"`) · Acções.

Acções por linha (`onClick` com `stopPropagation`):
- "Ver" (`IconButton` Eye) → `onSelect(p.id)`.
- "Emitir" (`Button` sm, **só** `p.status === 'DRAFT'`) → `useConfirm({ title:
  'Emitir recibo?', message: 'O colaborador é notificado e passa a poder ver o
  recibo.' })` → `issue.mutate(p.id)` (`apiClient.patch(`/payslips/${id}/issue`)`).

Clique na linha → `onSelect(p.id)`.

Topo direito: "+ Novo recibo" → abre `CreatePayslipModal`.

`Skeleton` no loading; **ramo de erro explícito** (`error &&
<div className="text-danger">{error.message}</div>` — nunca cair no `EmptyState`
quando o fetch falha, ver risco conhecido do `ExceptionsPanel` em C);
`EmptyState` "Sem recibos" só quando `!loading && !error && data.data.length ===
0`. `Pagination` quando `totalPages > 1`.

### 5. `PayslipAmountBreakdown` (extracção) + `PayslipDetailView`

Extrair de `components/payslips/PayslipDetailView.tsx` o bloco visual
Remunerações / Deduções / Resumo final (linhas ~252-383, incluindo o
sub-componente `SalaryRow`) para
`components/payslips/PayslipAmountBreakdown.tsx`:

```tsx
export interface PayslipAmountBreakdownProps {
  payslip: Pick<Payslip,
    | 'baseSalary' | 'mealAllowance' | 'vacationAllowance' | 'christmasAllowance'
    | 'overtime' | 'bonuses' | 'otherAllowances' | 'grossSalary'
    | 'incomeTax' | 'socialSecurity' | 'employerInss' | 'healthInsurance'
    | 'loanDeduction' | 'advanceDeduction' | 'otherDeductions'
    | 'totalDeductions' | 'netSalary' | 'irtBracketRate'>;
}
```

`PayslipDetailView` passa a renderizar `<PayslipAmountBreakdown payslip={data} />`
no mesmo sítio. É um **lift presentational puro** — sem lógica nova, sem props de
callback. `PayslipDetailView.test.tsx` tem de continuar verde sem alterações
(se assertar em texto do bloco, os `data-testid`/labels mantêm-se). Isto evita
que a vista admin e a vista do colaborador divirjam no cálculo/apresentação do
recibo — classe de bug recorrente neste repo.

### 6. `AdminPayslipDetailView`

`GET /payslips/:id` via `useApiQuery<AdminPayslip>(queryKeys.payslips.adminDetail
(payslipId), `/payslips/${payslipId}`, { staleTime: STALE_TIME.DYNAMIC })`.

**Cabeçalho**: botão "Voltar", nome do colaborador + `employeeNumber`, período
(`fmtPeriod`), `receiptCode` em mono, `StatusBadge` grande.

**Barra de acções** — condicionada a `status`, espelhando `assertPayslipEditable`
para nunca oferecer uma acção que devolveria 403/409:

| `status` | Acções |
|---|---|
| `DRAFT` | "Editar" (→ `EditPayslipModal`) · "Emitir" (`useConfirm` → `PATCH :id/issue`) |
| `ISSUED` | — + nota "Recibo emitido — já não é editável." |
| `ACKNOWLEDGED` | — + nota "Recibo confirmado pelo colaborador." |
| `DISPUTED` | — + nota "Recibo em disputa." · secção de disputas com "Resolver" nas `OPEN` |

(Se `payslip.run?.status === 'PUBLISHED'` mas o `status` ainda fosse `DRAFT` — não
deve acontecer, mas guardar: tratar como não-editável, nota "Recibo pertence a um
run publicado.")

**`<PayslipAmountBreakdown payslip={data} />`**.

**Secção Disputas** (só se `data.disputes.length > 0`): por disputa — `reason`,
`details`, `DisputeStatus` badge, `createdAt`; se `RESOLVED`: `resolvedAt` +
`resolution`; se `OPEN`: `Button` "Resolver" → `ResolveDisputeModal`
(mesmo componente da aba Disputas, §9).

**`<AccessLogsPanel payslipId={payslipId} />`** (§7).

Loading → `Skeleton`; **erro → mensagem `text-danger` explícita**, não
`EmptyState`.

### 7. `AccessLogsPanel`

`GET /payslips/:id/access-logs` via `useApiQuery<PayslipAccessLog[]>
(queryKeys.payslips.accessLogs(payslipId), ...)`. Tabela simples, read-only:
Acção (`VIEW` "Visualização" / `ADMIN_VIEW` "Visualização (admin)" / `DOWNLOAD`
"Descarga" — `Record` local) · Quem (`log.user?.fullName ?? `#${log.userId}``) ·
IP (`log.ipAddress ?? '—'`) · Quando (`formatDate(log.accessedAt)`).

Cabeçalho "Últimos 50 acessos". **Sem paginação** (o endpoint faz `take: 50`
fixo, sem `page`). Vazio → linha "Sem acessos registados." Erro → `text-danger`.

### 8. `CreatePayslipModal`

`Modal` (`components/ui/Modal`). `POST /payslips` via `useApiMutation`.

Campos:
- **Colaborador** (obrigatório) — picker igual ao `CompensationFormModal` modo
  "create sem userId": `Input` de pesquisa → `useDirectoryUsers(rawSearch,
  departmentId='', enabled=modalOpen)` (importado de
  `@/components/payslips/compensationData`) → lista de resultados → ao escolher
  fixa `picked: DirectoryUser`, com "x" para limpar. Envia `userId: picked.id`.
- **Período** (obrigatório) — `Input`, placeholder `"AAAA-MM"`.
- **Data de pagamento** (obrigatório) — `Input type="date"`.
- **Salário base** (obrigatório) — `Input type="number"` (Kz).
- **Campos avançados** (toggle "Mostrar campos avançados", colapsado por
  omissão): rendimentos (`mealAllowance`, `vacationAllowance`,
  `christmasAllowance`, `overtime`, `bonuses`, `otherAllowances`) e
  deduções/overrides (`irtOverride`, `inssOverride`, `healthInsurance`,
  `loanDeduction`, `advanceDeduction`, `otherDeductions`) — todos
  `Input type="number"` opcionais.
- **Notas internas** — `Textarea` opcional.

Submit desactivado até `picked && period.trim() && paymentDate && baseSalary`
não-vazio/`>= 0`. **Só envia campos preenchidos** — números vazios viram
`undefined` e não vão no body (mesma regra do `RecalcPayslipModal` em C).

`onError` 409 → `notify({ intent: 'error', title: 'Recibo desse período já existe
para este colaborador' })`. `onSuccess(created)` → fecha e chama
`onCreated(created.id)` para o `page.tsx` navegar para
`{ tab: 'payslips', view: 'detail', payslipId: created.id }`.

### 9. `EditPayslipModal`

`Modal`. `PUT /payslips/:id` via `useApiMutation`. Mesmos campos do
`CreatePayslipModal` **excepto** o picker de colaborador (não se muda o dono),
pré-preenchidos a partir do `payslip` recebido por prop.

**Banner de aviso** no topo (`bg-warning-subtle text-warning-ink`): "Guardar
devolve o recibo a Rascunho e recalcula IRT, INSS e líquido a partir dos valores
introduzidos."

Só montado a partir do `AdminPayslipDetailView` quando `status === 'DRAFT'`
(guarda de UI). `onError` 403 → `notify({ intent: 'error', title: 'Recibo não
editável no estado actual' })`. `onSuccess` → fecha + invalida
`adminDetail`/`adminList`.

### 10. `HrDashboardView`

`GET /payslips/dashboard` via `useApiQuery<HrDashboard>(queryKeys.payslips.
dashboard(period), '/payslips/dashboard', { params: { period }, staleTime:
STALE_TIME.SEMI_STATIC })`.

`Input` período no topo (placeholder `"AAAA-MM"`, default
`new Date().toISOString().slice(0,7)`).

Três grupos de `KpiCard`:
- **Contagens**: Total · Emitidos · Confirmados · Em disputa · Por confirmar
  (`notViewed`) · Rascunhos (`draft`).
- **Financeiro** (`formatKz`): Bruto total · Líquido total · IRT total ·
  INSS colaborador · INSS empregador · Líquido médio (`avgNet`).
- **Compliance**: Taxa de confirmação (`viewRate`, string já formatada) ·
  Pendentes de confirmação (`pendingAcknowledgement`).

Read-only. Loading → `Skeleton`; erro → `text-danger`.

### 11. `DisputesView` + `ResolveDisputeModal`

**`DisputesView`** — `GET /payslips/disputes` via `useApiQuery<Paginated
<PayslipDispute>>(queryKeys.payslips.disputes(params), '/payslips/disputes',
{ params, placeholderData: keepPreviousData })`.

Filtro: `Select` estado (`Todas` / `OPEN` "Abertas" / `RESOLVED` "Resolvidas"),
**default `OPEN`**.

Colunas: Colaborador (`dispute.user.fullName` + `employeeNumber`) · Recibo
(`payslip.receiptCode` + `fmtPeriod(payslip.period)`, clicável → navega para
`{ tab: 'payslips', view: 'detail', payslipId: payslip.id }`) · Motivo
(`reason`, truncado) · Estado (`StatusBadge` + `DISPUTE_STATUS_MAP`) ·
Aberta em (`formatDate(createdAt)`) · Resolvida em (`resolvedAt ? formatDate :
'—'`) · Acções.

Acção: "Resolver" (`Button` sm, só `status === 'OPEN'`) → `ResolveDisputeModal`.

`Pagination`; loading → `Skeleton`; **erro → `text-danger` explícito**; vazio →
`EmptyState` ("Sem disputas" / "Sem disputas abertas" conforme filtro).

**`ResolveDisputeModal`** (`Modal`, partilhado com `AdminPayslipDetailView`).
`PATCH /payslips/disputes/:id/resolve` via `useApiMutation`.
- `Textarea` **Resolução** (obrigatório) — descrição do que foi feito/decidido.
- `Checkbox` "Reemitir recibo (volta a Emitido)" → `reissue` — **por omissão
  desligado**. Texto de ajuda: "Marca apenas se a correcção já está feita e o
  recibo pode voltar ao estado Emitido."
- Confirmar desactivado até `resolution.trim()` não-vazio.
- `onError` 409 → `notify({ intent: 'error', title: 'Disputa já resolvida' })`.
- `onSuccess` → fecha + invalida `disputes` + `adminDetail(payslipId)` +
  `adminList` + `dashboard`.

### 12. Tipos — `components/payroll/types.ts`

```ts
import type { PayslipStatus } from '@/components/payslips/types';

export type DisputeStatus = 'OPEN' | 'RESOLVED';

export interface PayslipDispute {
  id: number; payslipId: number; userId: number;
  reason: string; details: string | null;
  status: DisputeStatus; createdAt: string;
  resolvedAt: string | null; resolution: string | null;
  user?: { id: number; fullName: string; employeeNumber: string | null };
  payslip?: { id: number; receiptCode: string | null; period: string;
              userId: number; status: PayslipStatus };
}

export interface PayslipAccessLog {
  id: number; payslipId: number; userId: number;
  action: 'VIEW' | 'ADMIN_VIEW' | 'DOWNLOAD';
  ipAddress: string | null; accessedAt: string;
  user?: { id: number; fullName: string };
}

// AdminPayslip = a Payslip de components/payslips/types (o seu `user` já traz
// position/department/nif/nib/hireDate) + disputes + run.
export type AdminPayslip =
  import('@/components/payslips/types').Payslip & {
    disputes: PayslipDispute[];
    run?: { id: number; status: string } | null;
  };

export interface HrDashboard {
  period: string;
  counts: { total: number; issued: number; acknowledged: number;
            disputed: number; notViewed: number; draft: number };
  financials: { totalGross: number; totalNet: number; totalIRT: number;
                totalINSSEmployee: number; totalINSSEmployer: number;
                avgNet: number };
  compliance: { viewRate: string; pendingAcknowledgement: number };
}

export const DISPUTE_STATUS_MAP: StatusBadgeMap<DisputeStatus> = {
  OPEN:     { label: 'Aberta',    cls: 'bg-warning-subtle text-warning-ink' },
  RESOLVED: { label: 'Resolvida', cls: 'bg-success-subtle text-success-ink' },
};
```

`PaginatedPayslips` reutiliza-se de `components/payslips/types.ts`. `formatKz`/
`formatDate`/`fmtPeriod`/`PAYSLIP_STATUS_MAP` importam-se, **não se duplicam**.

### 13. Testes (vitest + RTL, molde de `components/payroll/*.test.tsx`)

- **`PayslipListView`**: loading → skeleton; erro → mensagem de erro (**não**
  EmptyState); vazio → EmptyState; happy path renderiza linhas; mudar o `Select`
  de estado refaz o pedido com `status` certo (assert no mock de `useApiQuery`/
  `apiClient`); "Emitir" só aparece em linhas `DRAFT`; clicar "Emitir" chama
  `confirm` e depois a mutação.
- **`AdminPayslipDetailView`**: por cada `status` (`DRAFT`/`ISSUED`/
  `ACKNOWLEDGED`/`DISPUTED`), as acções certas aparecem e as erradas não
  (Editar+Emitir só em `DRAFT`); secção de disputas só com `disputes.length>0`,
  "Resolver" só nas `OPEN`; **ramo de erro do fetch** renderiza mensagem, não
  EmptyState; `<PayslipAmountBreakdown>` recebe o payslip.
- **`PayslipAmountBreakdown`**: renderiza base/bruto/líquido; linhas opcionais
  (ex. `mealAllowance`) só aparecem quando `> 0`.
- **`CreatePayslipModal`**: submit bloqueado sem colaborador / período /
  data / salário base; campos numéricos vazios não vão no body (assert no
  payload do `apiClient.post`); 409 → toast de erro.
- **`EditPayslipModal`**: banner de aviso DRAFT presente; campos pré-preenchidos
  a partir da prop; 403 → toast.
- **`HrDashboardView`**: renderiza os três grupos de cartões; mudar o período
  refaz o pedido com o `period` certo.
- **`DisputesView`**: default filtro `OPEN`; mudar filtro refaz o pedido;
  "Resolver" só nas `OPEN`; erro → mensagem, não EmptyState.
- **`ResolveDisputeModal`**: confirmar desactivado com `resolution` vazio;
  `reissue` por omissão `false` e vai no body só quando marcado; 409 → toast.
- **`page.tsx`**: trocar de aba muda a vista; entrar em `{tab:'payslips',
  view:'detail'}` esconde a tira de abas.
- **Backend**: `payslip-disputes.integration-spec.ts` (§2.6).
- Sem E2E (consistente com A/B/C).

---

## Fora de âmbito (documentado, não implementado)

- **UI de `POST /payslips/bulk-create`** — decisão #2; geração em lote é o
  workflow `PayrollRun` (`/payroll`, aba Runs).
- **Download de PDF a partir das vistas admin** — não existe `GET /payslips/:id/
  pdf` (só `/payslips/my/:id/pdf`). Follow-up de backend (rota admin de PDF +
  botão nas vistas).
- **Pesquisa por nome de colaborador na lista** — `PayslipFilterDto` só filtra
  por `userId`. Se for preciso, é um filtro de backend novo.
- **Paginação dos logs de acesso** — o endpoint faz `take: 50` fixo.
- **Editar um recibo `ISSUED` sem o passar por `DRAFT`** — o backend não tem esse
  caminho; `PUT` força sempre `DRAFT`.
- **Linhas de `PayslipItem` no detalhe** — não são escritas por nenhum serviço
  (nota no `schema.prisma`).
- **Reabrir uma disputa `RESOLVED`** — sem endpoint; `resolve` é terminal.
- **Acção em lote sobre disputas/recibos** — uma de cada vez.

## Riscos

- **Extracção de `PayslipAmountBreakdown`** toca o fluxo do colaborador. Mitigação:
  lift puramente presentational, sem props de callback nem lógica nova;
  `PayslipDetailView.test.tsx` corre verde sem alterações antes de se dar por
  fechado.
- **Divergência da barra de acções vs. `assertPayslipEditable`**: se a UI
  oferecer Editar/Emitir num estado bloqueado, o pedido falha com 403/409.
  Mitigação: tabela da §6, testada estado-a-estado (§13) — mesmo método usado em
  C para `assertTransition`.
- **Ordenação de rotas no backend**: `@Get('disputes')` tem de vir antes de
  `@Get(':id')` senão `:id` captura `"disputes"`. Mitigação: teste de integração
  cobre `GET /payslips/disputes` e falharia de imediato.
- **`invalidateKeys` por prefixo**: assume `exact: false` do React Query — já é o
  comportamento confirmado por teste em C (`runPayslipsAll`); manter um teste
  equivalente aqui em vez de assumir.
- **Sequência de merge**: o PR frontend depende do PR backend (§2) estar em
  `main` para os endpoints de disputas existirem. Mergear backend primeiro,
  confirmar `quality` verde, só então abrir/mergear o frontend.
