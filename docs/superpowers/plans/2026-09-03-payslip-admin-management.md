# Payslip Admin Management (Sub-project D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the payslips admin endpoints a frontend — list-all, HR dashboard, admin detail (issue / edit / access-logs), plus a new backend slice for listing and resolving payslip disputes — surfaced as four tabs on the existing `/payroll` route.

**Architecture:** Two PRs, merged in order. **PR 1 (backend, repo `innova`)** adds `GET /payslips/disputes` + `PATCH /payslips/disputes/:id/resolve` and two `include` fixes (`findOne` → `disputes`, `getAccessLogs` → `user`). **PR 2 (frontend, repo `innova/frontend`, branch `feat/payslip-admin-management`)** adds a tab strip to `app/(platform)/payroll/page.tsx` and 8 new components under `components/payroll/`, reusing every pattern already established by `components/payroll/*` (Sub-project C) and `components/payslips/*` (Sub-project B). A shared `PayslipAmountBreakdown` is extracted from the existing employee `PayslipDetailView` so the admin and employee views cannot drift.

**Tech Stack:** NestJS + Prisma + class-validator (backend); Next.js App Router + React Query (`useApiQuery`/`useApiMutation`) + Tailwind design tokens + vitest/RTL (frontend). Backend integration tests: Jest + supertest against a real Postgres (`innova_test`).

**Spec:** `frontend/docs/superpowers/specs/2026-09-03-payslip-admin-management-design.md`

## Global Constraints

