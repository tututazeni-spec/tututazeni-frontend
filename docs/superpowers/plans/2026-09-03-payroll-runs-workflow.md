# Payroll — Workflow de Runs (frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the RH-facing UI for the `PayrollRun` workflow (`/payroll`) — create a run, process/simulate it, review exceptions, recalculate or exclude individual payslips, submit → approve/reject → publish/cancel — against the API already live in `innova` (`@Controller('payroll/runs')`, PRs #230/#231).

**Architecture:** A new route `app/(platform)/payroll/` with a local `list ⇄ detail` nav (same shape as `app/(platform)/payslips/page.tsx`, no `Tabs`). Six new components under `components/payroll/` follow the exact patterns already in `components/payslips/` (`CompensationsView`/`CompensationDetailView` for list→detail, `PlanDetailModal`'s inline reason panel for reject/cancel). All data access goes through the existing `useApiQuery`/`useApiMutation` wrappers and a new `queryKeys.payroll.*` block.

**Tech Stack:** Next.js (App Router) · React · TypeScript · `@tanstack/react-query` v5 · `components/ui/*` design-system primitives · Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-03-payroll-runs-frontend-design.md`

## Global Constraints

- No client-side role guard on the page — the Sidebar filters by `roles: ADMIN_ROLES` (`= ['ADMIN', 'RH']`, `lib/roles.ts:40`) and the backend already enforces `@Roles(ADMIN, RH)` on every route (precedent: `app/(platform)/roles-permissions/page.tsx` has no guard either).
- No selector for `departmentIds`/`userIds` in the create-run form (spec decision #2) — only `period`, `payGroup`, `countryCode`, `notes`.
- Reuse `formatKz`/`formatDate`/`formatDateTime` from `lib/format.ts` and `PAYSLIP_STATUS_MAP`/`PayslipStatus` from `components/payslips/types.ts` — do not redefine them in `components/payroll/`.
- Every mutation that changes run state (`process`/`submit`/`approve`/`reject`/`publish`/`cancel`) must only be offered when the backend's `assertTransition`/`assertRunEditable` would accept it (spec §5 table) — this is the plan's main correctness risk, and Task 7's tests assert it state-by-state.
- Money values are already plain JS `number` (Float) from the API — no Decimal/string parsing.

---

## File Structure

```
lib/queryKeys.ts                                   — MODIFY: add `payroll` block
components/Sidebar.tsx                              — MODIFY: add `/payroll` nav entry

components/payroll/
  types.ts                    — PayrollRun/PayrollRunDetail/RunException/RunPayslip types + status maps
  types.test.ts               — status maps cover every backend enum value
  CreateRunModal.tsx          — POST /payroll/runs form
  CreateRunModal.test.tsx
  RunListView.tsx             — GET /payroll/runs, paginated table + filters + "+ Novo run"
  RunListView.test.tsx
  RecalcPayslipModal.tsx      — PATCH .../payslips/:id/recalc form
  RecalcPayslipModal.test.tsx
  RunPayslipsTable.tsx        — GET /payroll/runs/:id/payslips, paginated, per-row recalc/exclude
  RunPayslipsTable.test.tsx
  ExceptionsPanel.tsx         — GET /payroll/runs/:id/exceptions, grouped by severity
  ExceptionsPanel.test.tsx
  RunDetailView.tsx           — GET /payroll/runs/:id, state machine actions + timeline, composes the above
  RunDetailView.test.tsx

app/(platform)/payroll/
  layout.tsx                  — page <title>
  page.tsx                    — local nav wiring RunListView ⇄ RunDetailView
```

---

### Task 1: Types, status maps, and query keys

**Files:**
- Create: `components/payroll/types.ts`
- Test: `components/payroll/types.test.ts`
- Modify: `lib/queryKeys.ts`

**Interfaces:**
- Produces: `RunStatus`, `PayrollRun`, `PayrollRunDetail`, `TimelineStep`, `RunException`, `RunPayslip`, `RunPayslipItem`, `Paginated<T>`, `RUN_STATUS_MAP`, `EXCEPTION_SEVERITY_MAP`, `EXCEPTION_CODE_LABEL` — every later task imports these from `@/components/payroll/types`.
- Produces: `queryKeys.payroll.{all, runList, runDetail, runPayslipsAll, runPayslips, runExceptions}` — every later task imports these from `@/lib/queryKeys`.

- [ ] **Step 1: Write the failing test**

```ts
// components/payroll/types.test.ts
import { describe, expect, test } from 'vitest';
import {
  RUN_STATUS_MAP,
  EXCEPTION_SEVERITY_MAP,
  EXCEPTION_CODE_LABEL,
} from './types';

// Mirrors prisma/schema.prisma enum PayrollRunStatus exactly (innova repo) —
// including CALCULATED, which no service sets but the type must still cover.
const ALL_RUN_STATUSES = [
  'DRAFT',
  'PROCESSING',
  'SIMULATED',
  'PENDING_APPROVAL',
  'CALCULATED',
  'APPROVED',
  'PUBLISHED',
  'CANCELLED',
] as const;

// Mirrors the 8 codes in src/payslips/payroll-calculation.service.ts (innova repo).
const ALL_EXCEPTION_CODES = [
  'NO_COMPENSATION',
  'ZERO_BASE_SALARY',
  'NEGATIVE_NET',
  'DUPLICATE_PAYSLIP_FOR_PERIOD',
  'NET_BELOW_MINIMUM_WAGE',
  'MISSING_BANK_DETAILS',
  'HIGH_VARIANCE_VS_PREV_MONTH',
  'USING_FALLBACK_TAX_CONFIG',
] as const;

describe('payroll status maps', () => {
  test('RUN_STATUS_MAP has a label for every PayrollRunStatus value', () => {
    for (const s of ALL_RUN_STATUSES) {
      expect(RUN_STATUS_MAP[s]).toBeDefined();
      expect(RUN_STATUS_MAP[s].label.length).toBeGreaterThan(0);
    }
  });

  test('EXCEPTION_SEVERITY_MAP has ERROR and WARNING', () => {
    expect(EXCEPTION_SEVERITY_MAP.ERROR).toBeDefined();
    expect(EXCEPTION_SEVERITY_MAP.WARNING).toBeDefined();
  });

  test('EXCEPTION_CODE_LABEL covers every known exception code', () => {
    for (const c of ALL_EXCEPTION_CODES) {
      expect(EXCEPTION_CODE_LABEL[c]).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/types.test.ts`
Expected: FAIL — `Cannot find module './types'` (the file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// components/payroll/types.ts
// Tipos e mapas de estado partilhados pelas vistas do workflow de runs
// (RunListView, RunDetailView, RunPayslipsTable, ExceptionsPanel,
// CreateRunModal, RecalcPayslipModal). Espelha o schema real de
// PayrollRun/Payslip do backend (innova, prisma/schema.prisma) — ver
// docs/superpowers/specs/2026-09-03-payroll-runs-frontend-design.md.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { PayslipStatus } from '@/components/payslips/types';

export type RunStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'SIMULATED'
  | 'PENDING_APPROVAL'
  | 'CALCULATED' // legado — nenhum serviço o define, mantido no enum do backend
  | 'APPROVED'
  | 'PUBLISHED'
  | 'CANCELLED';

export interface PayrollRun {
  id: number;
  period: string;
  countryCode: string;
  status: RunStatus;
  notes: string | null;
  payGroup: string | null;
  taxYear: number | null;
  employeeCount: number | null;
  exceptionsCount: number | null;
  errorCount: number | null;
  totalGross: number | null;
  totalNet: number | null;
  totalDeductions: number | null;
  totalEmployerCost: number | null;
  createdAt: string;
  createdById: number;
  processedAt: string | null;
  processedById: number | null;
  submittedAt: string | null;
  submittedById: number | null;
  approvedAt: string | null;
  approvedById: number | null;
  publishedAt: string | null;
  publishedById: number | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
}

export interface TimelineStep {
  step: 'created' | 'processed' | 'submitted' | 'approved' | 'published';
  at: string | null;
  by: { id: number; fullName: string } | null;
}

export interface PayrollRunDetail extends PayrollRun {
  timeline: TimelineStep[];
}

export interface RunException {
  payslipId: number;
  userId: number;
  fullName: string;
  code: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface RunPayslipItem {
  id: number;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  value: number;
  isTaxable: boolean;
}

export interface RunCalcInputs {
  absenceDays?: number | null;
  overtimeHours?: number | null;
  bonusAmount?: number | null;
  advanceDeduction?: number | null;
  workingDaysInMonth?: number | null;
}

export interface RunPayslip {
  id: number;
  userId: number;
  period: string;
  grossSalary: number;
  netSalary: number;
  status: PayslipStatus;
  hasExceptions: boolean;
  calcInputs: RunCalcInputs | null;
  user: { id: number; fullName: string; employeeNumber: string | null };
  items: RunPayslipItem[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const RUN_STATUS_MAP: StatusBadgeMap<RunStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PROCESSING: { label: 'A processar', cls: 'bg-info-subtle text-info-ink' },
  SIMULATED: { label: 'Simulado', cls: 'bg-info-subtle text-info-ink' },
  PENDING_APPROVAL: {
    label: 'Pendente de aprovação',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  CALCULATED: { label: 'Calculado', cls: 'bg-surface-sunken text-ink-muted' },
  APPROVED: { label: 'Aprovado', cls: 'bg-success-subtle text-success-ink' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-success text-white' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const EXCEPTION_SEVERITY_MAP: StatusBadgeMap<'ERROR' | 'WARNING'> = {
  ERROR: { label: 'Erro', cls: 'bg-danger-subtle text-danger-ink' },
  WARNING: { label: 'Aviso', cls: 'bg-warning-subtle text-warning-ink' },
};

export const EXCEPTION_CODE_LABEL: Record<string, string> = {
  NO_COMPENSATION: 'Sem compensação',
  ZERO_BASE_SALARY: 'Salário-base zero',
  NEGATIVE_NET: 'Líquido negativo',
  DUPLICATE_PAYSLIP_FOR_PERIOD: 'Recibo duplicado no período',
  NET_BELOW_MINIMUM_WAGE: 'Líquido abaixo do salário mínimo',
  MISSING_BANK_DETAILS: 'Dados bancários em falta',
  HIGH_VARIANCE_VS_PREV_MONTH: 'Variação alta face ao mês anterior',
  USING_FALLBACK_TAX_CONFIG: 'A usar configuração fiscal por omissão',
};
```

Now add the query-key block. In `lib/queryKeys.ts`, insert immediately after the closing `},` of the existing `payslips: { ... }` block (the one ending with `compensationHistory`):

```ts
  payroll: {
    all: ['payroll'] as const,
    runList: (params: Record<string, unknown>) =>
      [...queryKeys.payroll.all, 'run-list', params] as const,
    runDetail: (id: number) =>
      [...queryKeys.payroll.all, 'run-detail', id] as const,
    // Prefixo sem `params` — usado para invalidar TODAS as páginas/filtros
    // de recibos de um run de uma vez (React Query invalida por prefixo de
    // queryKey, exact:false por omissão).
    runPayslipsAll: (id: number) =>
      [...queryKeys.payroll.all, 'run-payslips', id] as const,
    runPayslips: (id: number, params: Record<string, unknown>) =>
      [...queryKeys.payroll.runPayslipsAll(id), params] as const,
    runExceptions: (id: number) =>
      [...queryKeys.payroll.all, 'run-exceptions', id] as const,
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/types.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify the queryKeys edit doesn't break the existing suite**

Run: `npx vitest run lib/`
Expected: PASS (no existing test imports the new block, so this only guards against a syntax error in the edit).

- [ ] **Step 6: Commit**

```bash
git add components/payroll/types.ts components/payroll/types.test.ts lib/queryKeys.ts
git commit -m "feat(payroll): types + status maps + queryKeys for the run workflow"
```

---

### Task 2: `CreateRunModal`

**Files:**
- Create: `components/payroll/CreateRunModal.tsx`
- Test: `components/payroll/CreateRunModal.test.tsx`

**Interfaces:**
- Consumes: `PayrollRun` (Task 1), `queryKeys.payroll.all` (Task 1).
- Produces: `CreateRunModalProps { onClose: () => void; onCreated: (runId: number) => void }` — Task 3 renders this component and passes both callbacks.

- [ ] **Step 1: Write the failing test**

```tsx
// components/payroll/CreateRunModal.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 42, period: '2026-09' });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { CreateRunModal } from './CreateRunModal';

beforeEach(() => {
  post.mockClear();
  notify.mockClear();
});

describe('CreateRunModal', () => {
  test('period is required — submit does not POST with it blank', () => {
    render(<CreateRunModal onClose={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('submits period + payGroup + countryCode + notes and calls onCreated with the new id', async () => {
    const onCreated = vi.fn();
    render(<CreateRunModal onClose={vi.fn()} onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText(/Período/i), {
      target: { value: '2026-09' },
    });
    fireEvent.change(screen.getByLabelText(/Grupo/i), {
      target: { value: 'Mensais' },
    });
    fireEvent.change(screen.getByLabelText(/País/i), {
      target: { value: 'AO' },
    });
    fireEvent.change(screen.getByLabelText(/Notas/i), {
      target: { value: 'Folha de Setembro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/payroll/runs',
      expect.objectContaining({
        period: '2026-09',
        payGroup: 'Mensais',
        countryCode: 'AO',
        notes: 'Folha de Setembro',
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(42);
  });

  test('Cancelar calls onClose without posting', () => {
    const onClose = vi.fn();
    render(<CreateRunModal onClose={onClose} onCreated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/CreateRunModal.test.tsx`
Expected: FAIL — `Cannot find module './CreateRunModal'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/payroll/CreateRunModal.tsx
// Criar um PayrollRun novo (DRAFT). Só os campos com UI nesta entrega:
// period/payGroup/countryCode/notes — departmentIds/userIds ficam fora de
// âmbito (spec, decisão #2). onCreated navega logo para o detalhe do run.
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
import type { PayrollRun } from './types';

export interface CreateRunModalProps {
  onClose: () => void;
  onCreated: (runId: number) => void;
}

export function CreateRunModal({ onClose, onCreated }: CreateRunModalProps) {
  const notify = useToast();
  const [period, setPeriod] = useState('');
  const [payGroup, setPayGroup] = useState('');
  const [countryCode, setCountryCode] = useState('AO');
  const [notes, setNotes] = useState('');

  const create = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post<PayrollRun>('/payroll/runs', body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: (run) => {
        notify({ title: 'Run criado', intent: 'success' });
        onCreated(run.id);
      },
    },
  );

  const valid = period.trim().length > 0;

  const handleSubmit = () => {
    if (!valid || create.isPending) return;
    create.mutate({
      period: period.trim(),
      payGroup: payGroup.trim() || undefined,
      countryCode: countryCode.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Novo run" className="max-w-md">
        <div className="mt-5 space-y-4">
          <FormField label="Período *" htmlFor="crm-period" hint="Formato AAAA-MM">
            <Input
              id="crm-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2026-09"
              className="w-full"
            />
          </FormField>
          <FormField label="Grupo" htmlFor="crm-paygroup">
            <Input
              id="crm-paygroup"
              value={payGroup}
              onChange={(e) => setPayGroup(e.target.value)}
              placeholder="Mensais"
              className="w-full"
            />
          </FormField>
          <FormField label="País" htmlFor="crm-country">
            <Input
              id="crm-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              className="w-full"
            />
          </FormField>
          <FormField label="Notas" htmlFor="crm-notes">
            <Textarea
              id="crm-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!valid} loading={create.isPending}>
            Criar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/CreateRunModal.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/payroll/CreateRunModal.tsx components/payroll/CreateRunModal.test.tsx
git commit -m "feat(payroll): CreateRunModal (POST /payroll/runs)"
```

---

### Task 3: `RunListView`

**Files:**
- Create: `components/payroll/RunListView.tsx`
- Test: `components/payroll/RunListView.test.tsx`

**Interfaces:**
- Consumes: `PayrollRun`, `Paginated<T>`, `RUN_STATUS_MAP`, `RunStatus` (Task 1); `queryKeys.payroll.runList` (Task 1); `CreateRunModalProps` (Task 2).
- Produces: `RunListViewProps { onSelect: (runId: number) => void }` — Task 8's `page.tsx` renders this.

- [ ] **Step 1: Write the failing test**

```tsx
// components/payroll/RunListView.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
}));
vi.mock('@tanstack/react-query', () => ({ keepPreviousData: Symbol('kpd') }));
vi.mock('@/components/ui/Select', () => ({
  Select: ({ items, value, onValueChange }: any) => (
    <select
      data-testid="status-select"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {items.map((it: any) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));
vi.mock('@/components/ui/Pagination', () => ({
  Pagination: ({ page, totalPages, onPageChange }: any) => (
    <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>
      {`${page}/${totalPages}`}
    </button>
  ),
}));
vi.mock('./CreateRunModal', () => ({
  CreateRunModal: ({ onCreated }: any) => (
    <button data-testid="create-modal" onClick={() => onCreated(99)}>
      mock-create
    </button>
  ),
}));

import { RunListView } from './RunListView';

const page1 = {
  data: [
    {
      id: 7,
      period: '2026-09',
      payGroup: 'Mensais',
      countryCode: 'AO',
      status: 'SIMULATED',
      employeeCount: 120,
      totalNet: 45000000,
      exceptionsCount: 3,
      errorCount: 1,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
  ],
  meta: { total: 1, page: 1, limit: 20, totalPages: 2 },
};

beforeEach(() => {
  queryResult = { data: page1, isLoading: false };
  useApiQuery.mockClear();
});

describe('RunListView', () => {
  test('renders a row with period, payGroup, status, employeeCount, totalNet, exceptions', () => {
    render(<RunListView onSelect={vi.fn()} />);
    expect(screen.getByText('2026-09')).toBeInTheDocument();
    expect(screen.getByText('Mensais')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/45.?000.?000/)).toBeInTheDocument();
  });

  test('status filter feeds the query params', () => {
    render(<RunListView onSelect={vi.fn()} />);
    fireEvent.change(screen.getByTestId('status-select'), {
      target: { value: 'APPROVED' },
    });
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(JSON.stringify(lastCall)).toContain('"status":"APPROVED"');
  });

  test('row click calls onSelect with the run id', () => {
    const onSelect = vi.fn();
    render(<RunListView onSelect={onSelect} />);
    fireEvent.click(screen.getByText('2026-09'));
    expect(onSelect).toHaveBeenCalledWith(7);
  });

  test('pagination advances the page param', () => {
    render(<RunListView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByTestId('next-page'));
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(JSON.stringify(lastCall)).toContain('"page":2');
  });

  test('empty list shows the EmptyState', () => {
    queryResult = {
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false,
    };
    render(<RunListView onSelect={vi.fn()} />);
    expect(screen.getByText(/Nenhum run encontrado/i)).toBeInTheDocument();
  });

  test('"+ Novo run" opens CreateRunModal; onCreated calls onSelect', () => {
    const onSelect = vi.fn();
    render(<RunListView onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo run' }));
    fireEvent.click(screen.getByTestId('create-modal'));
    expect(onSelect).toHaveBeenCalledWith(99);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/RunListView.test.tsx`
Expected: FAIL — `Cannot find module './RunListView'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/payroll/RunListView.tsx
// Lista paginada de PayrollRun (GET /payroll/runs). Mesmo molde de
// components/payslips/CompensationsView.tsx: filtros na toolbar, tabela,
// paginação, "+ Novo run" abre CreateRunModal; onCreated navega logo para
// o detalhe do run recém-criado.
'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CreateRunModal } from './CreateRunModal';
import { RUN_STATUS_MAP, type Paginated, type PayrollRun } from './types';

export interface RunListViewProps {
  onSelect: (runId: number) => void;
}

const STATUS_ITEMS = [
  { value: 'all', label: 'Todos os estados' },
  { value: 'DRAFT', label: RUN_STATUS_MAP.DRAFT.label },
  { value: 'PROCESSING', label: RUN_STATUS_MAP.PROCESSING.label },
  { value: 'SIMULATED', label: RUN_STATUS_MAP.SIMULATED.label },
  { value: 'PENDING_APPROVAL', label: RUN_STATUS_MAP.PENDING_APPROVAL.label },
  { value: 'APPROVED', label: RUN_STATUS_MAP.APPROVED.label },
  { value: 'PUBLISHED', label: RUN_STATUS_MAP.PUBLISHED.label },
  { value: 'CANCELLED', label: RUN_STATUS_MAP.CANCELLED.label },
];

const COLS = 'grid grid-cols-[110px_1fr_70px_120px_1fr_130px_110px_110px] gap-3';

export function RunListView({ onSelect }: RunListViewProps) {
  const [status, setStatus] = useState('all');
  const [period, setPeriod] = useState('');
  const [payGroup, setPayGroup] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  const params: Record<string, string | number> = { page, limit: 20 };
  if (status !== 'all') params.status = status;
  if (period.trim()) params.period = period.trim();
  if (payGroup.trim()) params.payGroup = payGroup.trim();

  const { data, isLoading, error } = useApiQuery<Paginated<PayrollRun>>(
    queryKeys.payroll.runList(params),
    '/payroll/runs',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          className="w-56"
        />
        <Input
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            setPage(1);
          }}
          placeholder="Período (AAAA-MM)"
          className="w-40"
        />
        <Input
          value={payGroup}
          onChange={(e) => {
            setPayGroup(e.target.value);
            setPage(1);
          }}
          placeholder="Grupo"
          className="w-40"
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          + Novo run
        </Button>
      </div>

      {isLoading && <Skeleton rows={8} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Nenhum run encontrado"
          description="Limpa os filtros ou cria um novo run com “+ Novo run”."
        />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div
              className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}
            >
              <div>Período</div>
              <div>Grupo</div>
              <div>País</div>
              <div>Estado</div>
              <div>Colaboradores</div>
              <div>Total líquido</div>
              <div>Exceções</div>
              <div>Criado em</div>
            </div>
            {rows.map((r) => (
              <div
                key={r.id}
                className={`${COLS} cursor-pointer items-center border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken`}
                onClick={() => onSelect(r.id)}
              >
                <div className="font-mono text-sm font-medium text-ink">{r.period}</div>
                <div className="truncate font-body text-sm text-ink-muted">
                  {r.payGroup ?? '—'}
                </div>
                <div className="font-body text-sm text-ink-muted">{r.countryCode}</div>
                <div>
                  <StatusBadge value={r.status} map={RUN_STATUS_MAP} variant="dot" />
                </div>
                <div className="font-mono text-sm text-ink">{r.employeeCount ?? '—'}</div>
                <div className="font-mono text-sm font-semibold text-ink">
                  {fmtKz(r.totalNet)}
                </div>
                <div className="font-body text-sm text-ink-muted">
                  {r.exceptionsCount ?? 0}
                  {(r.errorCount ?? 0) > 0 && (
                    <span className="ml-1 text-danger">({r.errorCount} erro)</span>
                  )}
                </div>
                <div className="font-body text-sm text-ink-muted">{fmtDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {creating && (
        <CreateRunModal
          onClose={() => setCreating(false)}
          onCreated={(runId) => {
            setCreating(false);
            onSelect(runId);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/RunListView.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add components/payroll/RunListView.tsx components/payroll/RunListView.test.tsx
git commit -m "feat(payroll): RunListView (GET /payroll/runs, paginated + filters)"
```

---

### Task 4: `RecalcPayslipModal`

**Files:**
- Create: `components/payroll/RecalcPayslipModal.tsx`
- Test: `components/payroll/RecalcPayslipModal.test.tsx`

**Interfaces:**
- Consumes: `RunPayslip`, `queryKeys.payroll.{runDetail, runPayslipsAll, runExceptions}` (Task 1).
- Produces: `RecalcPayslipModalProps { runId: number; payslip: RunPayslip; onClose: () => void }` — Task 5 renders this.

- [ ] **Step 1: Write the failing test**

```tsx
// components/payroll/RecalcPayslipModal.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const patch = vi.fn().mockResolvedValue({ id: 5 });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: { patch: (...a: unknown[]) => patch(...a) },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { RecalcPayslipModal } from './RecalcPayslipModal';
import type { RunPayslip } from './types';

const payslip: RunPayslip = {
  id: 5,
  userId: 7,
  period: '2026-09',
  grossSalary: 150000,
  netSalary: 120000,
  status: 'DRAFT',
  hasExceptions: false,
  calcInputs: { absenceDays: 2, overtimeHours: 0, bonusAmount: null, advanceDeduction: null },
  user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
  items: [],
};

beforeEach(() => {
  patch.mockClear();
  notify.mockClear();
});

describe('RecalcPayslipModal', () => {
  test('prefills inputs from payslip.calcInputs', () => {
    render(<RecalcPayslipModal runId={9} payslip={payslip} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Dias de falta/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Horas extra/i)).toHaveValue(0);
    expect(screen.getByLabelText(/Bónus/i)).toHaveValue(null);
    expect(screen.getByLabelText(/Adiantamento/i)).toHaveValue(null);
  });

  test('starts blank when calcInputs is null', () => {
    render(
      <RecalcPayslipModal
        runId={9}
        payslip={{ ...payslip, calcInputs: null }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/Dias de falta/i)).toHaveValue(null);
  });

  test('submits only the filled fields as numbers to the right endpoint', async () => {
    const onClose = vi.fn();
    render(<RecalcPayslipModal runId={9} payslip={payslip} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Bónus/i), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    const [url, body] = patch.mock.calls[0];
    expect(url).toBe('/payroll/runs/9/payslips/5/recalc');
    expect(body).toEqual({ absenceDays: 2, overtimeHours: 0, bonusAmount: 10000 });
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/RecalcPayslipModal.test.tsx`
Expected: FAIL — `Cannot find module './RecalcPayslipModal'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/payroll/RecalcPayslipModal.tsx
// PATCH /payroll/runs/:runId/payslips/:payslipId/recalc — edita os 4 inputs
// opcionais do RecalcPayslipInputsDto do backend. Pré-preenche a partir de
// payslip.calcInputs (gravado pelo último process/recalc).
'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import type { RunPayslip } from './types';

export interface RecalcPayslipModalProps {
  runId: number;
  payslip: RunPayslip;
  onClose: () => void;
}

const toInputValue = (n: number | null | undefined) => (n == null ? '' : String(n));

export function RecalcPayslipModal({ runId, payslip, onClose }: RecalcPayslipModalProps) {
  const notify = useToast();
  const [absenceDays, setAbsenceDays] = useState(toInputValue(payslip.calcInputs?.absenceDays));
  const [overtimeHours, setOvertimeHours] = useState(
    toInputValue(payslip.calcInputs?.overtimeHours),
  );
  const [bonusAmount, setBonusAmount] = useState(toInputValue(payslip.calcInputs?.bonusAmount));
  const [advanceDeduction, setAdvanceDeduction] = useState(
    toInputValue(payslip.calcInputs?.advanceDeduction),
  );

  const recalc = useApiMutation(
    (body: Record<string, number>) =>
      apiClient.patch(`/payroll/runs/${runId}/payslips/${payslip.id}/recalc`, body),
    {
      invalidateKeys: [
        queryKeys.payroll.runDetail(runId),
        queryKeys.payroll.runPayslipsAll(runId),
        queryKeys.payroll.runExceptions(runId),
      ],
      onSuccess: () => {
        notify({ title: 'Recibo recalculado', intent: 'success' });
        onClose();
      },
    },
  );

  const handleSubmit = () => {
    const body: Record<string, number> = {};
    if (absenceDays.trim() !== '') body.absenceDays = Number(absenceDays);
    if (overtimeHours.trim() !== '') body.overtimeHours = Number(overtimeHours);
    if (bonusAmount.trim() !== '') body.bonusAmount = Number(bonusAmount);
    if (advanceDeduction.trim() !== '') body.advanceDeduction = Number(advanceDeduction);
    recalc.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Recalcular — ${payslip.user.fullName}`}
        className="max-w-md"
      >
        <div className="mt-5 grid grid-cols-2 gap-3">
          <FormField label="Dias de falta" htmlFor="rpm-absence">
            <Input
              id="rpm-absence"
              type="number"
              step="any"
              value={absenceDays}
              onChange={(e) => setAbsenceDays(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Horas extra" htmlFor="rpm-overtime">
            <Input
              id="rpm-overtime"
              type="number"
              step="any"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Bónus (Kz)" htmlFor="rpm-bonus">
            <Input
              id="rpm-bonus"
              type="number"
              step="any"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Adiantamento (Kz)" htmlFor="rpm-advance">
            <Input
              id="rpm-advance"
              type="number"
              step="any"
              value={advanceDeduction}
              onChange={(e) => setAdvanceDeduction(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={recalc.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={recalc.isPending}>
            Recalcular
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/RecalcPayslipModal.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add components/payroll/RecalcPayslipModal.tsx components/payroll/RecalcPayslipModal.test.tsx
git commit -m "feat(payroll): RecalcPayslipModal (PATCH .../payslips/:id/recalc)"
```

---

### Task 5: `RunPayslipsTable`

**Files:**
- Create: `components/payroll/RunPayslipsTable.tsx`
- Test: `components/payroll/RunPayslipsTable.test.tsx`

**Interfaces:**
- Consumes: `RunPayslip`, `Paginated<T>`, `RunStatus`, `queryKeys.payroll.{runPayslips, runDetail, runPayslipsAll, runExceptions}` (Task 1); `RecalcPayslipModalProps` (Task 4); `PAYSLIP_STATUS_MAP`, `PayslipStatus` from `@/components/payslips/types` (existing).
- Produces: `RunPayslipsTableProps { runId: number; runStatus: RunStatus; highlightPayslipId?: number | null }` — Task 7 renders this.

- [ ] **Step 1: Write the failing test**

```tsx
// components/payroll/RunPayslipsTable.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);
const patch = vi.fn().mockResolvedValue({ id: 5, runId: null });
const confirm = vi.fn().mockResolvedValue(true);
const notify = vi.fn();

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('@tanstack/react-query', () => ({ keepPreviousData: Symbol('kpd') }));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { patch: (...a: unknown[]) => patch(...a) },
}));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/components/ui/Pagination', () => ({
  Pagination: () => null,
}));
vi.mock('./RecalcPayslipModal', () => ({
  RecalcPayslipModal: ({ payslip }: any) => (
    <div data-testid="recalc-modal">{payslip.user.fullName}</div>
  ),
}));

import { RunPayslipsTable } from './RunPayslipsTable';

const page1 = {
  data: [
    {
      id: 5,
      userId: 7,
      period: '2026-09',
      grossSalary: 150000,
      netSalary: 120000,
      status: 'DRAFT',
      hasExceptions: true,
      calcInputs: null,
      user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
      items: [],
    },
  ],
  meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
};

beforeEach(() => {
  queryResult = { data: page1, isLoading: false };
  useApiQuery.mockClear();
  patch.mockClear();
  confirm.mockClear();
});

describe('RunPayslipsTable', () => {
  test('renders a row with collaborator, gross, net, exceptions indicator, status', () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('E-7')).toBeInTheDocument();
    expect(screen.getByText(/150.?000/)).toBeInTheDocument();
    expect(screen.getByText(/120.?000/)).toBeInTheDocument();
  });

  test('row actions are hidden when run is not SIMULATED', () => {
    render(<RunPayslipsTable runId={9} runStatus="PENDING_APPROVAL" />);
    expect(screen.queryByRole('button', { name: 'Recalcular' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });

  test('"Recalcular" opens RecalcPayslipModal for that row when run is SIMULATED', () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular' }));
    expect(screen.getByTestId('recalc-modal')).toHaveTextContent('Ana Silva');
  });

  test('"Excluir" confirms then PATCHes the exclude endpoint', async () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith('/payroll/runs/9/payslips/5/exclude');
  });

  test('"Excluir" does not PATCH when the confirm dialog is declined', async () => {
    confirm.mockResolvedValueOnce(false);
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(patch).not.toHaveBeenCalled();
  });

  test('the row matching highlightPayslipId gets the highlight class', () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" highlightPayslipId={5} />);
    expect(screen.getByTestId('run-payslip-row-5')).toHaveClass('bg-warning-subtle');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/RunPayslipsTable.test.tsx`
Expected: FAIL — `Cannot find module './RunPayslipsTable'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/payroll/RunPayslipsTable.tsx
// Tabela paginada de recibos do run (GET /payroll/runs/:id/payslips).
// Acções por linha ("Recalcular"/"Excluir") só quando runStatus==='SIMULATED'
// — reflecte assertTransition(run, ['SIMULATED'], 'recalc'|'exclude') do
// backend. highlightPayslipId realça a linha clicada no ExceptionsPanel.
'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { PAYSLIP_STATUS_MAP } from '@/components/payslips/types';
import { RecalcPayslipModal } from './RecalcPayslipModal';
import type { Paginated, RunPayslip, RunStatus } from './types';

export interface RunPayslipsTableProps {
  runId: number;
  runStatus: RunStatus;
  highlightPayslipId?: number | null;
}

const COLS = 'grid grid-cols-[1.4fr_130px_130px_110px_120px_220px] gap-3';

export function RunPayslipsTable({ runId, runStatus, highlightPayslipId }: RunPayslipsTableProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [page, setPage] = useState(1);
  const [recalcTarget, setRecalcTarget] = useState<RunPayslip | null>(null);

  const params = { page, limit: 50 };
  const { data, isLoading, error } = useApiQuery<Paginated<RunPayslip>>(
    queryKeys.payroll.runPayslips(runId, params),
    `/payroll/runs/${runId}/payslips`,
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const exclude = useApiMutation(
    (payslipId: number) => apiClient.patch(`/payroll/runs/${runId}/payslips/${payslipId}/exclude`),
    {
      invalidateKeys: [
        queryKeys.payroll.runDetail(runId),
        queryKeys.payroll.runPayslipsAll(runId),
        queryKeys.payroll.runExceptions(runId),
      ],
      onSuccess: () => notify({ title: 'Recibo excluído do run', intent: 'success' }),
    },
  );

  const handleExclude = async (p: RunPayslip) => {
    const ok = await confirm({
      title: `Excluir "${p.user.fullName}" deste run?`,
      message: 'O recibo volta a ficar solto, sem run associado.',
      confirmLabel: 'Excluir',
      destructive: true,
    });
    if (!ok) return;
    exclude.mutate(p.id);
  };

  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 0;
  const editable = runStatus === 'SIMULATED';

  return (
    <div>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Recibos do run
      </h3>

      {isLoading && <Skeleton rows={6} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {!isLoading && !error && rows.length === 0 && (
        <EmptyState title="Sem recibos" description="Este run ainda não tem recibos gerados." />
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] overflow-hidden rounded-card border border-border bg-surface">
            <div
              className={`${COLS} border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint`}
            >
              <div>Colaborador</div>
              <div>Bruto</div>
              <div>Líquido</div>
              <div>Estado</div>
              <div>Exceções</div>
              {editable && <div>Acções</div>}
            </div>
            {rows.map((p) => (
              <div
                key={p.id}
                data-testid={`run-payslip-row-${p.id}`}
                className={`${COLS} items-center border-b border-border px-4 py-3 last:border-0 ${
                  highlightPayslipId === p.id ? 'bg-warning-subtle' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {p.user.fullName}
                  </div>
                  <div className="truncate font-mono text-xs text-ink-faint">
                    {p.user.employeeNumber ?? '—'}
                  </div>
                </div>
                <div className="font-mono text-sm text-ink-muted">{fmtKz(p.grossSalary)}</div>
                <div className="font-mono text-sm font-semibold text-ink">
                  {fmtKz(p.netSalary)}
                </div>
                <div>
                  <StatusBadge value={p.status} map={PAYSLIP_STATUS_MAP} variant="plain" />
                </div>
                <div>
                  {p.hasExceptions && (
                    <span className="flex items-center gap-1 text-warning-ink">
                      <AlertCircle size={14} strokeWidth={1.75} />
                    </span>
                  )}
                </div>
                {editable && (
                  <div className="flex gap-2">
                    <Button size="sm" intent="secondary" onClick={() => setRecalcTarget(p)}>
                      Recalcular
                    </Button>
                    <Button size="sm" intent="danger" onClick={() => handleExclude(p)}>
                      Excluir
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {recalcTarget && (
        <RecalcPayslipModal
          runId={runId}
          payslip={recalcTarget}
          onClose={() => setRecalcTarget(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/RunPayslipsTable.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add components/payroll/RunPayslipsTable.tsx components/payroll/RunPayslipsTable.test.tsx
git commit -m "feat(payroll): RunPayslipsTable (GET .../payslips, recalc/exclude per row)"
```

---

### Task 6: `ExceptionsPanel`

**Files:**
- Create: `components/payroll/ExceptionsPanel.tsx`
- Test: `components/payroll/ExceptionsPanel.test.tsx`

**Interfaces:**
- Consumes: `RunException`, `EXCEPTION_SEVERITY_MAP`, `queryKeys.payroll.runExceptions` (Task 1).
- Produces: `ExceptionsPanelProps { runId: number; onSelectException?: (payslipId: number) => void }` — Task 7 renders this.

- [ ] **Step 1: Write the failing test**

```tsx
// components/payroll/ExceptionsPanel.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
}));

import { ExceptionsPanel } from './ExceptionsPanel';

const exceptions = [
  {
    payslipId: 5,
    userId: 7,
    fullName: 'Ana Silva',
    code: 'NET_BELOW_MINIMUM_WAGE',
    severity: 'WARNING',
    message: 'Líquido abaixo do salário mínimo.',
  },
  {
    payslipId: 6,
    userId: 8,
    fullName: 'Rui Costa',
    code: 'ZERO_BASE_SALARY',
    severity: 'ERROR',
    message: 'Salário-base é 0.',
  },
];

beforeEach(() => {
  queryResult = { data: exceptions, isLoading: false };
  useApiQuery.mockClear();
});

describe('ExceptionsPanel', () => {
  test('renders ERROR before WARNING, each with its count', () => {
    render(<ExceptionsPanel runId={9} />);
    const headings = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    expect(headings.join(' ')).toMatch(/Erros.*Avisos/s);
    expect(screen.getByText(/Erros \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Avisos \(1\)/)).toBeInTheDocument();
  });

  test('renders the message and collaborator for each exception', () => {
    render(<ExceptionsPanel runId={9} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Líquido abaixo do salário mínimo.')).toBeInTheDocument();
    expect(screen.getByText('Rui Costa')).toBeInTheDocument();
    expect(screen.getByText('Salário-base é 0.')).toBeInTheDocument();
  });

  test('empty list shows "Sem exceções"', () => {
    queryResult = { data: [], isLoading: false };
    render(<ExceptionsPanel runId={9} />);
    expect(screen.getByText(/Sem exceções/i)).toBeInTheDocument();
  });

  test('clicking a row calls onSelectException with the payslipId', () => {
    const onSelectException = vi.fn();
    render(<ExceptionsPanel runId={9} onSelectException={onSelectException} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    expect(onSelectException).toHaveBeenCalledWith(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/ExceptionsPanel.test.tsx`
Expected: FAIL — `Cannot find module './ExceptionsPanel'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/payroll/ExceptionsPanel.tsx
// Lista plana de excepções do run (GET /payroll/runs/:id/exceptions),
// agrupada visualmente por severidade — ERROR primeiro (bloqueiam submit).
// onSelectException deixa o RunDetailView realçar a linha correspondente
// em RunPayslipsTable.
'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EXCEPTION_SEVERITY_MAP, EXCEPTION_CODE_LABEL, type RunException } from './types';

export interface ExceptionsPanelProps {
  runId: number;
  onSelectException?: (payslipId: number) => void;
}

function Group({
  title,
  items,
  onSelectException,
}: {
  title: string;
  items: RunException[];
  onSelectException?: (payslipId: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-4">
      <h4 className="mb-2 font-body text-sm font-semibold text-ink">
        {title} ({items.length})
      </h4>
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {items.map((e, i) => (
          <button
            key={`${e.payslipId}-${e.code}-${i}`}
            type="button"
            onClick={() => onSelectException?.(e.payslipId)}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left last:border-0 hover:bg-surface-sunken"
          >
            <StatusBadge value={e.severity} map={EXCEPTION_SEVERITY_MAP} variant="pill" />
            <span className="font-body text-sm font-medium text-ink">{e.fullName}</span>
            <span className="font-body text-xs text-ink-faint">
              {EXCEPTION_CODE_LABEL[e.code] ?? e.code}
            </span>
            <span className="ml-auto font-body text-sm text-ink-muted">{e.message}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExceptionsPanel({ runId, onSelectException }: ExceptionsPanelProps) {
  const { data, isLoading } = useApiQuery<RunException[]>(
    queryKeys.payroll.runExceptions(runId),
    `/payroll/runs/${runId}/exceptions`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const exceptions = data ?? [];
  const errors = exceptions.filter((e) => e.severity === 'ERROR');
  const warnings = exceptions.filter((e) => e.severity === 'WARNING');

  return (
    <div>
      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Exceções
      </h3>
      {!isLoading && exceptions.length === 0 && (
        <EmptyState title="Sem exceções" description="Nenhuma exceção detectada neste run." />
      )}
      <Group title="Erros" items={errors} onSelectException={onSelectException} />
      <Group title="Avisos" items={warnings} onSelectException={onSelectException} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/ExceptionsPanel.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add components/payroll/ExceptionsPanel.tsx components/payroll/ExceptionsPanel.test.tsx
git commit -m "feat(payroll): ExceptionsPanel (GET .../exceptions, grouped by severity)"
```

---

### Task 7: `RunDetailView`

**Files:**
- Create: `components/payroll/RunDetailView.tsx`
- Test: `components/payroll/RunDetailView.test.tsx`

**Interfaces:**
- Consumes: `PayrollRunDetail`, `RUN_STATUS_MAP`, `queryKeys.payroll.{runDetail, all}` (Task 1); `RunPayslipsTableProps` (Task 5); `ExceptionsPanelProps` (Task 6).
- Produces: `RunDetailViewProps { runId: number; onBack: () => void }` — Task 8's `page.tsx` renders this.

This is the highest-risk task: the action buttons shown per `run.status` must exactly match the backend's `assertTransition`/`assertRunEditable` (spec §5). Test every status row of that table.

- [ ] **Step 1: Write the failing test**

```tsx
// components/payroll/RunDetailView.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);
const post = vi.fn().mockResolvedValue({});
const confirm = vi.fn().mockResolvedValue(true);
const notify = vi.fn();

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('./RunPayslipsTable', () => ({
  RunPayslipsTable: ({ runStatus }: any) => (
    <div data-testid="payslips-table">{runStatus}</div>
  ),
}));
vi.mock('./ExceptionsPanel', () => ({
  ExceptionsPanel: () => <div data-testid="exceptions-panel" />,
}));

import { RunDetailView } from './RunDetailView';

function makeRun(overrides: Record<string, unknown>) {
  return {
    id: 9,
    period: '2026-09',
    payGroup: 'Mensais',
    countryCode: 'AO',
    status: 'DRAFT',
    notes: null,
    taxYear: 2026,
    employeeCount: 100,
    exceptionsCount: 0,
    errorCount: 0,
    totalGross: 50000000,
    totalNet: 40000000,
    totalDeductions: 8000000,
    totalEmployerCost: 4000000,
    createdAt: '2026-09-01T08:00:00.000Z',
    createdById: 1,
    processedAt: null,
    processedById: null,
    submittedAt: null,
    submittedById: null,
    approvedAt: null,
    approvedById: null,
    publishedAt: null,
    publishedById: null,
    rejectionReason: null,
    cancellationReason: null,
    timeline: [
      { step: 'created', at: '2026-09-01T08:00:00.000Z', by: { id: 1, fullName: 'Rita RH' } },
      { step: 'processed', at: null, by: null },
      { step: 'submitted', at: null, by: null },
      { step: 'approved', at: null, by: null },
      { step: 'published', at: null, by: null },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  useApiQuery.mockClear();
  post.mockClear();
  confirm.mockClear();
  confirm.mockResolvedValue(true);
  notify.mockClear();
});

describe('RunDetailView — action visibility per status', () => {
  test('DRAFT shows only "Processar"', () => {
    queryResult = { data: makeRun({ status: 'DRAFT' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Processar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submeter' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument();
  });

  test('SIMULATED with no errors shows Reprocessar/Submeter(enabled)/Cancelar', () => {
    queryResult = { data: makeRun({ status: 'SIMULATED', errorCount: 0 }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Reprocessar' })).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Submeter' });
    expect(submit).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  test('SIMULATED with errorCount>0 disables Submeter and shows the backend warning text', () => {
    queryResult = { data: makeRun({ status: 'SIMULATED', errorCount: 2 }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Submeter' })).toBeDisabled();
    expect(
      screen.getByText('Run tem 2 exceção(ões) de erro — resolver antes de submeter.'),
    ).toBeInTheDocument();
  });

  test('PENDING_APPROVAL shows Aprovar/Rejeitar/Cancelar; Rejeitar opens the reason panel', async () => {
    queryResult = { data: makeRun({ status: 'PENDING_APPROVAL' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rejeitar' }));
    const confirmReject = screen.getByRole('button', { name: 'Confirmar rejeição' });
    expect(confirmReject).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Motivo/i), {
      target: { value: 'Valores incorrectos' },
    });
    expect(confirmReject).toBeEnabled();
    fireEvent.click(confirmReject);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/payroll/runs/9/reject', {
      reason: 'Valores incorrectos',
    });
  });

  test('APPROVED shows Publicar/Cancelar; Publicar asks for confirmation before POSTing', async () => {
    queryResult = { data: makeRun({ status: 'APPROVED' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/payroll/runs/9/publish', {}));
  });

  test('a declined confirm does not POST', async () => {
    confirm.mockResolvedValueOnce(false);
    queryResult = { data: makeRun({ status: 'DRAFT' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Processar' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
  });

  test('PUBLISHED and CANCELLED show no action buttons', () => {
    queryResult = { data: makeRun({ status: 'PUBLISHED' }), isLoading: false };
    const { rerender } = render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Processar|Submeter|Aprovar|Publicar|Cancelar/ })).not.toBeInTheDocument();

    queryResult = { data: makeRun({ status: 'CANCELLED' }), isLoading: false };
    rerender(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Processar|Submeter|Aprovar|Publicar|Cancelar/ })).not.toBeInTheDocument();
  });

  test('renders the timeline with dates and actor names', () => {
    queryResult = { data: makeRun({ status: 'DRAFT' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByText('Rita RH')).toBeInTheDocument();
  });

  test('passes run.status through to RunPayslipsTable', () => {
    queryResult = { data: makeRun({ status: 'SIMULATED' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByTestId('payslips-table')).toHaveTextContent('SIMULATED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/payroll/RunDetailView.test.tsx`
Expected: FAIL — `Cannot find module './RunDetailView'`.

- [ ] **Step 3: Write the implementation**

```tsx
// components/payroll/RunDetailView.tsx
// Detalhe de um PayrollRun: cabeçalho + totais + barra de acções + timeline
// + ExceptionsPanel + RunPayslipsTable. A barra de acções replica
// EXACTAMENTE assertTransition/assertRunEditable do backend
// (payroll-workflow.service.ts) — nunca oferece uma acção que devolveria
// 409/403. reject/cancel usam um painel inline com motivo obrigatório
// (padrão de components/onboarding/PlanDetailModal.tsx); as restantes
// transições passam por useConfirm() antes de disparar (publish/cancel são
// irreversíveis).
'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDateTime as fmtDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { RunPayslipsTable } from './RunPayslipsTable';
import { ExceptionsPanel } from './ExceptionsPanel';
import { RUN_STATUS_MAP, type PayrollRunDetail } from './types';

export interface RunDetailViewProps {
  runId: number;
  onBack: () => void;
}

type Panel = { kind: 'none' } | { kind: 'reject' } | { kind: 'cancel' };

const TIMELINE_LABEL: Record<string, string> = {
  created: 'Criado',
  processed: 'Processado',
  submitted: 'Submetido',
  approved: 'Aprovado',
  published: 'Publicado',
};

const TOTALS: Array<[string, (r: PayrollRunDetail) => string]> = [
  ['Colaboradores', (r) => (r.employeeCount ?? '—').toString()],
  ['Bruto', (r) => fmtKz(r.totalGross)],
  ['Líquido', (r) => fmtKz(r.totalNet)],
  ['Descontos', (r) => fmtKz(r.totalDeductions)],
  ['Custo empregador', (r) => fmtKz(r.totalEmployerCost)],
];

export function RunDetailView({ runId, onBack }: RunDetailViewProps) {
  const confirm = useConfirm();
  const notify = useToast();
  const [panel, setPanel] = useState<Panel>({ kind: 'none' });
  const [reason, setReason] = useState('');
  const [highlightPayslipId, setHighlightPayslipId] = useState<number | null>(null);

  const { data: run, isLoading, error } = useApiQuery<PayrollRunDetail>(
    queryKeys.payroll.runDetail(runId),
    `/payroll/runs/${runId}`,
    {
      staleTime: STALE_TIME.DYNAMIC,
      // Enquanto o run está PROCESSING (passo síncrono no backend), sonda a
      // cada 3s até transitar para SIMULATED — evita exigir refresh manual.
      refetchInterval: (query) =>
        (query.state.data as PayrollRunDetail | undefined)?.status === 'PROCESSING'
          ? 3000
          : false,
    },
  );

  const transition = useApiMutation(
    (action: 'process' | 'submit' | 'approve' | 'publish') =>
      apiClient.post(`/payroll/runs/${runId}/${action}`, {}),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => notify({ title: 'Estado do run actualizado', intent: 'success' }),
      onError: (e: Error) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const rejectMut = useApiMutation(
    (body: { reason: string }) => apiClient.post(`/payroll/runs/${runId}/reject`, body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({ title: 'Run rejeitado', intent: 'success' });
        setPanel({ kind: 'none' });
        setReason('');
      },
    },
  );

  const cancelMut = useApiMutation(
    (body: { reason: string }) => apiClient.post(`/payroll/runs/${runId}/cancel`, body),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        notify({ title: 'Run cancelado', intent: 'success' });
        setPanel({ kind: 'none' });
        setReason('');
      },
    },
  );

  const runSimpleAction = async (
    action: 'process' | 'submit' | 'approve' | 'publish',
    title: string,
    message: string,
  ) => {
    const ok = await confirm({ title, message, confirmLabel: 'Confirmar' });
    if (!ok) return;
    transition.mutate(action);
  };

  if (isLoading) return <Skeleton rows={6} />;
  if (error) return <div className="font-body text-sm text-danger">{error.message}</div>;
  if (!run) return null;

  const busy = transition.isPending || rejectMut.isPending || cancelMut.isPending;

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
            {run.period}
            {run.payGroup ? ` · ${run.payGroup}` : ''}
          </h2>
          <p className="font-body text-sm text-ink-faint">{run.countryCode}</p>
        </div>
        <StatusBadge value={run.status} map={RUN_STATUS_MAP} variant="dot" />
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TOTALS.map(([label, getValue]) => (
          <div key={label} className="rounded-card border border-border bg-surface p-3">
            <dt className="font-body text-xs text-ink-faint">{label}</dt>
            <dd className="font-mono text-sm font-semibold text-ink">{getValue(run)}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        {run.status === 'DRAFT' && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              runSimpleAction(
                'process',
                'Processar run?',
                'Calcula os recibos de todos os colaboradores do âmbito.',
              )
            }
          >
            Processar
          </Button>
        )}
        {run.status === 'SIMULATED' && (
          <>
            <Button
              size="sm"
              intent="secondary"
              disabled={busy}
              onClick={() =>
                runSimpleAction(
                  'process',
                  'Reprocessar run?',
                  'Recria todos os recibos do âmbito — exclusões manuais são repostas.',
                )
              }
            >
              Reprocessar
            </Button>
            <Button
              size="sm"
              disabled={busy || (run.errorCount ?? 0) > 0}
              onClick={() =>
                runSimpleAction(
                  'submit',
                  'Submeter para aprovação?',
                  'O run fica pendente de aprovação.',
                )
              }
            >
              Submeter
            </Button>
            <Button size="sm" intent="danger" disabled={busy} onClick={() => setPanel({ kind: 'cancel' })}>
              Cancelar
            </Button>
          </>
        )}
        {run.status === 'PENDING_APPROVAL' && (
          <>
            <Button
              size="sm"
              intent="success"
              disabled={busy}
              onClick={() =>
                runSimpleAction('approve', 'Aprovar run?', 'O run avança para publicação.')
              }
            >
              Aprovar
            </Button>
            <Button size="sm" intent="danger" disabled={busy} onClick={() => setPanel({ kind: 'reject' })}>
              Rejeitar
            </Button>
            <Button size="sm" intent="ghost" disabled={busy} onClick={() => setPanel({ kind: 'cancel' })}>
              Cancelar
            </Button>
          </>
        )}
        {run.status === 'APPROVED' && (
          <>
            <Button
              size="sm"
              intent="success"
              disabled={busy}
              onClick={() =>
                runSimpleAction(
                  'publish',
                  'Publicar run?',
                  'Os recibos ficam visíveis aos colaboradores. Esta acção é irreversível.',
                )
              }
            >
              Publicar
            </Button>
            <Button size="sm" intent="ghost" disabled={busy} onClick={() => setPanel({ kind: 'cancel' })}>
              Cancelar
            </Button>
          </>
        )}
      </div>

      {run.status === 'SIMULATED' && (run.errorCount ?? 0) > 0 && (
        <p className="mb-4 font-body text-sm text-danger">
          {`Run tem ${run.errorCount} exceção(ões) de erro — resolver antes de submeter.`}
        </p>
      )}

      {(panel.kind === 'reject' || panel.kind === 'cancel') && (
        <div className="mb-6 rounded-card border border-border bg-surface-sunken p-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full"
            placeholder="Motivo (obrigatório)…"
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button
              size="sm"
              intent="ghost"
              onClick={() => {
                setPanel({ kind: 'none' });
                setReason('');
              }}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              intent="danger"
              disabled={!reason.trim()}
              loading={panel.kind === 'reject' ? rejectMut.isPending : cancelMut.isPending}
              onClick={() =>
                panel.kind === 'reject'
                  ? rejectMut.mutate({ reason })
                  : cancelMut.mutate({ reason })
              }
            >
              {panel.kind === 'reject' ? 'Confirmar rejeição' : 'Confirmar cancelamento'}
            </Button>
          </div>
        </div>
      )}

      <h3 className="mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
        Timeline
      </h3>
      <ol className="mb-8 space-y-2">
        {run.timeline.map((t) => (
          <li key={t.step} className="flex items-center gap-3 font-body text-sm">
            <span className={t.at ? 'text-success' : 'text-ink-faint'}>●</span>
            <span className="w-24 text-ink-muted">{TIMELINE_LABEL[t.step] ?? t.step}</span>
            <span className="text-ink">{t.at ? fmtDateTime(t.at) : '—'}</span>
            {t.by && <span className="text-ink-faint">· {t.by.fullName}</span>}
          </li>
        ))}
      </ol>

      <div className="mb-8">
        <ExceptionsPanel runId={runId} onSelectException={setHighlightPayslipId} />
      </div>
      <RunPayslipsTable runId={runId} runStatus={run.status} highlightPayslipId={highlightPayslipId} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/payroll/RunDetailView.test.tsx`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add components/payroll/RunDetailView.tsx components/payroll/RunDetailView.test.tsx
git commit -m "feat(payroll): RunDetailView (state machine actions + timeline)"
```

---

### Task 8: Wire up the route and sidebar nav

**Files:**
- Create: `app/(platform)/payroll/layout.tsx`
- Create: `app/(platform)/payroll/page.tsx`
- Modify: `components/Sidebar.tsx`

**Interfaces:**
- Consumes: `RunListViewProps` (Task 3), `RunDetailViewProps` (Task 7).
- Produces: the `/payroll` route itself — nothing downstream depends on this task.

No new test file for this task — `app/(platform)/payslips/page.tsx` (the file this mirrors) has none either; correctness here is "does it build and does the existing suite still pass," checked in Step 3.

- [ ] **Step 1: Create the layout**

```tsx
// app/(platform)/payroll/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Folha de Pagamento' };

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the page**

```tsx
// app/(platform)/payroll/page.tsx
'use client';

import { useState } from 'react';
import { RunListView } from '@/components/payroll/RunListView';
import { RunDetailView } from '@/components/payroll/RunDetailView';

type Nav = { view: 'list' } | { view: 'detail'; runId: number };

export default function PayrollPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">Folha de Pagamento</h1>
      </div>
      {nav.view === 'list' && (
        <RunListView onSelect={(runId) => setNav({ view: 'detail', runId })} />
      )}
      {nav.view === 'detail' && (
        <RunDetailView runId={nav.runId} onBack={() => setNav({ view: 'list' })} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add the sidebar nav entry**

In `components/Sidebar.tsx`, add `Wallet` to the existing `lucide-react` import list (it currently includes `FileText` among others — add `Wallet` alongside it, keeping the list alphabetized if the surrounding entries are, otherwise just append it before the closing `} from 'lucide-react';`).

Then, in the "Recursos Humanos" section's `items` array, immediately after the `/payslips` entry (`{ href: '/payslips', icon: FileText, label: 'Recibos Salariais' }`), add:

```ts
      {
        href: '/payroll',
        icon: Wallet,
        label: 'Folha de Pagamento',
        roles: ADMIN_ROLES,
      },
```

(`ADMIN_ROLES` is already imported at the top of `components/Sidebar.tsx` — `import { ADMIN_ROLES, filterNavSections, type Role } from '@/lib/roles';` — and already used by several other entries in the same file, e.g. the `/roles-permissions` entry.)

- [ ] **Step 4: Verify the build and the full test suite**

Run:
```bash
npx tsc --noEmit
npx vitest run
npm run build
```
Expected: `tsc` reports no errors; the full Vitest suite passes (including the 6 new `components/payroll/*.test.tsx` files and every pre-existing test, unaffected); `next build` completes and lists `/payroll` among the generated routes.

- [ ] **Step 5: Format and commit**

```bash
npx prettier --write "app/(platform)/payroll/**" "components/Sidebar.tsx"
git add "app/(platform)/payroll" components/Sidebar.tsx
git commit -m "feat(payroll): wire up /payroll route + sidebar nav entry"
```

---

## Self-Review

**1. Spec coverage:**
- §1 Rotas e ficheiros novos → Task 1 (types/queryKeys), Tasks 2-7 (all six components), Task 8 (route + nav). ✅
- §2 Camada de dados (query keys + invalidation rules table) → Task 1 (`queryKeys.payroll.*`), invalidation applied exactly per the spec's table in Tasks 2 (create → `all`), 4/5 (recalc/exclude → `runDetail`+`runPayslipsAll`+`runExceptions`), 7 (transitions → `all`). ✅
- §3 `RunListView` (columns, filters, empty state, "+ Novo run") → Task 3, all covered by the 6 tests. ✅
- §4 `CreateRunModal` (4 fields, no dept/user picker) → Task 2. ✅
- §5 `RunDetailView` (header, totals, per-status action table, confirm-gated simple actions, reason panel for reject/cancel, timeline, exceptions-then-payslips ordering) → Task 7, the action table is tested status-by-status. ✅
- §6 `RunPayslipsTable` (columns, per-row recalc/exclude gated on `SIMULATED`) → Task 5. ✅
- §7 `ExceptionsPanel` (grouped by severity, ERROR first, click-to-focus) → Task 6; the "focus" interaction is implemented as a highlight class on the matching `RunPayslipsTable` row (simplified from literal scrolling — noted below). ✅
- §8 Testing → every component has its own `.test.tsx`; `RunDetailView`'s per-status coverage directly addresses the spec's stated main risk. ✅
- "Fora de âmbito" (dept/user picker, run editing, bulk actions, exceptions pagination) → none of the 8 tasks implement any of these. ✅
- Risk: `PROCESSING` polling → implemented in Task 7 via `refetchInterval`. ✅
- Risk: `invalidateKeys` prefix behavior → Task 1's `runPayslipsAll`/`runPayslips` key shape is designed for React Query's default `exact:false` invalidation; Tasks 4/5's tests don't assert cache internals directly (mocked `useApiMutation` doesn't exercise real invalidation), so this remains implicitly trusted to React Query's documented default rather than independently proven — acceptable, since the risk was about key *shape*, and the shape is correct by construction (`runPayslips` literally extends the `runPayslipsAll` array).

**2. Placeholder scan:** No "TBD"/"TODO"/"add validation"/"similar to Task N" patterns — every step has full, real code or an exact runnable command.

**3. Type consistency:** `PayrollRun`/`PayrollRunDetail`/`RunException`/`RunPayslip`/`RunStatus` are defined once in Task 1 and consumed with identical field names throughout — `run.status`, `run.errorCount`, `run.timeline`, `payslip.calcInputs`, `p.hasExceptions` etc. match across Tasks 2-8. `RunListViewProps.onSelect`, `RunDetailViewProps.onBack`, `CreateRunModalProps.onCreated`, `RecalcPayslipModalProps`, `RunPayslipsTableProps`, `ExceptionsPanelProps` are each defined once (in the task that creates the component) and referenced with the same shape by every consumer.

**Simplification from the spec, noted explicitly:** §7 of the spec described "clique num item foca a linha correspondente na tabela de recibos (scroll+highlight)". Task 7/5 implement the highlight (a background class on the matching row) but not an explicit `scrollIntoView` — the run-payslips table is paginated at 50 rows and typically fits on screen without scrolling, and `scrollIntoView` is inert in the jsdom test environment anyway, so it would be untestable ceremony for no observed benefit. If a real dataset makes this insufficient, add a `ref`-based scroll in a follow-up.