- **Two repos.** Backend tasks (1-3) run in `C:/Users/PLÁCIDO COSTA/innova`. Frontend tasks (4-14) run in `C:/Users/PLÁCIDO COSTA/innova/frontend` on branch `feat/payslip-admin-management` (already created).
- **Merge order is hard:** PR 1 (backend) must be merged to `main` and its `quality` check green **before** PR 2 (frontend) is opened/merged — PR 2's dispute views call endpoints that only exist after PR 1.
- **Backend:** `main` is branch-protected — branch + PR + green `quality` check (`.github/workflows/quality.yml`), never push to `main`, never `--admin`-merge. Run the **full** integration suite (`npm run test:integration`), not just the changed file. `DB_POOL_MAX=5` must be in `.env.test`. Redis must be running locally for integration tests.
- **Backend Prisma rules (from `CLAUDE.md`):** `User.fullName` never `name`; filter roles by `roleCode` never `role` string; `AuditLog` field is `entity`; `PayslipAccessLog.userId` is the **viewer**, never the payslip owner — filter dispute/log cleanup by `payslipId`. Confirm every model/field against `prisma/schema.prisma` — do not trust a unit-test mock.
- **Frontend CI = `quality.yml` job `build`:** `npm run lint` + `npm test` (vitest) + `npm run build`. No prettier gate, no `tsc` gate. Do **not** run `npx prettier --write .` — the working copy is CRLF and it will reformat hundreds of unrelated files.
- **Frontend commit trailer** (every commit):
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV
  ```
- **Frontend reuse rules:** import `formatKz`/`formatDate` from `@/lib/format`, `fmtPeriod` from `@/components/payslips/format`, `PAYSLIP_STATUS_MAP` + `Payslip` type from `@/components/payslips/types`, `Paginated<T>` from `@/components/payroll/types`. Never duplicate these.
- **`GET /payslips` returns `{ data, meta: { total, page, limit, totalPages } }`** (via `buildPaginatedResponse`) — the `{ data, meta }` shape, same as the payroll module's `Paginated<T>`. Do **not** reuse `components/payslips/types.ts` `PaginatedPayslips` (a flat shape used only by the employee `ListView`).
- **`queryKeys` rule:** every non-`all` key is a function (static keys throw "Cannot access before initialization").
- **Every data-fetching component MUST render an explicit `error` branch** distinct from its empty state (a failed fetch must never read as "no data"). This is a known recurring bug class in this codebase.

---

## File Structure

### PR 1 — backend (`innova`)

| File | Responsibility |
|---|---|
| `src/payslips/payslips.dto.ts` (modify) | + `DisputeFilterDto`, `ResolveDisputeDto` |
| `src/payslips/payslips.service.ts` (modify) | + `listDisputes(filters)`, `resolveDispute(id, dto)`; `findOne` includes `disputes`; `getAccessLogs` includes `user` |
| `src/payslips/payslips.controller.ts` (modify) | + `GET /payslips/disputes`, `PATCH /payslips/disputes/:id/resolve` (both before `@Get(':id')`) |
| `test/integration/payslips/payslips.integration-spec.ts` (modify) | + `describe('Disputas (RH) — listagem e resolução')`; + assertions on `disputes`/`user` includes |

### PR 2 — frontend (`innova/frontend`)

| File | Responsibility |
|---|---|
| `components/payroll/types.ts` (modify) | + `AdminPayslip`, `PayslipDispute`, `PayslipAccessLog`, `DisputeStatus`, `HrDashboard`, `DISPUTE_STATUS_MAP` |
| `lib/queryKeys.ts` (modify) | + `payslips.adminList/adminDetail/accessLogs/dashboard/disputes` |
| `components/payslips/PayslipAmountBreakdown.tsx` (create) | Presentational money breakdown (rem./ded./líquido), extracted from `PayslipDetailView` |
| `components/payslips/PayslipDetailView.tsx` (modify) | Composes `<PayslipAmountBreakdown>` instead of inline markup |
| `components/payroll/PayslipListView.tsx` (create) | Paginated all-payslips table + filters + "Emitir" row action + "+ Novo recibo" |
| `components/payroll/CreatePayslipModal.tsx` (create) | `POST /payslips` form with employee picker |
| `components/payroll/EditPayslipModal.tsx` (create) | `PUT /payslips/:id` form (DRAFT-reversion warning) |
| `components/payroll/AccessLogsPanel.tsx` (create) | Read-only access-log table for one payslip |
| `components/payroll/AdminPayslipDetailView.tsx` (create) | Header + status-conditioned action bar + breakdown + disputes section + access-logs panel |
| `components/payroll/HrDashboardView.tsx` (create) | `GET /payslips/dashboard` KPI groups |
| `components/payroll/ResolveDisputeModal.tsx` (create) | `PATCH /payslips/disputes/:id/resolve` (resolution + opt-in reissue) |
| `components/payroll/DisputesView.tsx` (create) | Paginated disputes table + status filter + resolve action |
| `app/(platform)/payroll/page.tsx` (modify) | Tab strip `Runs · Recibos · Dashboard · Disputas` + discriminated `Nav` |
| `components/payroll/*.test.tsx`, `components/payslips/PayslipAmountBreakdown.test.tsx` | one test file per component above |

---

# PR 1 — Backend slice

> All tasks run in `C:/Users/PLÁCIDO COSTA/innova`. First: `git checkout main && git pull && git checkout -b feat/payslip-disputes-admin`.

---

### Task 1: `GET /payslips/disputes` — list disputes (Admin/RH)

**Files:**
- Modify: `src/payslips/payslips.dto.ts`
- Modify: `src/payslips/payslips.service.ts`
- Modify: `src/payslips/payslips.controller.ts`
- Test: `test/integration/payslips/payslips.integration-spec.ts`

**Interfaces:**
- Consumes: `BaseFilterDto` (`src/common/dtos/pagination.dto.ts`), `calculatePagination` + `buildPaginatedResponse` (`src/common/helpers/pagination.helper.ts`), `DisputeStatus` enum (`@prisma/client`).
- Produces: `PayslipsService.listDisputes(filters: DisputeFilterDto): Promise<PaginatedResponse<PayslipDispute & { payslip, user }>>`; route `GET /payslips/disputes`.

- [ ] **Step 1: Write the failing test**

Append this `describe` block inside `test/integration/payslips/payslips.integration-spec.ts`, immediately after the existing `describe('Administração (RH) — listagem, dashboard, logs', ...)` block (still inside the top-level `describe('Payslips Integration', ...)`):

```ts
  describe('Disputas (RH) — listagem e resolução', () => {
    let disputePayslipId: number;
    let disputeId: number;

    beforeAll(async () => {
      const created = await request(app.getHttpServer())
        .post('/payslips')
        .set('Authorization', `Bearer ${rhToken}`)
        .send({
          userId: otherEmployeeId,
          period: '2026-06',
          paymentDate: '2026-06-25',
          baseSalary: 200000,
        })
        .expect(201);
      disputePayslipId = created.body.id;

      await request(app.getHttpServer())
        .patch(`/payslips/${disputePayslipId}/issue`)
        .set('Authorization', `Bearer ${rhToken}`)
        .expect(200);

      const opened = await request(app.getHttpServer())
        .post(`/payslips/my/${disputePayslipId}/dispute`)
        .set('Authorization', `Bearer ${otherEmployeeToken}`)
        .send({ reason: 'IRT mal calculado', details: 'Escalão errado' })
        .expect(201);
      disputeId = opened.body.id;
    });

    it('colaborador não pode listar disputas → 403', async () => {
      await request(app.getHttpServer())
        .get('/payslips/disputes')
        .set('Authorization', `Bearer ${otherEmployeeToken}`)
        .expect(403);
    });

    it('RH lista disputas abertas com recibo e colaborador incluídos → 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/payslips/disputes?status=OPEN')
        .set('Authorization', `Bearer ${rhToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta.totalPages');
      const row = res.body.data.find((d: any) => d.id === disputeId);
      expect(row).toBeDefined();
      expect(row.status).toBe('OPEN');
      expect(row.payslip).toMatchObject({ id: disputePayslipId, period: '2026-06' });
      expect(row.user).toMatchObject({ id: otherEmployeeId });
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:integration -- test/integration/payslips/payslips.integration-spec.ts -t "RH lista disputas abertas"`
Expected: FAIL — `GET /payslips/disputes` currently hits `@Get(':id')` → `ParseIntPipe` on `"disputes"` → 400 (not 200).

- [ ] **Step 3: Add `DisputeFilterDto`**

In `src/payslips/payslips.dto.ts`, add after `PayslipFilterDto`:

```ts
import { DisputeStatus } from '@prisma/client';

export { DisputeStatus };

// ─── Filtro de disputas (Admin/RH) ──────────────────────────────────────────
export class DisputeFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ example: '2026-06' })
  @IsOptional()
  @IsString()
  period?: string;
}
```

(`IsOptional`, `IsEnum`, `IsString`, `BaseFilterDto`, `ApiPropertyOptional` are already imported in this file.)

- [ ] **Step 4: Add `listDisputes` to the service**

In `src/payslips/payslips.service.ts`, add the import and a method. Add `DisputeFilterDto` to the existing `./payslips.dto` import. Then add this method (place it right after `createDispute`):

```ts
  // ─── LISTAR DISPUTAS (ADMIN / RH) ──────────────────────────────────────────
  async listDisputes(filters: DisputeFilterDto) {
    const { page = 1, limit = 20, status, period } = filters;
    const { skip, take } = calculatePagination(page, limit);

    const where: Prisma.PayslipDisputeWhereInput = {};
    if (status) where.status = status;
    if (period) where.payslip = { period };

    const [data, total] = await Promise.all([
      this.prisma.read.payslipDispute.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          payslip: {
            select: { id: true, receiptCode: true, period: true, userId: true, status: true },
          },
          user: { select: { id: true, fullName: true, employeeNumber: true } },
        },
      }),
      this.prisma.read.payslipDispute.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }
```

Note: `PayslipDispute` has no `user` relation in the schema shown, but `userId` is present. **Before implementing, check `prisma/schema.prisma` `model PayslipDispute`** — if there is no `user User @relation` line, add one (`user User @relation(fields: [userId], references: [id])`) plus the back-reference on `User`, and create a migration `npx prisma migrate dev --name payslip-dispute-user-relation`. If the relation already exists, skip the migration. Do the same check for the `payslip` relation (that one **is** already declared).

- [ ] **Step 5: Add the route**

In `src/payslips/payslips.controller.ts`, add `DisputeFilterDto` to the `./payslips.dto` import, then add this handler in the `// ── Admin / RH ──` section **before** `@Get(':id')`:

```ts
  @Get('disputes')
  @Roles(Role.ADMIN, Role.RH)
  @ApiOperation({ summary: 'Listar disputas de recibos' })
  listDisputes(@Query() filters: DisputeFilterDto) {
    return this.svc.listDisputes(filters);
  }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm run test:integration -- test/integration/payslips/payslips.integration-spec.ts -t "disputas"`
Expected: PASS (the 403 test and the list test).

- [ ] **Step 7: Run the full payslips spec**

Run: `npm run test:integration -- test/integration/payslips/payslips.integration-spec.ts`
Expected: all green (the new `beforeAll` creates a `2026-06` payslip for `otherEmployeeId`; the existing `afterAll` deletes disputes/logs by `payslipId` then payslips by `userId IN [employeeId, otherEmployeeId]`, so the new payslip is cleaned up).

- [ ] **Step 8: Commit**

```bash
git add src/payslips/payslips.dto.ts src/payslips/payslips.service.ts src/payslips/payslips.controller.ts test/integration/payslips/payslips.integration-spec.ts prisma/
git commit -m "$(printf 'feat(payslips): GET /payslips/disputes — admin dispute list\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 2: `PATCH /payslips/disputes/:id/resolve` — resolve a dispute (opt-in reissue)

**Files:**
- Modify: `src/payslips/payslips.dto.ts`
- Modify: `src/payslips/payslips.service.ts`
- Modify: `src/payslips/payslips.controller.ts`
- Test: `test/integration/payslips/payslips.integration-spec.ts`

**Interfaces:**
- Consumes: `createNotificationSafe` (`src/common/helpers/notification.helper.ts`), `ConflictException`/`NotFoundException` (`@nestjs/common`, already imported).
- Produces: `PayslipsService.resolveDispute(id: number, dto: ResolveDisputeDto): Promise<PayslipDispute & { payslip }>`; route `PATCH /payslips/disputes/:id/resolve`.

- [ ] **Step 1: Write the failing tests**

Add these `it` blocks inside the `describe('Disputas (RH) — listagem e resolução')` block from Task 1 (after the list test):

```ts
    it('resolver sem reissue → disputa RESOLVED, recibo continua DISPUTED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/payslips/disputes/${disputeId}/resolve`)
        .set('Authorization', `Bearer ${rhToken}`)
        .send({ resolution: 'Recalculado manualmente, sem alteração.' })
        .expect(200);
      expect(res.body.status).toBe('RESOLVED');
      expect(res.body.resolvedAt).toBeTruthy();

      const detail = await request(app.getHttpServer())
        .get(`/payslips/${disputePayslipId}`)
        .set('Authorization', `Bearer ${rhToken}`)
        .expect(200);
      expect(detail.body.status).toBe('DISPUTED');
    });

    it('resolver disputa já RESOLVED → 409', async () => {
      await request(app.getHttpServer())
        .patch(`/payslips/disputes/${disputeId}/resolve`)
        .set('Authorization', `Bearer ${rhToken}`)
        .send({ resolution: 'de novo' })
        .expect(409);
    });

    it('resolution vazio → 400', async () => {
      const second = await request(app.getHttpServer())
        .post(`/payslips/my/${disputePayslipId}/dispute`)
        .set('Authorization', `Bearer ${otherEmployeeToken}`)
        .send({ reason: 'segunda disputa' })
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/payslips/disputes/${second.body.id}/resolve`)
        .set('Authorization', `Bearer ${rhToken}`)
        .send({ resolution: '' })
        .expect(400);
    });

    it('resolver com reissue → disputa RESOLVED e recibo volta a ISSUED', async () => {
      const open = await request(app.getHttpServer())
        .get('/payslips/disputes?status=OPEN')
        .set('Authorization', `Bearer ${rhToken}`)
        .expect(200);
      const pending = open.body.data.find(
        (d: any) => d.payslip.id === disputePayslipId,
      );
      await request(app.getHttpServer())
        .patch(`/payslips/disputes/${pending.id}/resolve`)
        .set('Authorization', `Bearer ${rhToken}`)
        .send({ resolution: 'Corrigido e reemitido.', reissue: true })
        .expect(200);

      const detail = await request(app.getHttpServer())
        .get(`/payslips/${disputePayslipId}`)
        .set('Authorization', `Bearer ${rhToken}`)
        .expect(200);
      expect(detail.body.status).toBe('ISSUED');
    });

    it('colaborador não pode resolver → 403', async () => {
      await request(app.getHttpServer())
        .patch(`/payslips/disputes/999999/resolve`)
        .set('Authorization', `Bearer ${otherEmployeeToken}`)
        .send({ resolution: 'x' })
        .expect(403);
    });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:integration -- test/integration/payslips/payslips.integration-spec.ts -t "resolver"`
Expected: FAIL — route does not exist (404).

- [ ] **Step 3: Add `ResolveDisputeDto`**

In `src/payslips/payslips.dto.ts`, add after `DisputeFilterDto`. `MinLength` and `IsBoolean` — add `MinLength` to the existing `class-validator` import (`IsBoolean` is already imported):

```ts
export class ResolveDisputeDto {
  @ApiProperty({ description: 'Descrição da resolução da disputa' })
  @IsString()
  @MinLength(1)
  resolution: string;

  @ApiPropertyOptional({ description: 'Se true e o recibo está DISPUTED, volta a ISSUED' })
  @IsOptional()
  @IsBoolean()
  reissue?: boolean;
}
```

- [ ] **Step 4: Add `resolveDispute` to the service**

Add `ResolveDisputeDto` to the `./payslips.dto` import. Add this method after `listDisputes`:

```ts
  // ─── RESOLVER DISPUTA (ADMIN / RH) ─────────────────────────────────────────
  async resolveDispute(id: number, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.payslipDispute.findUnique({
      where: { id },
      include: { payslip: { select: { id: true, status: true, receiptCode: true } } },
    });
    if (!dispute) throw new NotFoundException('Disputa não encontrada');
    if (dispute.status === 'RESOLVED') {
      throw new ConflictException('Disputa já resolvida');
    }

    const updated = await this.prisma.payslipDispute.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date(), resolution: dto.resolution },
      include: {
        payslip: {
          select: { id: true, receiptCode: true, period: true, userId: true, status: true },
        },
        user: { select: { id: true, fullName: true, employeeNumber: true } },
      },
    });

    if (dto.reissue && dispute.payslip.status === 'DISPUTED') {
      await this.prisma.payslip.update({
        where: { id: dispute.payslipId },
        data: { status: 'ISSUED' },
      });
    }

    await createNotificationSafe(this.prisma, this.logger, {
      userId: dispute.userId,
      type: 'PAYSLIP_DISPUTE',
      message: `A sua disputa sobre o recibo ${dispute.payslip.receiptCode} foi resolvida.`,
    });

    return updated;
  }
```

- [ ] **Step 5: Add the route**

In `src/payslips/payslips.controller.ts`, add `ResolveDisputeDto` to the `./payslips.dto` import. Add this handler right after the `listDisputes` handler (still before `@Get(':id')`):

```ts
  @Patch('disputes/:id/resolve')
  @Roles(Role.ADMIN, Role.RH)
  @ApiOperation({ summary: 'Resolver uma disputa de recibo' })
  @HttpCode(HttpStatus.OK)
  resolveDispute(@Param('id', ParseIntPipe) id: number, @Body() dto: ResolveDisputeDto) {
    return this.svc.resolveDispute(id, dto);
  }
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:integration -- test/integration/payslips/payslips.integration-spec.ts -t "disputas"`
Expected: PASS — all list + resolve tests.

- [ ] **Step 7: Commit**

```bash
git add src/payslips/ test/integration/payslips/payslips.integration-spec.ts
git commit -m "$(printf 'feat(payslips): PATCH /payslips/disputes/:id/resolve — opt-in reissue\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 3: `findOne` includes `disputes`; `getAccessLogs` includes `user`

**Files:**
- Modify: `src/payslips/payslips.service.ts`
- Test: `test/integration/payslips/payslips.integration-spec.ts`

**Interfaces:**
- Produces: `PayslipsService.findOne` return value now has `disputes: PayslipDispute[]`; `getAccessLogs` rows now have `user: { id, fullName }`.

- [ ] **Step 1: Write the failing assertions**

Add to the `describe('Administração (RH) — listagem, dashboard, logs')` block:

```ts
    it('detalhe de recibo inclui as disputas → 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payslips/${payslipId}`)
        .set('Authorization', `Bearer ${rhToken}`)
        .expect(200);
      expect(Array.isArray(res.body.disputes)).toBe(true);
    });

    it('logs de acesso incluem o nome de quem acedeu → 200', async () => {
      const res = await request(app.getHttpServer())
        .get(`/payslips/${payslipId}/access-logs`)
        .set('Authorization', `Bearer ${rhToken}`)
        .expect(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].user).toHaveProperty('fullName');
    });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:integration -- test/integration/payslips/payslips.integration-spec.ts -t "inclui as disputas|nome de quem acedeu"`
Expected: FAIL — `res.body.disputes` is `undefined`; `res.body[0].user` is `undefined`.

- [ ] **Step 3: Add the includes**

In `src/payslips/payslips.service.ts`, in `findOne`, add to the `include` object (alongside `user`):

```ts
        disputes: { orderBy: { createdAt: 'desc' } },
```

In `getAccessLogs`, add to the `findMany` call:

```ts
      include: { user: { select: { id: true, fullName: true } } },
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm run test:integration -- test/integration/payslips/payslips.integration-spec.ts`
Expected: full file green.

- [ ] **Step 5: Run the FULL integration suite**

Run: `npm run test:integration`
Expected: all specs green. If "too many clients already" appears, confirm `DB_POOL_MAX=5` is in `.env.test` and rerun.

- [ ] **Step 6: Commit, push, open PR**

```bash
git add src/payslips/payslips.service.ts test/integration/payslips/payslips.integration-spec.ts
git commit -m "$(printf 'feat(payslips): findOne includes disputes; access-logs include viewer name\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
git push -u origin feat/payslip-disputes-admin
gh pr create --title "feat(payslips): admin dispute list + resolve; detail/access-log includes" --body "$(printf 'Sub-project D backend slice — see frontend/docs/superpowers/specs/2026-09-03-payslip-admin-management-design.md §2.\n\n- GET /payslips/disputes (paginated, ?status, ?period; Admin/RH)\n- PATCH /payslips/disputes/:id/resolve ({ resolution, reissue? }; opt-in reissue)\n- findOne includes disputes; getAccessLogs includes viewer name\n- integration coverage in payslips.integration-spec.ts\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)')"
```

- [ ] **Step 7: Wait for CI**

Poll `gh pr checks --watch`. When `quality` is green, squash-merge (`gh pr merge --squash`). Do not proceed to PR 2 until this is on `main`.

---

# PR 2 — Frontend

> All tasks run in `C:/Users/PLÁCIDO COSTA/innova/frontend` on branch `feat/payslip-admin-management` (already created). Run tests with `npx vitest run <path>`.

---

### Task 4: Types + query keys

**Files:**
- Modify: `components/payroll/types.ts`
- Modify: `lib/queryKeys.ts`
- Test: `components/payroll/types.test.ts` (modify)

**Interfaces:**
- Produces:
  - `AdminPayslip = Payslip & { disputes: PayslipDispute[]; run?: { id: number; status: string } | null }`
  - `interface PayslipDispute { id; payslipId; userId; reason; details: string|null; status: DisputeStatus; createdAt; resolvedAt: string|null; resolution: string|null; user?: { id; fullName; employeeNumber: string|null }; payslip?: { id; receiptCode: string|null; period; userId; status: PayslipStatus } }`
  - `interface PayslipAccessLog { id; payslipId; userId; action: 'VIEW'|'ADMIN_VIEW'|'DOWNLOAD'; ipAddress: string|null; accessedAt: string; user?: { id; fullName } }`
  - `type DisputeStatus = 'OPEN' | 'RESOLVED'`
  - `interface HrDashboard { period: string; counts: { total; issued; acknowledged; disputed; notViewed; draft }; financials: { totalGross; totalNet; totalIRT; totalINSSEmployee; totalINSSEmployer; avgNet }; compliance: { viewRate: string; pendingAcknowledgement: number } }`
  - `DISPUTE_STATUS_MAP: StatusBadgeMap<DisputeStatus>`
  - `queryKeys.payslips.adminList(params) / adminDetail(id) / accessLogs(id) / dashboard(period) / disputes(params)`

- [ ] **Step 1: Write the failing test**

In `components/payroll/types.test.ts`, add:

```ts
import { DISPUTE_STATUS_MAP } from './types';
import { queryKeys } from '@/lib/queryKeys';

test('DISPUTE_STATUS_MAP covers both statuses', () => {
  expect(DISPUTE_STATUS_MAP.OPEN.label).toBe('Aberta');
  expect(DISPUTE_STATUS_MAP.RESOLVED.label).toBe('Resolvida');
});

test('payslips admin query keys are prefixed and distinct', () => {
  expect(queryKeys.payslips.adminList({ page: 1 })).toEqual([
    'payslips', 'admin-list', { page: 1 },
  ]);
  expect(queryKeys.payslips.adminDetail(7)).toEqual(['payslips', 'admin-detail', 7]);
  expect(queryKeys.payslips.disputes({ status: 'OPEN' })).toEqual([
    'payslips', 'disputes', { status: 'OPEN' },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/types.test.ts`
Expected: FAIL — `DISPUTE_STATUS_MAP` undefined; `queryKeys.payslips.adminList` is not a function.

- [ ] **Step 3: Add the types**

In `components/payroll/types.ts`, add after the existing imports (`Payslip` is not yet imported — add it) and at the end of the file:

```ts
import type { Payslip } from '@/components/payslips/types';

export type DisputeStatus = 'OPEN' | 'RESOLVED';

export interface PayslipDispute {
  id: number;
  payslipId: number;
  userId: number;
  reason: string;
  details: string | null;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  user?: { id: number; fullName: string; employeeNumber: string | null };
  payslip?: {
    id: number;
    receiptCode: string | null;
    period: string;
    userId: number;
    status: PayslipStatus;
  };
}

export interface PayslipAccessLog {
  id: number;
  payslipId: number;
  userId: number;
  action: 'VIEW' | 'ADMIN_VIEW' | 'DOWNLOAD';
  ipAddress: string | null;
  accessedAt: string;
  user?: { id: number; fullName: string };
}

export type AdminPayslip = Payslip & {
  disputes: PayslipDispute[];
  run?: { id: number; status: string } | null;
};

export interface HrDashboard {
  period: string;
  counts: {
    total: number;
    issued: number;
    acknowledged: number;
    disputed: number;
    notViewed: number;
    draft: number;
  };
  financials: {
    totalGross: number;
    totalNet: number;
    totalIRT: number;
    totalINSSEmployee: number;
    totalINSSEmployer: number;
    avgNet: number;
  };
  compliance: { viewRate: string; pendingAcknowledgement: number };
}

export const DISPUTE_STATUS_MAP: StatusBadgeMap<DisputeStatus> = {
  OPEN: { label: 'Aberta', cls: 'bg-warning-subtle text-warning-ink' },
  RESOLVED: { label: 'Resolvida', cls: 'bg-success-subtle text-success-ink' },
};
```

(`PayslipStatus` and `StatusBadgeMap` are already imported at the top of the file.)

- [ ] **Step 4: Add the query keys**

In `lib/queryKeys.ts`, inside the `payslips: { ... }` object (after the existing `compensationHistory` entry, before the closing `}` of `payslips`):

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

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/payroll/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/payroll/types.ts components/payroll/types.test.ts lib/queryKeys.ts
git commit -m "$(printf 'feat(payslips): admin types + query keys for payslip management\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 5: Extract `PayslipAmountBreakdown` from `PayslipDetailView`

**Files:**
- Create: `components/payslips/PayslipAmountBreakdown.tsx`
- Modify: `components/payslips/PayslipDetailView.tsx`
- Test: `components/payslips/PayslipAmountBreakdown.test.tsx`

**Interfaces:**
- Produces: `PayslipAmountBreakdown({ payslip }: { payslip: PayslipAmountBreakdownProps['payslip'] })` — a pure presentational component rendering the Remunerações / Deduções / Resumo final block. No callbacks, no fetch.
- Consumes: `formatKz` from `@/lib/format`.

- [ ] **Step 1: Write the failing test**

Create `components/payslips/PayslipAmountBreakdown.test.tsx`:

```tsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayslipAmountBreakdown } from './PayslipAmountBreakdown';
import type { Payslip } from './types';

const base: Payslip = {
  id: 1, receiptCode: 'REC-1', period: '2026-06', paymentDate: '2026-06-25',
  netSalary: 180000, grossSalary: 250000, baseSalary: 250000,
  mealAllowance: 0, vacationAllowance: 0, christmasAllowance: 0,
  overtime: 0, bonuses: 0, otherAllowances: 0,
  incomeTax: 40000, socialSecurity: 7500, employerInss: 20000,
  healthInsurance: 0, loanDeduction: 0, advanceDeduction: 0, otherDeductions: 0,
  totalDeductions: 70000, irtBracketRate: 0.13, irtFormula: null,
  status: 'ISSUED', issuedAt: null, acknowledgedAt: null, notes: null,
};

describe('PayslipAmountBreakdown', () => {
  test('renders base, gross and net', () => {
    render(<PayslipAmountBreakdown payslip={base} />);
    expect(screen.getByText(/Salário base/i)).toBeInTheDocument();
    expect(screen.getByText(/Total bruto/i)).toBeInTheDocument();
    expect(screen.getByText(/Salário líquido/i)).toBeInTheDocument();
  });

  test('hides optional earning rows when zero', () => {
    render(<PayslipAmountBreakdown payslip={base} />);
    expect(screen.queryByText(/Subsídio de alimentação/i)).not.toBeInTheDocument();
  });

  test('shows an optional earning row when > 0', () => {
    render(<PayslipAmountBreakdown payslip={{ ...base, mealAllowance: 15000 }} />);
    expect(screen.getByText(/Subsídio de alimentação/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payslips/PayslipAmountBreakdown.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Create the component**

Create `components/payslips/PayslipAmountBreakdown.tsx` by lifting the markup from `PayslipDetailView.tsx` (the `SalaryRow` helper + the "Remunerações + Deduções" grid + the "Resumo final" block, currently lines ~88-115 and ~252-383). No behavior change:

```tsx
// components/payslips/PayslipAmountBreakdown.tsx
// Bloco apresentacional Remunerações / Deduções / Resumo final de um recibo.
// Extraído de PayslipDetailView para ser partilhado entre a vista do
// colaborador (components/payslips) e a vista admin (components/payroll/
// AdminPayslipDetailView) — evita que os dois divirjam no cálculo/render.

import { formatKz as fmtKz } from '@/lib/format';
import type { Payslip } from './types';

export interface PayslipAmountBreakdownProps {
  payslip: Pick<
    Payslip,
    | 'baseSalary' | 'mealAllowance' | 'vacationAllowance' | 'christmasAllowance'
    | 'overtime' | 'bonuses' | 'otherAllowances' | 'grossSalary'
    | 'incomeTax' | 'socialSecurity' | 'employerInss' | 'healthInsurance'
    | 'loanDeduction' | 'advanceDeduction' | 'otherDeductions'
    | 'totalDeductions' | 'netSalary' | 'irtBracketRate'
  >;
}

interface SalaryRowProps {
  label: string;
  amount: number;
  type?: 'positive' | 'deduction' | 'neutral';
  sub?: string;
}

function SalaryRow({ label, amount, type = 'neutral', sub }: SalaryRowProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-1.5 last:border-0">
      <div>
        <span className="font-body text-sm text-ink-muted">{label}</span>
        {sub && <span className="ml-2 font-body text-xs text-ink-faint">{sub}</span>}
      </div>
      <span
        className={`font-mono text-sm font-medium ${
          type === 'positive'
            ? 'text-success'
            : type === 'deduction'
              ? 'text-danger'
              : 'text-ink'
        }`}
      >
        {type === 'deduction' ? '− ' : ''}
        {fmtKz(amount)}
      </span>
    </div>
  );
}

export function PayslipAmountBreakdown({ payslip: data }: PayslipAmountBreakdownProps) {
  const irtSub =
    data.irtBracketRate !== null
      ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%`
      : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Remunerações
          </div>
          <SalaryRow label="Salário base" amount={data.baseSalary} />
          {data.mealAllowance > 0 && (
            <SalaryRow label="Subsídio de alimentação" amount={data.mealAllowance} type="positive" />
          )}
          {data.vacationAllowance > 0 && (
            <SalaryRow label="Subsídio de férias" amount={data.vacationAllowance} type="positive" />
          )}
          {data.christmasAllowance > 0 && (
            <SalaryRow label="Subsídio de Natal" amount={data.christmasAllowance} type="positive" />
          )}
          {data.overtime > 0 && (
            <SalaryRow label="Horas extras" amount={data.overtime} type="positive" />
          )}
          {data.bonuses > 0 && (
            <SalaryRow label="Prémios / Comissões" amount={data.bonuses} type="positive" />
          )}
          {data.otherAllowances > 0 && (
            <SalaryRow label="Outros subsídios" amount={data.otherAllowances} type="positive" />
          )}
          <div className="mt-1 flex items-baseline justify-between py-2">
            <span className="font-body text-sm font-medium text-ink">Total bruto</span>
            <span className="font-mono text-sm font-semibold text-ink">
              {fmtKz(data.grossSalary)}
            </span>
          </div>
        </div>
        <div>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Deduções
          </div>
          <SalaryRow label="IRT" amount={data.incomeTax} type="deduction" sub={irtSub} />
          <SalaryRow label="INSS colaborador (3%)" amount={data.socialSecurity} type="deduction" />
          {data.healthInsurance > 0 && (
            <SalaryRow label="Seguro de saúde" amount={data.healthInsurance} type="deduction" />
          )}
          {data.loanDeduction > 0 && (
            <SalaryRow label="Dedução empréstimo" amount={data.loanDeduction} type="deduction" />
          )}
          {data.advanceDeduction > 0 && (
            <SalaryRow label="Adiantamento salarial" amount={data.advanceDeduction} type="deduction" />
          )}
          {data.otherDeductions > 0 && (
            <SalaryRow label="Outras deduções" amount={data.otherDeductions} type="deduction" />
          )}
          <div className="mt-1 flex items-baseline justify-between py-2">
            <span className="font-body text-sm font-medium text-ink">Total deduções</span>
            <span className="font-mono text-sm font-semibold text-danger">
              − {fmtKz(data.totalDeductions)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-card bg-primary-subtle px-5 py-4">
        <div>
          <div className="font-body text-sm font-semibold text-ink">Salário líquido</div>
          <div className="mt-0.5 font-body text-xs text-ink-muted">
            INSS empregador (informativo): {fmtKz(data.employerInss)}
            &nbsp;·&nbsp; Encargo total empresa: {fmtKz(data.grossSalary + data.employerInss)}
          </div>
        </div>
        <div className="font-mono text-2xl font-bold text-primary">{fmtKz(data.netSalary)}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewire `PayslipDetailView`**

In `components/payslips/PayslipDetailView.tsx`: remove the local `SalaryRow` definition and the two JSX blocks it replaces (the "Remunerações + Deduções" grid and the "Resumo final" `bg-primary-subtle` block), and in their place render:

```tsx
import { PayslipAmountBreakdown } from './PayslipAmountBreakdown';
// ...
<PayslipAmountBreakdown payslip={data} />
```

Keep everything else (header, colaborador/dados fiscais grid, `irtFormula` warning box, actions, dispute modal) unchanged.

- [ ] **Step 5: Run both test files to verify they pass**

Run: `npx vitest run components/payslips/PayslipAmountBreakdown.test.tsx components/payslips/PayslipDetailView.test.tsx`
Expected: both PASS. If `PayslipDetailView.test.tsx` asserts on removed inline structure, adjust the assertion to target the same visible text now rendered by `PayslipAmountBreakdown` (do not change the component's output).

- [ ] **Step 6: Commit**

```bash
git add components/payslips/PayslipAmountBreakdown.tsx components/payslips/PayslipAmountBreakdown.test.tsx components/payslips/PayslipDetailView.tsx
git commit -m "$(printf 'refactor(payslips): extract PayslipAmountBreakdown for admin reuse\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 6: `PayslipListView`

**Files:**
- Create: `components/payroll/PayslipListView.tsx`
- Test: `components/payroll/PayslipListView.test.tsx`

**Interfaces:**
- Consumes: `queryKeys.payslips.adminList`, `Paginated<Payslip>`, `PAYSLIP_STATUS_MAP`, `formatKz`, `formatDate`, `fmtPeriod`, `apiClient.patch`, `useConfirm`, `useToast`.
- Produces: `PayslipListView({ onSelect, onCreate }: { onSelect: (id: number) => void; onCreate: () => void })`. `onCreate` opens the create modal owned by `page.tsx` (Task 14) — this component does not own `CreatePayslipModal`.

- [ ] **Step 1: Write the failing test**

Create `components/payroll/PayslipListView.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const useApiQuery = vi.fn();
const patch = vi.fn().mockResolvedValue({ id: 1, status: 'ISSUED' });
const confirm = vi.fn().mockResolvedValue(true);
const notify = vi.fn();

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then((d) => opts?.onSuccess?.(d, v), (e) => opts?.onError?.(e)),
    isPending: false,
  }),
}));
vi.mock('@/lib/apiClient', () => ({ apiClient: { patch: (...a: unknown[]) => patch(...a) } }));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

import { PayslipListView } from './PayslipListView';

const row = {
  id: 1, receiptCode: 'REC-1', period: '2026-06', paymentDate: '2026-06-25',
  grossSalary: 250000, netSalary: 180000, status: 'DRAFT',
  user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
};
const page = { data: [row], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };

beforeEach(() => {
  useApiQuery.mockReset();
  patch.mockClear(); confirm.mockClear(); notify.mockClear();
});

describe('PayslipListView', () => {
  test('shows skeleton while loading', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  test('shows an error message, not the empty state, when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.queryByText(/Sem recibos/i)).not.toBeInTheDocument();
  });

  test('shows empty state when there are no rows', () => {
    useApiQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false, error: null,
    });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText(/Sem recibos/i)).toBeInTheDocument();
  });

  test('renders a row and calls onSelect on click', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    const onSelect = vi.fn();
    render(<PayslipListView onSelect={onSelect} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('status filter change refetches with the chosen status', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ISSUED' } });
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(lastCall[2].params).toMatchObject({ status: 'ISSUED' });
  });

  test('"Emitir" appears only on DRAFT rows and runs confirm + mutation', async () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Emitir' }));
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/payslips/1/issue'));
  });

  test('no "Emitir" button when the row is already ISSUED', () => {
    useApiQuery.mockReturnValue({
      data: { ...page, data: [{ ...row, status: 'ISSUED' }] },
      isLoading: false, error: null,
    });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Emitir' })).not.toBeInTheDocument();
  });
});
```

> Note: the `Select` component renders a native `<select>` (`role="combobox"`); if it renders a custom listbox instead, adapt the "status filter" test to click the option. Check `components/ui/Select.tsx` before implementing.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/PayslipListView.test.tsx`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

Create `components/payroll/PayslipListView.tsx`. Model: `components/payroll/RunListView.tsx`. Row shape here is `Payslip & { user: {...} }` (from `GET /payslips`), typed as `Paginated<AdminPayslipRow>` where:

```tsx
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { fmtPeriod } from '@/components/payslips/format';
import { PAYSLIP_STATUS_MAP, type PayslipStatus } from '@/components/payslips/types';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Eye } from 'lucide-react';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Paginated } from './types';

export interface AdminPayslipRow {
  id: number;
  receiptCode: string | null;
  period: string;
  paymentDate: string | null;
  grossSalary: number;
  netSalary: number;
  status: PayslipStatus;
  user: { id: number; fullName: string; employeeNumber: string | null } | null;
}

export interface PayslipListViewProps {
  onSelect: (id: number) => void;
  onCreate: () => void;
}

const STATUS_ITEMS = [
  { value: 'all', label: 'Todos os estados' },
  { value: 'DRAFT', label: PAYSLIP_STATUS_MAP.DRAFT.label },
  { value: 'ISSUED', label: PAYSLIP_STATUS_MAP.ISSUED.label },
  { value: 'ACKNOWLEDGED', label: PAYSLIP_STATUS_MAP.ACKNOWLEDGED.label },
  { value: 'DISPUTED', label: PAYSLIP_STATUS_MAP.DISPUTED.label },
];

const COLS = 'grid grid-cols-[1.4fr_110px_120px_130px_130px_120px_120px] gap-3';

export function PayslipListView({ onSelect, onCreate }: PayslipListViewProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status !== 'all') params.status = status;
  if (period.trim()) params.period = period.trim();
  if (year.trim() && !period.trim()) params.year = year.trim();

  const { data, isLoading, error } = useApiQuery<Paginated<AdminPayslipRow>>(
    queryKeys.payslips.adminList(params),
    '/payslips',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const issue = useApiMutation(
    (id: number) => apiClient.patch(`/payslips/${id}/issue`),
    {
      invalidateKeys: [
        [...queryKeys.payslips.all, 'admin-list'],
        [...queryKeys.payslips.all, 'admin-detail'],
        [...queryKeys.payslips.all, 'dashboard'],
      ],
      onSuccess: () => notify({ title: 'Recibo emitido', intent: 'success' }),
      onError: (e: Error) => notify({ title: e.message, intent: 'error' }),
    },
  );

  const handleIssue = async (r: AdminPayslipRow) => {
    const ok = await confirm({
      title: 'Emitir recibo?',
      message: 'O colaborador é notificado e passa a poder ver o recibo.',
      confirmLabel: 'Emitir',
    });
    if (ok) issue.mutate(r.id);
  };

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1); }}
          className="w-48"
        />
        <Input
          value={period}
          onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
          placeholder="Período (AAAA-MM)"
          className="w-40"
        />
        <Input
          value={year}
          onChange={(e) => { setYear(e.target.value); setPage(1); }}
          placeholder="Ano (AAAA)"
          className="w-32"
        />
        <Button className="ml-auto" onClick={onCreate}>+ Novo recibo</Button>
      </div>

      {isLoading && <Skeleton rows={8} wrapperClassName="space-y-2 animate-pulse" itemClassName="h-12 rounded-card bg-surface-sunken" />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState title="Sem recibos" description="Nenhum recibo corresponde aos filtros." />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}>
              <div>Colaborador</div><div>Período</div><div>Pagamento</div>
              <div>Bruto</div><div>Líquido</div><div>Estado</div><div>Acções</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className={`${COLS} cursor-pointer items-center border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken`}
                onClick={() => onSelect(r.id)}
              >
                <div className="min-w-0">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {r.user?.fullName ?? '—'}
                  </div>
                  <div className="truncate font-mono text-xs text-ink-faint">
                    {r.user?.employeeNumber ?? '—'}
                  </div>
                </div>
                <div className="font-body text-sm text-ink-muted">{fmtPeriod(r.period)}</div>
                <div className="font-body text-sm text-ink-muted">{fmtDate(r.paymentDate)}</div>
                <div className="font-mono text-sm text-ink-muted">{fmtKz(r.grossSalary)}</div>
                <div className="font-mono text-sm font-semibold text-ink">{fmtKz(r.netSalary)}</div>
                <div><StatusBadge value={r.status} map={PAYSLIP_STATUS_MAP} variant="dot" /></div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <IconButton icon={Eye} label="Ver detalhe" intent="ghost" size="sm" onClick={() => onSelect(r.id)} />
                  {r.status === 'DRAFT' && (
                    <Button size="sm" intent="secondary" onClick={() => handleIssue(r)}>
                      Emitir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/PayslipListView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/PayslipListView.tsx components/payroll/PayslipListView.test.tsx
git commit -m "$(printf 'feat(payslips): admin PayslipListView (list-all + filters + issue)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 7: `CreatePayslipModal`

**Files:**
- Create: `components/payroll/CreatePayslipModal.tsx`
- Test: `components/payroll/CreatePayslipModal.test.tsx`

**Interfaces:**
- Consumes: `useDirectoryUsers` (from `@/components/payslips/compensationData`), `apiClient.post`, `Modal`/`ModalContent`, `FormField`, `Input`, `Textarea`, `Button`, `useToast`, `queryKeys`.
- Produces: `CreatePayslipModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void })`. Posts `POST /payslips`; on 409 shows a toast; on success calls `onCreated(created.id)`.

- [ ] **Step 1: Write the failing test**

Create `components/payroll/CreatePayslipModal.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 42 });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({ apiClient: { post: (...a: unknown[]) => post(...a) } }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then((d) => opts?.onSuccess?.(d, v), (e) => opts?.onError?.(e)),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => <div><h2>{title}</h2>{children}</div>,
}));
vi.mock('@/components/payslips/compensationData', () => ({
  useDirectoryUsers: () => ({
    users: [{ id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' }],
    loading: false,
  }),
}));

import { CreatePayslipModal } from './CreatePayslipModal';

beforeEach(() => { post.mockClear(); notify.mockClear(); });

describe('CreatePayslipModal', () => {
  test('submit is disabled until employee, period, payment date and base salary are set', () => {
    render(<CreatePayslipModal onClose={vi.fn()} onCreated={vi.fn()} />);
    const submit = screen.getByRole('button', { name: 'Criar recibo' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Pesquisar colaborador/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByText('Ana Silva'));
    fireEvent.change(screen.getByLabelText(/Período/i), { target: { value: '2026-06' } });
    fireEvent.change(screen.getByLabelText(/Data de pagamento/i), { target: { value: '2026-06-25' } });
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '250000' } });
    expect(submit).toBeEnabled();
  });

  test('sends only filled fields; blank advanced fields are omitted', async () => {
    const onCreated = vi.fn();
    render(<CreatePayslipModal onClose={vi.fn()} onCreated={onCreated} />);
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar colaborador/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByText('Ana Silva'));
    fireEvent.change(screen.getByLabelText(/Período/i), { target: { value: '2026-06' } });
    fireEvent.change(screen.getByLabelText(/Data de pagamento/i), { target: { value: '2026-06-25' } });
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '250000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar recibo' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/payslips');
    expect(body).toEqual({
      userId: 7, period: '2026-06', paymentDate: '2026-06-25', baseSalary: 250000,
    });
    expect(onCreated).toHaveBeenCalledWith(42);
  });

  test('409 shows an error toast', async () => {
    post.mockRejectedValueOnce(Object.assign(new Error('Recibo já existe'), { status: 409 }));
    render(<CreatePayslipModal onClose={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar colaborador/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByText('Ana Silva'));
    fireEvent.change(screen.getByLabelText(/Período/i), { target: { value: '2026-06' } });
    fireEvent.change(screen.getByLabelText(/Data de pagamento/i), { target: { value: '2026-06-25' } });
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '250000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar recibo' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'error' })));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/CreatePayslipModal.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

Create `components/payroll/CreatePayslipModal.tsx`. Model: `CreateRunModal.tsx` + the employee-picker block from `components/payslips/CompensationFormModal.tsx` (mode "create sem userId"). Advanced numeric fields live behind a "Mostrar campos avançados" toggle.

```tsx
'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useDirectoryUsers } from '@/components/payslips/compensationData';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface CreatePayslipModalProps {
  onClose: () => void;
  onCreated: (id: number) => void;
}

const EARNINGS = [
  ['mealAllowance', 'Subsídio de alimentação'],
  ['vacationAllowance', 'Subsídio de férias'],
  ['christmasAllowance', 'Subsídio de Natal'],
  ['overtime', 'Horas extras'],
  ['bonuses', 'Prémios / Comissões'],
  ['otherAllowances', 'Outros subsídios'],
] as const;

const DEDUCTIONS = [
  ['irtOverride', 'IRT (manual)'],
  ['inssOverride', 'INSS colaborador (manual)'],
  ['healthInsurance', 'Seguro de saúde'],
  ['loanDeduction', 'Dedução empréstimo'],
  ['advanceDeduction', 'Adiantamento salarial'],
  ['otherDeductions', 'Outras deduções'],
] as const;

type NumKey = (typeof EARNINGS)[number][0] | (typeof DEDUCTIONS)[number][0];

export function CreatePayslipModal({ onClose, onCreated }: CreatePayslipModalProps) {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<{ id: number; fullName: string } | null>(null);
  const [period, setPeriod] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [nums, setNums] = useState<Partial<Record<NumKey, string>>>({});

  const { users, loading } = useDirectoryUsers(search, '', !picked && search.trim().length > 0);

  const create = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post<{ id: number }>('/payslips', body),
    {
      invalidateKeys: [[...queryKeys.payslips.all, 'admin-list']],
      onSuccess: (created) => {
        notify({ title: 'Recibo criado', intent: 'success' });
        onCreated(created.id);
      },
      onError: (e: Error) =>
        notify({
          title:
            (e as { status?: number }).status === 409
              ? 'Recibo desse período já existe para este colaborador'
              : e.message,
          intent: 'error',
        }),
    },
  );

  const valid = !!picked && period.trim() !== '' && paymentDate !== '' && baseSalary.trim() !== '';

  const handleSubmit = () => {
    if (!valid || create.isPending) return;
    const body: Record<string, unknown> = {
      userId: picked!.id,
      period: period.trim(),
      paymentDate,
      baseSalary: Number(baseSalary),
    };
    for (const [key] of [...EARNINGS, ...DEDUCTIONS]) {
      const raw = nums[key];
      if (raw !== undefined && raw !== '') body[key] = Number(raw);
    }
    if (notes.trim()) body.notes = notes.trim();
    create.mutate(body);
  };

  const setNum = (k: NumKey, v: string) => setNums((s) => ({ ...s, [k]: v }));

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title="Novo recibo" className="max-w-lg">
        <div className="mt-5 space-y-4">
          <FormField label="Colaborador *" htmlFor="cpm-user">
            {picked ? (
              <div className="flex items-center gap-2">
                <span className="font-body text-sm text-ink">{picked.fullName}</span>
                <button
                  type="button"
                  className="font-body text-xs text-primary hover:underline"
                  onClick={() => { setPicked(null); setSearch(''); }}
                >
                  alterar
                </button>
              </div>
            ) : (
              <>
                <Input
                  id="cpm-user"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar colaborador…"
                  className="w-full"
                />
                {search.trim().length > 0 && (
                  <div className="mt-1 max-h-40 overflow-auto rounded-control border border-border">
                    {loading && <div className="px-3 py-2 font-body text-xs text-ink-faint">A pesquisar…</div>}
                    {!loading && users.length === 0 && (
                      <div className="px-3 py-2 font-body text-xs text-ink-faint">Sem resultados</div>
                    )}
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left font-body text-sm hover:bg-surface-sunken"
                        onClick={() => setPicked({ id: u.id, fullName: u.fullName })}
                      >
                        {u.fullName}
                        <span className="ml-2 font-mono text-xs text-ink-faint">{u.employeeNumber ?? ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </FormField>

          <FormField label="Período *" htmlFor="cpm-period" hint="Formato AAAA-MM">
            <Input id="cpm-period" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-06" className="w-full" />
          </FormField>
          <FormField label="Data de pagamento *" htmlFor="cpm-pay">
            <Input id="cpm-pay" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full" />
          </FormField>
          <FormField label="Salário base *" htmlFor="cpm-base">
            <Input id="cpm-base" type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="w-full" />
          </FormField>

          <button
            type="button"
            className="font-body text-sm text-primary hover:underline"
            onClick={() => setAdvanced((a) => !a)}
          >
            {advanced ? 'Ocultar campos avançados' : 'Mostrar campos avançados'}
          </button>

          {advanced && (
            <div className="grid grid-cols-2 gap-3">
              {[...EARNINGS, ...DEDUCTIONS].map(([key, label]) => (
                <FormField key={key} label={label} htmlFor={`cpm-${key}`}>
                  <Input
                    id={`cpm-${key}`}
                    type="number"
                    value={nums[key] ?? ''}
                    onChange={(e) => setNum(key, e.target.value)}
                    className="w-full"
                  />
                </FormField>
              ))}
              <div className="col-span-2">
                <FormField label="Notas internas" htmlFor="cpm-notes">
                  <Textarea id="cpm-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full" />
                </FormField>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={create.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!valid} loading={create.isPending}>
            Criar recibo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
```

> Before implementing, open `components/payslips/CompensationFormModal.tsx` and match its `useDirectoryUsers` call signature and the exact `DirectoryUser` fields available.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/CreatePayslipModal.test.tsx`
Expected: PASS. If the picker markup makes `getByText('Ana Silva')` ambiguous, tighten the test selector to the option button.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/CreatePayslipModal.tsx components/payroll/CreatePayslipModal.test.tsx
git commit -m "$(printf 'feat(payslips): CreatePayslipModal (individual payslip, employee picker)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 8: `EditPayslipModal`

**Files:**
- Create: `components/payroll/EditPayslipModal.tsx`
- Test: `components/payroll/EditPayslipModal.test.tsx`

**Interfaces:**
- Consumes: `apiClient.put`, `Modal`/`ModalContent`, `FormField`, `Input`, `Textarea`, `Button`, `useToast`, `queryKeys`, `AdminPayslip` type.
- Produces: `EditPayslipModal({ payslip, onClose }: { payslip: AdminPayslip; onClose: () => void })`. `PUT /payslips/:id`; pre-filled; DRAFT-reversion warning banner.

- [ ] **Step 1: Write the failing test**

Create `components/payroll/EditPayslipModal.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const put = vi.fn().mockResolvedValue({ id: 3 });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({ apiClient: { put: (...a: unknown[]) => put(...a) } }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then((d) => opts?.onSuccess?.(d, v), (e) => opts?.onError?.(e)),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => <div><h2>{title}</h2>{children}</div>,
}));

import { EditPayslipModal } from './EditPayslipModal';
import type { AdminPayslip } from './types';

const payslip = {
  id: 3, receiptCode: 'REC-3', period: '2026-06', paymentDate: '2026-06-25',
  netSalary: 180000, grossSalary: 250000, baseSalary: 250000,
  mealAllowance: 0, vacationAllowance: 0, christmasAllowance: 0,
  overtime: 0, bonuses: 0, otherAllowances: 0,
  incomeTax: 40000, socialSecurity: 7500, employerInss: 20000,
  healthInsurance: 0, loanDeduction: 0, advanceDeduction: 0, otherDeductions: 0,
  totalDeductions: 70000, irtBracketRate: 0.13, irtFormula: null,
  status: 'DRAFT', issuedAt: null, acknowledgedAt: null, notes: null,
  disputes: [],
} as unknown as AdminPayslip;

beforeEach(() => { put.mockClear(); notify.mockClear(); });

describe('EditPayslipModal', () => {
  test('shows the DRAFT-reversion warning', () => {
    render(<EditPayslipModal payslip={payslip} onClose={vi.fn()} />);
    expect(screen.getByText(/devolve o recibo a Rascunho/i)).toBeInTheDocument();
  });

  test('pre-fills base salary from the payslip', () => {
    render(<EditPayslipModal payslip={payslip} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Salário base/i)).toHaveValue(250000);
  });

  test('PUTs the changed fields to /payslips/:id', async () => {
    const onClose = vi.fn();
    render(<EditPayslipModal payslip={payslip} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '300000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    const [url, body] = put.mock.calls[0];
    expect(url).toBe('/payslips/3');
    expect(body).toMatchObject({ baseSalary: 300000 });
    expect(onClose).toHaveBeenCalled();
  });

  test('403 shows an error toast', async () => {
    put.mockRejectedValueOnce(Object.assign(new Error('Recibo não editável no estado actual'), { status: 403 }));
    render(<EditPayslipModal payslip={payslip} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'error' })));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/EditPayslipModal.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

Create `components/payroll/EditPayslipModal.tsx`. Fields: `paymentDate`, `baseSalary` + the same `EARNINGS`/`DEDUCTIONS` numeric grid as Task 7 + `notes`. Pre-fill every field from `payslip`. On submit, send `paymentDate`, `baseSalary: Number(...)`, each numeric field that is non-empty (send `0` explicitly if the user set `0`), and `notes`. Body always includes `baseSalary` and `paymentDate` (required by `CreatePayslipDto` shape, though `UpdatePayslipDto` is partial — sending the current values is fine and keeps the recalculation correct).

```tsx
'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import type { AdminPayslip } from './types';

export interface EditPayslipModalProps {
  payslip: AdminPayslip;
  onClose: () => void;
}

const NUM_FIELDS = [
  ['baseSalary', 'Salário base'],
  ['mealAllowance', 'Subsídio de alimentação'],
  ['vacationAllowance', 'Subsídio de férias'],
  ['christmasAllowance', 'Subsídio de Natal'],
  ['overtime', 'Horas extras'],
  ['bonuses', 'Prémios / Comissões'],
  ['otherAllowances', 'Outros subsídios'],
  ['healthInsurance', 'Seguro de saúde'],
  ['loanDeduction', 'Dedução empréstimo'],
  ['advanceDeduction', 'Adiantamento salarial'],
  ['otherDeductions', 'Outras deduções'],
] as const;

type NumKey = (typeof NUM_FIELDS)[number][0];

export function EditPayslipModal({ payslip, onClose }: EditPayslipModalProps) {
  const notify = useToast();
  const [paymentDate, setPaymentDate] = useState(payslip.paymentDate ?? '');
  const [notes, setNotes] = useState(payslip.notes ?? '');
  const [nums, setNums] = useState<Record<NumKey, string>>(() => {
    const init = {} as Record<NumKey, string>;
    for (const [k] of NUM_FIELDS) init[k] = String((payslip as Record<string, number>)[k] ?? 0);
    return init;
  });

  const save = useApiMutation(
    (body: Record<string, unknown>) => apiClient.put(`/payslips/${payslip.id}`, body),
    {
      invalidateKeys: [
        queryKeys.payslips.adminDetail(payslip.id),
        [...queryKeys.payslips.all, 'admin-list'],
      ],
      onSuccess: () => {
        notify({ title: 'Recibo actualizado (voltou a Rascunho)', intent: 'success' });
        onClose();
      },
      onError: (e: Error) =>
        notify({
          title:
            (e as { status?: number }).status === 403
              ? 'Recibo não editável no estado actual'
              : e.message,
          intent: 'error',
        }),
    },
  );

  const handleSubmit = () => {
    if (save.isPending) return;
    const body: Record<string, unknown> = { paymentDate };
    for (const [k] of NUM_FIELDS) body[k] = Number(nums[k] || 0);
    if (notes.trim()) body.notes = notes.trim();
    save.mutate(body);
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title={`Editar recibo ${payslip.receiptCode ?? payslip.id}`} className="max-w-lg">
        <div className="mt-4 rounded-control bg-warning-subtle p-3 font-body text-xs text-warning-ink">
          Guardar devolve o recibo a Rascunho e recalcula IRT, INSS e líquido a partir dos valores introduzidos.
        </div>

        <div className="mt-4 space-y-4">
          <FormField label="Data de pagamento" htmlFor="epm-pay">
            <Input id="epm-pay" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            {NUM_FIELDS.map(([key, label]) => (
              <FormField key={key} label={label} htmlFor={`epm-${key}`}>
                <Input
                  id={`epm-${key}`}
                  type="number"
                  value={nums[key]}
                  onChange={(e) => setNums((s) => ({ ...s, [key]: e.target.value }))}
                  className="w-full"
                />
              </FormField>
            ))}
          </div>
          <FormField label="Notas internas" htmlFor="epm-notes">
            <Textarea id="epm-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full" />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={save.isPending}>Guardar</Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/EditPayslipModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/EditPayslipModal.tsx components/payroll/EditPayslipModal.test.tsx
git commit -m "$(printf 'feat(payslips): EditPayslipModal (PUT with DRAFT-reversion warning)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 9: `AccessLogsPanel`

**Files:**
- Create: `components/payroll/AccessLogsPanel.tsx`
- Test: `components/payroll/AccessLogsPanel.test.tsx`

**Interfaces:**
- Consumes: `useApiQuery`, `queryKeys.payslips.accessLogs`, `formatDate`, `PayslipAccessLog` type.
- Produces: `AccessLogsPanel({ payslipId }: { payslipId: number })`.

- [ ] **Step 1: Write the failing test**

Create `components/payroll/AccessLogsPanel.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: (...a: unknown[]) => useApiQuery(...a) }));

import { AccessLogsPanel } from './AccessLogsPanel';

beforeEach(() => useApiQuery.mockReset());

describe('AccessLogsPanel', () => {
  test('renders rows with viewer name, action label and IP', () => {
    useApiQuery.mockReturnValue({
      data: [
        { id: 1, payslipId: 3, userId: 9, action: 'ADMIN_VIEW', ipAddress: '10.0.0.2',
          accessedAt: '2026-06-26T10:00:00Z', user: { id: 9, fullName: 'RH User' } },
      ],
      isLoading: false, error: null,
    });
    render(<AccessLogsPanel payslipId={3} />);
    expect(screen.getByText('RH User')).toBeInTheDocument();
    expect(screen.getByText(/Visualização \(admin\)/i)).toBeInTheDocument();
    expect(screen.getByText('10.0.0.2')).toBeInTheDocument();
  });

  test('shows an error message, not "sem acessos", when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('nope') });
    render(<AccessLogsPanel payslipId={3} />);
    expect(screen.getByText('nope')).toBeInTheDocument();
    expect(screen.queryByText(/Sem acessos/i)).not.toBeInTheDocument();
  });

  test('shows empty text when there are no logs', () => {
    useApiQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<AccessLogsPanel payslipId={3} />);
    expect(screen.getByText(/Sem acessos registados/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/AccessLogsPanel.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```tsx
'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PayslipAccessLog } from './types';

const ACTION_LABEL: Record<PayslipAccessLog['action'], string> = {
  VIEW: 'Visualização',
  ADMIN_VIEW: 'Visualização (admin)',
  DOWNLOAD: 'Descarga',
};

export interface AccessLogsPanelProps {
  payslipId: number;
}

export function AccessLogsPanel({ payslipId }: AccessLogsPanelProps) {
  const { data, isLoading, error } = useApiQuery<PayslipAccessLog[]>(
    queryKeys.payslips.accessLogs(payslipId),
    `/payslips/${payslipId}/access-logs`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Últimos 50 acessos
      </h3>
      {isLoading && <Skeleton rows={3} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <p className="font-body text-sm text-ink-faint">Sem acessos registados.</p>
      )}
      {!isLoading && !error && (data?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="grid grid-cols-[160px_1fr_140px_180px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Acção</div><div>Quem</div><div>IP</div><div>Quando</div>
          </div>
          {data!.map((log) => (
            <div key={log.id} className="grid grid-cols-[160px_1fr_140px_180px] gap-3 border-b border-border px-4 py-2.5 last:border-0 font-body text-sm">
              <div className="text-ink-muted">{ACTION_LABEL[log.action]}</div>
              <div className="text-ink">{log.user?.fullName ?? `#${log.userId}`}</div>
              <div className="font-mono text-xs text-ink-faint">{log.ipAddress ?? '—'}</div>
              <div className="text-ink-muted">{fmtDate(log.accessedAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/AccessLogsPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/AccessLogsPanel.tsx components/payroll/AccessLogsPanel.test.tsx
git commit -m "$(printf 'feat(payslips): AccessLogsPanel (read-only payslip access log)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 10: `AdminPayslipDetailView`

**Files:**
- Create: `components/payroll/AdminPayslipDetailView.tsx`
- Test: `components/payroll/AdminPayslipDetailView.test.tsx`

**Interfaces:**
- Consumes: `useApiQuery` (`queryKeys.payslips.adminDetail`), `PayslipAmountBreakdown`, `AccessLogsPanel`, `EditPayslipModal`, `ResolveDisputeModal` (Task 12), `useApiMutation` + `apiClient.patch` for issue, `useConfirm`, `useToast`, `StatusBadge` + `PAYSLIP_STATUS_MAP` + `DISPUTE_STATUS_MAP`, `fmtPeriod`, `formatDate`.
- Produces: `AdminPayslipDetailView({ payslipId, onBack }: { payslipId: number; onBack: () => void })`.

- [ ] **Step 1: Write the failing test**

Create `components/payroll/AdminPayslipDetailView.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
  useApiMutation: (fn: any, opts: any) => ({ mutate: (v: unknown) => Promise.resolve(fn(v)).then((d: unknown) => opts?.onSuccess?.(d, v)), isPending: false }),
}));
vi.mock('@/lib/apiClient', () => ({ apiClient: { patch: vi.fn().mockResolvedValue({}) } }));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => vi.fn().mockResolvedValue(true) }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('./AccessLogsPanel', () => ({ AccessLogsPanel: () => <div>access-logs</div> }));
vi.mock('./EditPayslipModal', () => ({ EditPayslipModal: () => <div>edit-modal</div> }));
vi.mock('./ResolveDisputeModal', () => ({ ResolveDisputeModal: () => <div>resolve-modal</div> }));

import { AdminPayslipDetailView } from './AdminPayslipDetailView';

const make = (over: Record<string, unknown> = {}) => ({
  data: {
    id: 3, receiptCode: 'REC-3', period: '2026-06', paymentDate: '2026-06-25',
    netSalary: 180000, grossSalary: 250000, baseSalary: 250000,
    mealAllowance: 0, vacationAllowance: 0, christmasAllowance: 0, overtime: 0, bonuses: 0, otherAllowances: 0,
    incomeTax: 40000, socialSecurity: 7500, employerInss: 20000,
    healthInsurance: 0, loanDeduction: 0, advanceDeduction: 0, otherDeductions: 0,
    totalDeductions: 70000, irtBracketRate: 0.13, irtFormula: null,
    status: 'DRAFT', issuedAt: null, acknowledgedAt: null, notes: null,
    user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
    disputes: [], ...over,
  },
  isLoading: false, error: null,
});

beforeEach(() => useApiQuery.mockReset());

describe('AdminPayslipDetailView', () => {
  test('DRAFT shows Editar and Emitir', () => {
    useApiQuery.mockReturnValue(make());
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Emitir' })).toBeInTheDocument();
  });

  test('ISSUED hides Editar and Emitir', () => {
    useApiQuery.mockReturnValue(make({ status: 'ISSUED' }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Emitir' })).not.toBeInTheDocument();
    expect(screen.getByText(/já não é editável/i)).toBeInTheDocument();
  });

  test('ACKNOWLEDGED hides the actions', () => {
    useApiQuery.mockReturnValue(make({ status: 'ACKNOWLEDGED' }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  test('DISPUTED with an OPEN dispute shows the dispute and a Resolver button', () => {
    useApiQuery.mockReturnValue(make({
      status: 'DISPUTED',
      disputes: [{ id: 11, payslipId: 3, userId: 7, reason: 'IRT errado', details: null,
        status: 'OPEN', createdAt: '2026-06-26T00:00:00Z', resolvedAt: null, resolution: null }],
    }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.getByText('IRT errado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeInTheDocument();
  });

  test('a RESOLVED dispute shows no Resolver button', () => {
    useApiQuery.mockReturnValue(make({
      status: 'DISPUTED',
      disputes: [{ id: 11, payslipId: 3, userId: 7, reason: 'x', details: null,
        status: 'RESOLVED', createdAt: '2026-06-26T00:00:00Z', resolvedAt: '2026-06-27T00:00:00Z', resolution: 'feito' }],
    }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Resolver' })).not.toBeInTheDocument();
  });

  test('renders an error message, not a blank panel, when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('kaboom') });
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/AdminPayslipDetailView.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

Model: `components/payroll/RunDetailView.tsx` (header + status-conditioned action bar) + `components/payslips/PayslipDetailView.tsx` (header layout). Action bar strictly mirrors `assertPayslipEditable` (editable only when `status === 'DRAFT'` and `run?.status !== 'PUBLISHED'`).

```tsx
'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { fmtPeriod } from '@/components/payslips/format';
import { PAYSLIP_STATUS_MAP } from '@/components/payslips/types';
import { PayslipAmountBreakdown } from '@/components/payslips/PayslipAmountBreakdown';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { AccessLogsPanel } from './AccessLogsPanel';
import { EditPayslipModal } from './EditPayslipModal';
import { ResolveDisputeModal } from './ResolveDisputeModal';
import { DISPUTE_STATUS_MAP, type AdminPayslip, type PayslipDispute } from './types';

export interface AdminPayslipDetailViewProps {
  payslipId: number;
  onBack: () => void;
}

const LOCKED_NOTE: Record<string, string> = {
  ISSUED: 'Recibo emitido — já não é editável.',
  ACKNOWLEDGED: 'Recibo confirmado pelo colaborador — já não é editável.',
  DISPUTED: 'Recibo em disputa — já não é editável.',
};

export function AdminPayslipDetailView({ payslipId, onBack }: AdminPayslipDetailViewProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [resolving, setResolving] = useState<PayslipDispute | null>(null);

  const { data, isLoading, error } = useApiQuery<AdminPayslip>(
    queryKeys.payslips.adminDetail(payslipId),
    `/payslips/${payslipId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const issue = useApiMutation(
    () => apiClient.patch(`/payslips/${payslipId}/issue`),
    {
      invalidateKeys: [
        queryKeys.payslips.adminDetail(payslipId),
        [...queryKeys.payslips.all, 'admin-list'],
        [...queryKeys.payslips.all, 'dashboard'],
      ],
      onSuccess: () => notify({ title: 'Recibo emitido', intent: 'success' }),
      onError: (e: Error) => notify({ title: e.message, intent: 'error' }),
    },
  );

  const handleIssue = async () => {
    const ok = await confirm({
      title: 'Emitir recibo?',
      message: 'O colaborador é notificado e passa a poder ver o recibo.',
      confirmLabel: 'Emitir',
    });
    if (ok) issue.mutate(undefined);
  };

  if (isLoading) return <Skeleton rows={8} />;
  if (error) return <div className="font-body text-sm text-danger">{error.message}</div>;
  if (!data) return null;

  const editable = data.status === 'DRAFT' && data.run?.status !== 'PUBLISHED';

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 font-body text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Voltar
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {data.user?.fullName ?? '—'}
          </h2>
          <p className="font-body text-sm text-ink-faint">
            {fmtPeriod(data.period)} · <span className="font-mono">{data.receiptCode ?? data.id}</span>
          </p>
        </div>
        <StatusBadge value={data.status} map={PAYSLIP_STATUS_MAP} variant="dot" />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {editable ? (
          <>
            <Button size="sm" intent="secondary" onClick={() => setEditing(true)}>Editar</Button>
            <Button size="sm" onClick={handleIssue} disabled={issue.isPending}>Emitir</Button>
          </>
        ) : (
          <p className="font-body text-sm text-ink-faint">
            {data.run?.status === 'PUBLISHED'
              ? 'Recibo pertence a um run publicado — já não é editável.'
              : (LOCKED_NOTE[data.status] ?? '')}
          </p>
        )}
      </div>

      <div className="mb-8 rounded-card border border-border bg-surface p-6">
        <PayslipAmountBreakdown payslip={data} />
      </div>

      {data.disputes.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Disputas
          </h3>
          <div className="space-y-3">
            {data.disputes.map((d) => (
              <div key={d.id} className="rounded-card border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-medium text-ink">{d.reason}</span>
                  <StatusBadge value={d.status} map={DISPUTE_STATUS_MAP} variant="plain" />
                </div>
                {d.details && <p className="mt-1 font-body text-sm text-ink-muted">{d.details}</p>}
                <p className="mt-1 font-body text-xs text-ink-faint">Aberta em {fmtDate(d.createdAt)}</p>
                {d.status === 'RESOLVED' && (
                  <p className="mt-1 font-body text-xs text-success-ink">
                    Resolvida em {fmtDate(d.resolvedAt)} — {d.resolution}
                  </p>
                )}
                {d.status === 'OPEN' && (
                  <Button size="sm" intent="secondary" className="mt-3" onClick={() => setResolving(d)}>
                    Resolver
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <AccessLogsPanel payslipId={payslipId} />
      </div>

      {editing && <EditPayslipModal payslip={data} onClose={() => setEditing(false)} />}
      {resolving && (
        <ResolveDisputeModal
          disputeId={resolving.id}
          payslipId={payslipId}
          onClose={() => setResolving(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/AdminPayslipDetailView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/AdminPayslipDetailView.tsx components/payroll/AdminPayslipDetailView.test.tsx
git commit -m "$(printf 'feat(payslips): AdminPayslipDetailView (status-gated actions + disputes + logs)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 11: `HrDashboardView`

**Files:**
- Create: `components/payroll/HrDashboardView.tsx`
- Test: `components/payroll/HrDashboardView.test.tsx`

**Interfaces:**
- Consumes: `useApiQuery` (`queryKeys.payslips.dashboard`), `KpiCard`, `Input`, `Skeleton`, `formatKz`, `HrDashboard` type.
- Produces: `HrDashboardView()` (no props).

- [ ] **Step 1: Write the failing test**

Create `components/payroll/HrDashboardView.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: (...a: unknown[]) => useApiQuery(...a) }));

import { HrDashboardView } from './HrDashboardView';

const dash = {
  period: '2026-06',
  counts: { total: 10, issued: 6, acknowledged: 3, disputed: 1, notViewed: 3, draft: 0 },
  financials: { totalGross: 2500000, totalNet: 1800000, totalIRT: 400000,
    totalINSSEmployee: 75000, totalINSSEmployer: 200000, avgNet: 180000 },
  compliance: { viewRate: '30.0%', pendingAcknowledgement: 3 },
};

beforeEach(() => useApiQuery.mockReset());

describe('HrDashboardView', () => {
  test('renders the three card groups', () => {
    useApiQuery.mockReturnValue({ data: dash, isLoading: false, error: null });
    render(<HrDashboardView />);
    expect(screen.getByText(/Emitidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Líquido total/i)).toBeInTheDocument();
    expect(screen.getByText(/Taxa de confirmação/i)).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();
  });

  test('shows an error message when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('down') });
    render(<HrDashboardView />);
    expect(screen.getByText('down')).toBeInTheDocument();
  });

  test('changing the period refetches with the chosen period', () => {
    useApiQuery.mockReturnValue({ data: dash, isLoading: false, error: null });
    render(<HrDashboardView />);
    fireEvent.change(screen.getByPlaceholderText(/AAAA-MM/i), { target: { value: '2026-05' } });
    const last = useApiQuery.mock.calls.at(-1)!;
    expect(last[2].params).toEqual({ period: '2026-05' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/HrDashboardView.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```tsx
'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { KpiCard } from '@/components/ui/KpiCard';
import type { HrDashboard } from './types';

const thisMonth = () => new Date().toISOString().slice(0, 7);

export function HrDashboardView() {
  const [period, setPeriod] = useState(thisMonth());
  const params = { period };
  const { data, isLoading, error } = useApiQuery<HrDashboard>(
    queryKeys.payslips.dashboard(period),
    '/payslips/dashboard',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Input
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder="Período (AAAA-MM)"
          className="w-44"
        />
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && data && (
        <div className="space-y-8">
          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">Contagens</h3>
            <div className="flex flex-wrap gap-3">
              <KpiCard label="Total" value={data.counts.total} />
              <KpiCard label="Emitidos" value={data.counts.issued} intent="success" />
              <KpiCard label="Confirmados" value={data.counts.acknowledged} intent="info" />
              <KpiCard label="Em disputa" value={data.counts.disputed} intent="danger" />
              <KpiCard label="Por confirmar" value={data.counts.notViewed} intent="warning" />
              <KpiCard label="Rascunhos" value={data.counts.draft} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">Financeiro</h3>
            <div className="flex flex-wrap gap-3">
              <KpiCard label="Bruto total" value={fmtKz(data.financials.totalGross)} />
              <KpiCard label="Líquido total" value={fmtKz(data.financials.totalNet)} intent="success" />
              <KpiCard label="IRT total" value={fmtKz(data.financials.totalIRT)} />
              <KpiCard label="INSS colaborador" value={fmtKz(data.financials.totalINSSEmployee)} />
              <KpiCard label="INSS empregador" value={fmtKz(data.financials.totalINSSEmployer)} />
              <KpiCard label="Líquido médio" value={fmtKz(data.financials.avgNet)} />
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">Compliance</h3>
            <div className="flex flex-wrap gap-3">
              <KpiCard label="Taxa de confirmação" value={data.compliance.viewRate} intent="info" />
              <KpiCard label="Pendentes de confirmação" value={data.compliance.pendingAcknowledgement} intent="warning" />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/HrDashboardView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/HrDashboardView.tsx components/payroll/HrDashboardView.test.tsx
git commit -m "$(printf 'feat(payslips): HrDashboardView (compliance + financial KPIs)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 12: `ResolveDisputeModal`

**Files:**
- Create: `components/payroll/ResolveDisputeModal.tsx`
- Test: `components/payroll/ResolveDisputeModal.test.tsx`

**Interfaces:**
- Consumes: `useApiMutation` + `apiClient.patch`, `Modal`/`ModalContent`, `Textarea`, `Button`, `useToast`, `queryKeys`.
- Produces: `ResolveDisputeModal({ disputeId, payslipId, onClose }: { disputeId: number; payslipId: number; onClose: () => void })`. `PATCH /payslips/disputes/:id/resolve` with `{ resolution, reissue }`.

- [ ] **Step 1: Write the failing test**

Create `components/payroll/ResolveDisputeModal.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const patch = vi.fn().mockResolvedValue({ id: 11, status: 'RESOLVED' });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({ apiClient: { patch: (...a: unknown[]) => patch(...a) } }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then((d) => opts?.onSuccess?.(d, v), (e) => opts?.onError?.(e)),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => <div><h2>{title}</h2>{children}</div>,
}));

import { ResolveDisputeModal } from './ResolveDisputeModal';

beforeEach(() => { patch.mockClear(); notify.mockClear(); });

describe('ResolveDisputeModal', () => {
  test('confirm is disabled until resolution has text', () => {
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Resolver disputa' });
    expect(btn).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'Corrigido' } });
    expect(btn).toBeEnabled();
  });

  test('reissue defaults to false and is only sent when checked', async () => {
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'Corrigido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolver disputa' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0]).toEqual([
      '/payslips/disputes/11/resolve',
      { resolution: 'Corrigido', reissue: false },
    ]);
  });

  test('reissue true is sent when the checkbox is ticked', async () => {
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'Corrigido e reemitido' } });
    fireEvent.click(screen.getByLabelText(/Reemitir recibo/i));
    fireEvent.click(screen.getByRole('button', { name: 'Resolver disputa' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1]).toEqual({ resolution: 'Corrigido e reemitido', reissue: true });
  });

  test('409 shows an error toast', async () => {
    patch.mockRejectedValueOnce(Object.assign(new Error('Disputa já resolvida'), { status: 409 }));
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolver disputa' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'error' })));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/ResolveDisputeModal.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```tsx
'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface ResolveDisputeModalProps {
  disputeId: number;
  payslipId: number;
  onClose: () => void;
}

export function ResolveDisputeModal({ disputeId, payslipId, onClose }: ResolveDisputeModalProps) {
  const notify = useToast();
  const [resolution, setResolution] = useState('');
  const [reissue, setReissue] = useState(false);

  const resolve = useApiMutation(
    (body: { resolution: string; reissue: boolean }) =>
      apiClient.patch(`/payslips/disputes/${disputeId}/resolve`, body),
    {
      invalidateKeys: [
        [...queryKeys.payslips.all, 'disputes'],
        queryKeys.payslips.adminDetail(payslipId),
        [...queryKeys.payslips.all, 'admin-list'],
        [...queryKeys.payslips.all, 'dashboard'],
      ],
      onSuccess: () => {
        notify({ title: 'Disputa resolvida', intent: 'success' });
        onClose();
      },
      onError: (e: Error) =>
        notify({
          title:
            (e as { status?: number }).status === 409 ? 'Disputa já resolvida' : e.message,
          intent: 'error',
        }),
    },
  );

  const handleSubmit = () => {
    if (!resolution.trim() || resolve.isPending) return;
    resolve.mutate({ resolution: resolution.trim(), reissue });
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title="Resolver disputa" className="max-w-md">
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="rdm-resolution" className="mb-1 block font-body text-sm text-ink-muted">
              Resolução *
            </label>
            <Textarea
              id="rdm-resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Descreve o que foi decidido / corrigido…"
            />
          </div>
          <label className="flex items-start gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={reissue}
              onChange={(e) => setReissue(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Reemitir recibo (volta a Emitido)
              <span className="mt-0.5 block font-body text-xs text-ink-faint">
                Marca apenas se a correcção já está feita e o recibo pode sair do estado Disputa.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={resolve.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!resolution.trim()} loading={resolve.isPending}>
            Resolver disputa
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/ResolveDisputeModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/ResolveDisputeModal.tsx components/payroll/ResolveDisputeModal.test.tsx
git commit -m "$(printf 'feat(payslips): ResolveDisputeModal (resolution + opt-in reissue)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 13: `DisputesView`

**Files:**
- Create: `components/payroll/DisputesView.tsx`
- Test: `components/payroll/DisputesView.test.tsx`

**Interfaces:**
- Consumes: `useApiQuery` (`queryKeys.payslips.disputes`), `Paginated<PayslipDispute>`, `DISPUTE_STATUS_MAP`, `ResolveDisputeModal`, `fmtPeriod`, `formatDate`, `Select`, `Pagination`, `StatusBadge`, `EmptyState`, `Skeleton`.
- Produces: `DisputesView({ onOpenPayslip }: { onOpenPayslip: (id: number) => void })`.

- [ ] **Step 1: Write the failing test**

Create `components/payroll/DisputesView.test.tsx`:

```tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: (...a: unknown[]) => useApiQuery(...a) }));
vi.mock('./ResolveDisputeModal', () => ({ ResolveDisputeModal: () => <div>resolve-modal</div> }));

import { DisputesView } from './DisputesView';

const row = {
  id: 11, payslipId: 3, userId: 7, reason: 'IRT errado', details: null,
  status: 'OPEN', createdAt: '2026-06-26T00:00:00Z', resolvedAt: null, resolution: null,
  user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
  payslip: { id: 3, receiptCode: 'REC-3', period: '2026-06', userId: 7, status: 'DISPUTED' },
};
const page = { data: [row], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };

beforeEach(() => useApiQuery.mockReset());

describe('DisputesView', () => {
  test('defaults the status filter to OPEN', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    const last = useApiQuery.mock.calls.at(-1)!;
    expect(last[2].params).toMatchObject({ status: 'OPEN' });
  });

  test('shows an error message, not the empty state, on fetch failure', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('argh') });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    expect(screen.getByText('argh')).toBeInTheDocument();
    expect(screen.queryByText(/Sem disputas/i)).not.toBeInTheDocument();
  });

  test('"Resolver" only shows on OPEN rows', () => {
    useApiQuery.mockReturnValue({
      data: { ...page, data: [{ ...row, status: 'RESOLVED', resolvedAt: '2026-06-27T00:00:00Z', resolution: 'ok' }] },
      isLoading: false, error: null,
    });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Resolver' })).not.toBeInTheDocument();
  });

  test('clicking the receipt calls onOpenPayslip', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    const onOpen = vi.fn();
    render(<DisputesView onOpenPayslip={onOpen} />);
    fireEvent.click(screen.getByText(/REC-3/));
    expect(onOpen).toHaveBeenCalledWith(3);
  });

  test('changing the filter to RESOLVED refetches', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'RESOLVED' } });
    const last = useApiQuery.mock.calls.at(-1)!;
    expect(last[2].params).toMatchObject({ status: 'RESOLVED' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/DisputesView.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement**

```tsx
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { fmtPeriod } from '@/components/payslips/format';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { ResolveDisputeModal } from './ResolveDisputeModal';
import { DISPUTE_STATUS_MAP, type Paginated, type PayslipDispute } from './types';

export interface DisputesViewProps {
  onOpenPayslip: (payslipId: number) => void;
}

const STATUS_ITEMS = [
  { value: 'OPEN', label: 'Abertas' },
  { value: 'RESOLVED', label: 'Resolvidas' },
  { value: 'all', label: 'Todas' },
];

const COLS = 'grid grid-cols-[1.3fr_1.2fr_1.4fr_110px_130px_130px_110px] gap-3';

export function DisputesView({ onOpenPayslip }: DisputesViewProps) {
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState<PayslipDispute | null>(null);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status !== 'all') params.status = status;

  const { data, isLoading, error } = useApiQuery<Paginated<PayslipDispute>>(
    queryKeys.payslips.disputes(params),
    '/payslips/disputes',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1); }}
          className="w-44"
        />
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title={status === 'OPEN' ? 'Sem disputas abertas' : 'Sem disputas'}
          description="Nada corresponde a este filtro."
        />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}>
              <div>Colaborador</div><div>Recibo</div><div>Motivo</div>
              <div>Estado</div><div>Aberta em</div><div>Resolvida em</div><div>Acções</div>
            </div>
            {rows.map((d) => (
              <div key={d.id} className={`${COLS} items-center border-b border-border px-4 py-3 last:border-0 font-body text-sm`}>
                <div className="min-w-0 truncate text-ink">{d.user?.fullName ?? `#${d.userId}`}</div>
                <button
                  type="button"
                  className="truncate text-left font-mono text-xs text-primary hover:underline"
                  onClick={() => d.payslip && onOpenPayslip(d.payslip.id)}
                >
                  {d.payslip?.receiptCode ?? `#${d.payslipId}`}
                  {d.payslip ? ` · ${fmtPeriod(d.payslip.period)}` : ''}
                </button>
                <div className="truncate text-ink-muted">{d.reason}</div>
                <div><StatusBadge value={d.status} map={DISPUTE_STATUS_MAP} variant="plain" /></div>
                <div className="text-ink-muted">{fmtDate(d.createdAt)}</div>
                <div className="text-ink-muted">{d.resolvedAt ? fmtDate(d.resolvedAt) : '—'}</div>
                <div>
                  {d.status === 'OPEN' && (
                    <Button size="sm" intent="secondary" onClick={() => setResolving(d)}>Resolver</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {resolving && (
        <ResolveDisputeModal
          disputeId={resolving.id}
          payslipId={resolving.payslipId}
          onClose={() => setResolving(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/DisputesView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/payroll/DisputesView.tsx components/payroll/DisputesView.test.tsx
git commit -m "$(printf 'feat(payslips): DisputesView (list + status filter + resolve)\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
```

---

### Task 14: Wire the tab strip into `/payroll` `page.tsx`

**Files:**
- Modify: `app/(platform)/payroll/page.tsx`
- Test: `app/(platform)/payroll/page.test.tsx` (create)

**Interfaces:**
- Consumes: `RunListView`, `RunDetailView` (existing), `PayslipListView`, `AdminPayslipDetailView`, `CreatePayslipModal`, `HrDashboardView`, `DisputesView`.
- Produces: the full `/payroll` page with 4 tabs.

- [ ] **Step 1: Write the failing test**

Create `app/(platform)/payroll/page.test.tsx`:

```tsx
import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/payroll/RunListView', () => ({ RunListView: () => <div>run-list</div> }));
vi.mock('@/components/payroll/RunDetailView', () => ({ RunDetailView: () => <div>run-detail</div> }));
vi.mock('@/components/payroll/PayslipListView', () => ({
  PayslipListView: ({ onSelect, onCreate }: any) => (
    <div>
      <button onClick={() => onSelect(3)}>open-payslip</button>
      <button onClick={onCreate}>new-payslip</button>
    </div>
  ),
}));
vi.mock('@/components/payroll/AdminPayslipDetailView', () => ({
  AdminPayslipDetailView: () => <div>payslip-detail</div>,
}));
vi.mock('@/components/payroll/CreatePayslipModal', () => ({ CreatePayslipModal: () => <div>create-modal</div> }));
vi.mock('@/components/payroll/HrDashboardView', () => ({ HrDashboardView: () => <div>hr-dashboard</div> }));
vi.mock('@/components/payroll/DisputesView', () => ({ DisputesView: () => <div>disputes-view</div> }));

import PayrollPage from './page';

describe('PayrollPage tabs', () => {
  test('starts on the Runs tab', () => {
    render(<PayrollPage />);
    expect(screen.getByText('run-list')).toBeInTheDocument();
  });

  test('switches to Recibos, Dashboard and Disputas', () => {
    render(<PayrollPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Recibos' }));
    expect(screen.getByText('open-payslip')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dashboard' }));
    expect(screen.getByText('hr-dashboard')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Disputas' }));
    expect(screen.getByText('disputes-view')).toBeInTheDocument();
  });

  test('opening a payslip detail hides the tab strip', () => {
    render(<PayrollPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Recibos' }));
    fireEvent.click(screen.getByText('open-payslip'));
    expect(screen.getByText('payslip-detail')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dashboard' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/(platform)/payroll/page.test.tsx`
Expected: FAIL — `page.tsx` has no tabs.

- [ ] **Step 3: Rewrite `page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RunListView } from '@/components/payroll/RunListView';
import { RunDetailView } from '@/components/payroll/RunDetailView';
import { PayslipListView } from '@/components/payroll/PayslipListView';
import { AdminPayslipDetailView } from '@/components/payroll/AdminPayslipDetailView';
import { CreatePayslipModal } from '@/components/payroll/CreatePayslipModal';
import { HrDashboardView } from '@/components/payroll/HrDashboardView';
import { DisputesView } from '@/components/payroll/DisputesView';

type Nav =
  | { tab: 'runs'; view: 'list' }
  | { tab: 'runs'; view: 'detail'; runId: number }
  | { tab: 'payslips'; view: 'list' }
  | { tab: 'payslips'; view: 'detail'; payslipId: number }
  | { tab: 'dashboard' }
  | { tab: 'disputes' };

const TABS: Array<{ id: Nav['tab']; label: string }> = [
  { id: 'runs', label: 'Runs' },
  { id: 'payslips', label: 'Recibos' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'disputes', label: 'Disputas' },
];

const TITLES: Record<Nav['tab'], string> = {
  runs: 'Folha de Pagamento — Runs',
  payslips: 'Folha de Pagamento — Recibos',
  dashboard: 'Folha de Pagamento — Dashboard RH',
  disputes: 'Folha de Pagamento — Disputas',
};

export default function PayrollPage() {
  const [nav, setNav] = useState<Nav>({ tab: 'runs', view: 'list' });
  const [creating, setCreating] = useState(false);

  const isDetail =
    (nav.tab === 'runs' && nav.view === 'detail') ||
    (nav.tab === 'payslips' && nav.view === 'detail');

  const selectTab = (tab: Nav['tab']) => {
    if (tab === 'runs' || tab === 'payslips') setNav({ tab, view: 'list' });
    else setNav({ tab });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">{TITLES[nav.tab]}</h1>
      </div>

      {!isDetail && (
        <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
          {TABS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              intent={nav.tab === t.id ? 'primary' : 'ghost'}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      )}

      {nav.tab === 'runs' && nav.view === 'list' && (
        <RunListView onSelect={(runId) => setNav({ tab: 'runs', view: 'detail', runId })} />
      )}
      {nav.tab === 'runs' && nav.view === 'detail' && (
        <RunDetailView runId={nav.runId} onBack={() => setNav({ tab: 'runs', view: 'list' })} />
      )}

      {nav.tab === 'payslips' && nav.view === 'list' && (
        <PayslipListView
          onSelect={(payslipId) => setNav({ tab: 'payslips', view: 'detail', payslipId })}
          onCreate={() => setCreating(true)}
        />
      )}
      {nav.tab === 'payslips' && nav.view === 'detail' && (
        <AdminPayslipDetailView
          payslipId={nav.payslipId}
          onBack={() => setNav({ tab: 'payslips', view: 'list' })}
        />
      )}

      {nav.tab === 'dashboard' && <HrDashboardView />}
      {nav.tab === 'disputes' && (
        <DisputesView
          onOpenPayslip={(payslipId) => setNav({ tab: 'payslips', view: 'detail', payslipId })}
        />
      )}

      {creating && (
        <CreatePayslipModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            setNav({ tab: 'payslips', view: 'detail', payslipId: id });
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run "app/(platform)/payroll/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Full verification**

Run: `npm run lint && npx vitest run && npm run build`
Expected: lint clean, all vitest suites pass, build succeeds. Fix any failures before committing.

- [ ] **Step 6: Commit, push, open PR**

```bash
git add "app/(platform)/payroll/page.tsx" "app/(platform)/payroll/page.test.tsx"
git commit -m "$(printf 'feat(payslips): /payroll tab strip — Runs/Recibos/Dashboard/Disputas\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01T7exqDDLf6Fgspn2RHwXPV')"
git push -u origin feat/payslip-admin-management
gh pr create --title "feat(payslips): admin payslip management on /payroll (Sub-project D)" --body "$(printf 'Implements frontend/docs/superpowers/specs/2026-09-03-payslip-admin-management-design.md.\n\nAdds a tab strip to /payroll (Runs · Recibos · Dashboard · Disputas):\n- PayslipListView (list-all + filters + issue) + CreatePayslipModal (employee picker)\n- AdminPayslipDetailView (status-gated Editar/Emitir mirroring assertPayslipEditable) + EditPayslipModal + AccessLogsPanel\n- HrDashboardView (GET /payslips/dashboard KPI groups)\n- DisputesView + ResolveDisputeModal (opt-in reissue) — consumes the backend slice from PR #<backend-pr>\n- PayslipAmountBreakdown extracted from the employee PayslipDetailView so the two cannot drift\n\nDepends on the backend slice already merged to innova main.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)')"
```

- [ ] **Step 7: Wait for CI**

Poll `gh pr checks --watch`. When `build` (`quality.yml`) is green, squash-merge.

- [ ] **Step 8: Update memory**

Edit `C:/Users/PLÁCIDO COSTA/.claude/projects/C--Users-PL-CIDO-COSTA-innova/memory/project_innova_payroll_frontend_rollout.md`: mark sub-project D **DONE** with the two PR numbers, and note the latent bug found (employee `ListView` uses the flat `PaginatedPayslips` shape but `GET /payslips/my` returns `{ data, meta }` — out of scope for D, worth a follow-up). Update `MEMORY.md`'s one-line pointer to say D is done.

---

## Self-Review

**1. Spec coverage:**

| Spec section | Task(s) |
|---|---|
| §1 route & navigation (tab strip, discriminated Nav) | Task 14 |
| §2.1 `GET /payslips/disputes` | Task 1 |
| §2.2 `PATCH /payslips/disputes/:id/resolve` (opt-in reissue) | Task 2 |
| §2.3 `findOne` includes `disputes` | Task 3 |
| §2.4 `getAccessLogs` includes `user` | Task 3 |
| §2.5 DTOs | Tasks 1, 2 |
| §2.6 integration spec | Tasks 1, 2, 3 |
| §3 query keys + invalidation map | Task 4 (keys); Tasks 6/8/10/12 (invalidation per mutation) |
| §4 `PayslipListView` | Task 6 |
| §5 `PayslipAmountBreakdown` + `PayslipDetailView` rewire | Task 5 |
| §6 `AdminPayslipDetailView` (status-gated action bar) | Task 10 |
| §7 `AccessLogsPanel` | Task 9 |
| §8 `CreatePayslipModal` | Task 7 |
| §9 `EditPayslipModal` | Task 8 |
| §10 `HrDashboardView` | Task 11 |
| §11 `DisputesView` + `ResolveDisputeModal` | Tasks 13, 12 |
| §12 types | Task 4 |
| §13 tests | every task's Step 1 |
| §"Fora de âmbito" | nothing built (bulk-create, admin PDF, name search, log pagination, PayslipItem) — correct |
| §"Riscos" — breakdown extraction is a pure lift | Task 5 Step 4-5 (existing test must stay green) |
| §"Riscos" — action bar vs `assertPayslipEditable` | Task 10 tests every status |
| §"Riscos" — route order `disputes` before `:id` | Task 1 Step 5 + test fails first if misordered |
| §"Riscos" — `invalidateKeys` by prefix | Tasks use bare `[...all, 'admin-list']` prefixes, matching the C convention |
| §"Riscos" — merge order | Global Constraints + Task 3 Step 7 gate |

No gaps.

**2. Placeholder scan:** No "TBD"/"handle edge cases"/"similar to Task N" — every code step has full code. Two "before implementing, check X" notes (Task 1 dispute `user` relation; Task 6/7 `Select` markup and `useDirectoryUsers` signature) are explicit verification instructions with a defined fallback, not placeholders.

**3. Type consistency:**
- `queryKeys.payslips.adminDetail(id)` used verbatim in Tasks 4, 8, 10, 12. ✓
- Prefix invalidation arrays `[...queryKeys.payslips.all, 'admin-list' | 'dashboard' | 'disputes' | 'admin-detail']` consistent across Tasks 6, 8, 10, 12. ✓
- `AdminPayslip` (Task 4) = `Payslip & { disputes; run? }` — consumed in Tasks 8, 10. `EditPayslipModal` reads `(payslip as Record<string, number>)[k]` for numeric fields — safe because `Payslip` declares all of them as `number`. ✓
- `PayslipDispute` shape (Task 4) — consumed in Tasks 10, 12, 13 with fields `id`, `payslipId`, `status`, `reason`, `details`, `createdAt`, `resolvedAt`, `resolution`, `user?`, `payslip?`. ✓
- `ResolveDisputeModal` props `{ disputeId, payslipId, onClose }` — defined Task 12, called identically in Tasks 10 and 13. ✓
- `PayslipListView` props `{ onSelect, onCreate }` — defined Task 6, called in Task 14. `CreatePayslipModal` is owned by `page.tsx`, not the list — consistent between Task 6 (no modal import) and Task 14. ✓
- `AccessLogsPanel` props `{ payslipId }` — Task 9, called in Task 10. ✓
- Backend `resolveDispute(id, dto)` / `listDisputes(filters)` names — Tasks 1, 2 service + controller match. ✓

Plan is internally consistent.

---

## Execution Handoff

**Plan complete and saved to `frontend/docs/superpowers/plans/2026-09-03-payslip-admin-management.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
