# Shared Pagination Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote `components/employees/Pagination.tsx` into the shared design-system foundation as `components/ui/Pagination.tsx` (renaming `onPage` → `onPageChange`), then pilot it on two consumers: fixing the genuinely broken pagination in `components/acl/AuditTab.tsx`, and migrating `components/history/TimelineTab.tsx` off its inline prev/next JSX.

**Architecture:** This is a move-and-rename, not a rewrite — `employees/Pagination.tsx`'s implementation, visual style, and design tokens are already correct and become the canonical `components/ui/Pagination.tsx`. Component-testing infrastructure (Vitest + jsdom + Testing Library) does not exist in this repo yet and is added first, since the new component needs a real render/interaction test. The two pilot migrations then each touch exactly one consumer file (plus one query-key signature change for the AuditTab fix) and prove the swap works for both the "was broken" case and the "already working, just inline" case.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Vitest 4.1.10, `@tanstack/react-query` 5.90.21, Tailwind (design-system tokens in `lib/cn.ts`).

**Spec:** `docs/superpowers/specs/2026-08-22-shared-pagination-component-design.md`

## Global Constraints

- Component API is fixed by the spec: `{ page: number; totalPages: number; onPageChange: (page: number) => void }` — presentational only, no data fetching, no knowledge of `meta`/`total`/filter objects.
- Renders `null` when `totalPages <= 1` (unchanged behavior from `employees/Pagination.tsx`).
- Internal 5-page sliding window / boundary-clamping logic is unchanged from `employees/Pagination.tsx` — only the `onPage` → `onPageChange` prop rename is new.
- No backend changes — `AclAuditFilterDto extends BaseFilterDto` on both `GET /acl/audit` and `GET /acl/audit/denied` already accepts `page`.
- Scope is exactly: the new component + its test, `employees/page.tsx`'s import, `AuditTab.tsx`'s fix, `TimelineTab.tsx`'s migration. The remaining ~23 pagination call sites and the `meta.totalPages` vs. top-level `totalPages` shape inconsistency are explicitly out of scope.
- `components/history/AuditTab.tsx` (the unrelated stats/upcoming widget) is not touched.
- No new tests are added for `AuditTab.tsx` or `TimelineTab.tsx` beyond the existing pattern (neither has a test file today) — only `components/ui/Pagination.tsx` gets a test file, per spec.

---

## File Structure

| File | Responsibility |
|---|---|
| `vitest.config.ts` (modify) | Add jsdom environment + React/tsconfig-paths plugins so component tests can render JSX and resolve `@/*` imports. |
| `vitest.setup.ts` (create) | Registers `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toBeDisabled`, ...) globally. |
| `components/ui/Pagination.tsx` (create) | The promoted shared pagination component. |
| `components/ui/Pagination.test.tsx` (create) | Render/interaction tests for the component. |
| `components/employees/Pagination.tsx` (delete) | Superseded by `components/ui/Pagination.tsx`. |
| `app/(platform)/employees/page.tsx` (modify) | Repoint import, rename prop usage. |
| `lib/queryKeys.ts` (modify) | `queryKeys.acl.audit` gains a `page` parameter so each page gets its own cache entry. |
| `components/acl/AuditTab.tsx` (modify) | Add `page` state, pass `params`/updated key to `useApiQuery`, render `<Pagination />` instead of static text. |
| `components/history/TimelineTab.tsx` (modify) | Swap manual prev/next JSX block for `<Pagination />`. |

---

### Task 1: Add component-testing infrastructure

**Files:**
- Modify: `package.json`
- Modify: `vitest.config.ts`
- Create: `vitest.setup.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working `render`/`screen`/`fireEvent` test environment for any `*.test.tsx` file under this repo, with `@/*` imports resolving and `jest-dom` matchers available globally. Task 2 depends on this.

This task has no new application behavior to drive with a red/green cycle — its "test" is that the **existing** 4 pure-logic test files still pass unchanged after the config change, proving the new jsdom environment and plugins don't regress anything.

- [ ] **Step 1: Install the new devDependencies**

Run:
```bash
npm install --save-dev @testing-library/react@16.3.2 @testing-library/jest-dom@7.0.1 jsdom@30.0.1 @vitejs/plugin-react@6.1.0 vite-tsconfig-paths@6.1.1
```

Expected: `package.json`'s `devDependencies` gains these 5 entries; `package-lock.json` updates.

- [ ] **Step 2: Create the jest-dom matcher setup file**

```typescript
// vitest.setup.ts
// Regista os matchers do @testing-library/jest-dom (toBeInTheDocument,
// toBeDisabled, etc.) globalmente para todos os testes de componentes.
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Update vitest.config.ts to add jsdom + plugins**

Current content:
```typescript
import { defineConfig } from 'vitest/config';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
```

Replace with:
```typescript
import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
});
```

- [ ] **Step 4: Run the existing test suite to confirm no regression**

Run: `npm test`
Expected: PASS — the same 4 existing files (`lib/format.test.ts`, `lib/roles.test.ts`, `lib/statusBadge.test.ts`, `lib/validation.test.ts`) still pass under the new jsdom environment and plugin config. No new test files exist yet, so total test count is unchanged from before this task.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore(test): add component-testing infra (jsdom, Testing Library, tsconfig-paths)"
```

---

### Task 2: Create the shared Pagination component

**Files:**
- Create: `components/ui/Pagination.tsx`
- Test: `components/ui/Pagination.test.tsx`

**Interfaces:**
- Consumes: jsdom/Testing Library environment from Task 1.
- Produces: `export interface PaginationProps { page: number; totalPages: number; onPageChange: (page: number) => void }` and `export function Pagination(props: PaginationProps): JSX.Element | null` from `components/ui/Pagination.tsx`, imported elsewhere as `import { Pagination } from '@/components/ui/Pagination'`. Tasks 3, 4, and 5 depend on this exact export.

- [ ] **Step 1: Write the failing test file**

```tsx
// components/ui/Pagination.test.tsx
import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  test('não renderiza nada quando totalPages <= 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('mostra a janela de 5 páginas a partir da página 1 (extremo baixo)', () => {
    render(<Pagination page={1} totalPages={10} onPageChange={vi.fn()} />);
    ['1', '2', '3', '4', '5'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: '6' }),
    ).not.toBeInTheDocument();
  });

  test('mostra a janela de 5 páginas centrada numa página intermédia', () => {
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);
    ['3', '4', '5', '6', '7'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  test('mostra a janela de 5 páginas junto ao extremo alto', () => {
    render(<Pagination page={10} totalPages={10} onPageChange={vi.fn()} />);
    ['6', '7', '8', '9', '10'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  test('desactiva a seta "anterior" na página 1', () => {
    render(<Pagination page={1} totalPages={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '←' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '→' })).not.toBeDisabled();
  });

  test('desactiva a seta "seguinte" na última página', () => {
    render(<Pagination page={10} totalPages={10} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '→' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '←' })).not.toBeDisabled();
  });

  test('chama onPageChange com o número correcto ao clicar num botão numerado', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={5} totalPages={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(onPageChange).toHaveBeenCalledWith(7);
  });

  test('chama onPageChange com page - 1 ao clicar na seta "anterior"', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={5} totalPages={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '←' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  test('chama onPageChange com page + 1 ao clicar na seta "seguinte"', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination page={5} totalPages={10} onPageChange={onPageChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '→' }));
    expect(onPageChange).toHaveBeenCalledWith(6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run components/ui/Pagination.test.tsx`
Expected: FAIL — `Cannot find module './Pagination'` (the component doesn't exist yet).

- [ ] **Step 3: Create the component**

```tsx
// components/ui/Pagination.tsx
// Paginação numérica com janela deslizante de 5 páginas. Promovido de
// components/employees/Pagination.tsx para a fundação de design
// (components/ui/) como o primitivo de paginação partilhado — ver
// docs/superpowers/specs/2026-08-22-shared-pagination-component-design.md.

import { cn } from '@/lib/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded-control border border-border hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'w-9 h-9 text-sm rounded-control transition-colors font-medium',
            p === page
              ? 'bg-primary text-canvas shadow-resting'
              : 'border border-border hover:bg-surface-sunken text-ink-muted',
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded-control border border-border hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run components/ui/Pagination.test.tsx`
Expected: PASS — all 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Pagination.tsx components/ui/Pagination.test.tsx
git commit -m "feat(ui): add shared Pagination component"
```

---

### Task 3: Repoint employees page to the shared component

**Files:**
- Modify: `app/(platform)/employees/page.tsx`
- Delete: `components/employees/Pagination.tsx`

**Interfaces:**
- Consumes: `Pagination`/`PaginationProps` from Task 2 (`components/ui/Pagination.tsx`).
- Produces: nothing new — this is the first real consumer switch, proving the import move is safe.

- [ ] **Step 1: Update the import in employees/page.tsx**

Current (line 55):
```tsx
import { Pagination } from '@/components/employees/Pagination';
```

Replace with:
```tsx
import { Pagination } from '@/components/ui/Pagination';
```

- [ ] **Step 2: Rename the onPage prop to onPageChange**

Current (around lines 415-422):
```tsx
        {/* ── Pagination */}
        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPage={setPage}
          />
        )}
```

Replace with:
```tsx
        {/* ── Pagination */}
        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        )}
```

- [ ] **Step 3: Delete the old local component**

Run:
```bash
git rm components/employees/Pagination.tsx
```

- [ ] **Step 4: Verify no remaining references and the build type-checks**

Run:
```bash
grep -rn "components/employees/Pagination" --include="*.ts*" .
npx tsc --noEmit
npm test
```
Expected: the grep returns no matches; `tsc --noEmit` passes with no errors; `npm test` still passes (existing 4 files + the 9 new `Pagination.test.tsx` tests).

- [ ] **Step 5: Commit**

```bash
git add "app/(platform)/employees/page.tsx"
git commit -m "refactor(employees): use shared components/ui/Pagination, remove local copy"
```

---

### Task 4: Fix the broken pagination in AuditTab.tsx

**Files:**
- Modify: `lib/queryKeys.ts`
- Modify: `components/acl/AuditTab.tsx`

**Interfaces:**
- Consumes: `Pagination`/`PaginationProps` from Task 2.
- Produces: `queryKeys.acl.audit(view: string, page: number)` — the new two-argument signature other code must use if it ever calls this key (currently `AuditTab.tsx` is the only caller, confirmed by repo-wide grep).

- [ ] **Step 1: Add page to the acl.audit query key**

Current (`lib/queryKeys.ts`, in the `acl` section):
```typescript
    audit: (view: string) => [...queryKeys.acl.all, 'audit', view] as const,
```

Replace with:
```typescript
    audit: (view: string, page: number) =>
      [...queryKeys.acl.all, 'audit', view, page] as const,
```

- [ ] **Step 2: Verify no other call site breaks**

Run:
```bash
grep -rn "queryKeys.acl.audit" --include="*.ts*" .
```
Expected: the only match is inside `components/acl/AuditTab.tsx`, which Step 3 below updates in the same task — no other file needs a change.

- [ ] **Step 3: Rewrite AuditTab.tsx to add page state and the shared Pagination component**

Current full file:
```tsx
// components/acl/AuditTab.tsx

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { AclAuditResponse } from './types';

export function AuditTab() {
  const [view, setView] = useState<'all' | 'denied'>('all');
  const { data, isLoading: loading } = useApiQuery<AclAuditResponse>(
    queryKeys.acl.audit(view),
    view === 'denied' ? '/acl/audit/denied' : '/acl/audit',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton rows={3} itemClassName="h-16 bg-surface rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'denied'] as const).map((v) => (
          <Button
            key={v}
            intent={view === v ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setView(v)}
          >
            {v === 'all' ? 'Todas as Alterações' : '🔴 Acessos Negados'}
          </Button>
        ))}
        <span className="self-center ml-auto text-ink-faint text-xs">
          {data?.meta?.total ?? 0} registos
        </span>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
          {(data?.data ?? []).map((log, i) => {
            const changes = log.changes
              ? (() => {
                  try {
                    return JSON.parse(log.changes);
                  } catch {
                    return null;
                  }
                })()
              : null;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full mt-1.5 ${log.action === 'ACCESS_DENIED' ? 'bg-danger' : 'bg-primary'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink text-xs">
                      {log.user?.fullName ?? `User ${log.userId}`}
                    </span>
                    <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-ink-muted text-[10px]">
                      {log.action}
                    </span>
                    {changes?.subject && (
                      <span className="text-ink-faint text-[10px]">
                        {changes.subject}
                      </span>
                    )}
                  </div>
                  {changes?.reason && (
                    <p className="mt-0.5 text-ink-faint text-[10px]">
                      {changes.reason}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-ink-faint text-[10px]">
                  {new Date(log.timestamp).toLocaleString('pt')}
                </span>
              </div>
            );
          })}
          {(data?.data?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-ink-faint">
              <Activity size={32} strokeWidth={1.75} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem registos de auditoria</p>
            </div>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {(data?.meta?.totalPages ?? 0) > 1 && (
        <p className="text-center text-ink-faint text-xs">
          Pág. 1 / {data?.meta?.totalPages} — {data?.meta?.total} registos
          totais
        </p>
      )}
    </div>
  );
}
```

Replace the whole file with:
```tsx
// components/acl/AuditTab.tsx

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import type { AclAuditResponse } from './types';

export function AuditTab() {
  const [view, setView] = useState<'all' | 'denied'>('all');
  const [page, setPage] = useState(1);
  const { data, isLoading: loading } = useApiQuery<AclAuditResponse>(
    queryKeys.acl.audit(view, page),
    view === 'denied' ? '/acl/audit/denied' : '/acl/audit',
    { params: { page }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton rows={3} itemClassName="h-16 bg-surface rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'denied'] as const).map((v) => (
          <Button
            key={v}
            intent={view === v ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setView(v);
              setPage(1);
            }}
          >
            {v === 'all' ? 'Todas as Alterações' : '🔴 Acessos Negados'}
          </Button>
        ))}
        <span className="self-center ml-auto text-ink-faint text-xs">
          {data?.meta?.total ?? 0} registos
        </span>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        <div className="max-h-[500px] divide-y divide-border overflow-y-auto">
          {(data?.data ?? []).map((log, i) => {
            const changes = log.changes
              ? (() => {
                  try {
                    return JSON.parse(log.changes);
                  } catch {
                    return null;
                  }
                })()
              : null;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full mt-1.5 ${log.action === 'ACCESS_DENIED' ? 'bg-danger' : 'bg-primary'}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink text-xs">
                      {log.user?.fullName ?? `User ${log.userId}`}
                    </span>
                    <span className="rounded bg-surface px-1.5 py-0.5 font-mono text-ink-muted text-[10px]">
                      {log.action}
                    </span>
                    {changes?.subject && (
                      <span className="text-ink-faint text-[10px]">
                        {changes.subject}
                      </span>
                    )}
                  </div>
                  {changes?.reason && (
                    <p className="mt-0.5 text-ink-faint text-[10px]">
                      {changes.reason}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-ink-faint text-[10px]">
                  {new Date(log.timestamp).toLocaleString('pt')}
                </span>
              </div>
            );
          })}
          {(data?.data?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-ink-faint">
              <Activity size={32} strokeWidth={1.75} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem registos de auditoria</p>
            </div>
          )}
        </div>
      </Card>

      <Pagination
        page={page}
        totalPages={data?.meta?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify the build and existing suite are unaffected**

Run:
```bash
npx tsc --noEmit
npm test
```
Expected: both pass — `page` is now a real `useState`, sent as a query param, and folded into the cache key so switching pages triggers a real refetch instead of being invisible to React Query.

- [ ] **Step 5: Commit**

```bash
git add lib/queryKeys.ts components/acl/AuditTab.tsx
git commit -m "fix(acl): wire up AuditTab pagination (was static, page 2+ unreachable)"
```

---

### Task 5: Migrate TimelineTab.tsx to the shared component

**Files:**
- Modify: `components/history/TimelineTab.tsx`

**Interfaces:**
- Consumes: `Pagination`/`PaginationProps` from Task 2.
- Produces: nothing new — proves the swap for the majority prev/next-with-count pattern used across the remaining ~23 candidate files.

- [ ] **Step 1: Swap the Button import for a Pagination import**

Current (lines 14-17):
```tsx
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
```

Replace with (alphabetical order, `Button` is no longer used anywhere else in this file):
```tsx
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
```

- [ ] **Step 2: Replace the manual prev/next block with the shared component**

Current (lines 157-180):
```tsx
          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <Button
                intent="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <span className="px-4 py-2 text-sm text-ink-muted">
                {page} / {data.meta.totalPages}
              </span>
              <Button
                intent="secondary"
                size="sm"
                disabled={page === data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima →
              </Button>
            </div>
          )}
```

Replace with:
```tsx
          {/* Pagination */}
          {data && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
```

(`Pagination` already renders `null` when `totalPages <= 1`, so the outer `data.meta.totalPages > 1` guard from the old code is no longer needed — only the `data` presence check remains.)

- [ ] **Step 3: Verify no stray Button usage remains and the build is clean**

Run:
```bash
grep -n "Button" components/history/TimelineTab.tsx
npx tsc --noEmit
npm test
```
Expected: the grep returns no matches (confirming the removed import was safe); `tsc --noEmit` and `npm test` both pass.

- [ ] **Step 4: Commit**

```bash
git add components/history/TimelineTab.tsx
git commit -m "refactor(history): migrate TimelineTab to shared Pagination component"
```

---

## Self-Review

**1. Spec coverage:**
- Component API (prop rename, `null` on `totalPages <= 1`, unchanged window logic) → Task 2. ✅
- "Promote, don't rewrite" architecture → Task 2 (impl copied verbatim except the rename) + Task 3 (old file deleted, import repointed). ✅
- Pilot 1 (`AuditTab.tsx`: `page` state, reset on view change, `params`, query-key with `page`, replace static text) → Task 4, all 4 spec bullet points covered. ✅
- Pilot 2 (`TimelineTab.tsx`: pure JSX swap, no data-fetching change) → Task 5. ✅
- Testing section (`Pagination.test.tsx` covering hide-at-≤1, 5-page window at low/mid/high, boundary-disabled arrows, `onPageChange` called correctly from numbers and arrows) → Task 2, all 4 bullet points covered by the 9 tests. ✅
- "No new tests for AuditTab/TimelineTab" → respected in Tasks 4 and 5 (verification steps use `tsc`/`npm test` regression checks, not new test files). ✅
- Out-of-scope items (remaining ~23 call sites, `meta` shape normalization, `components/history/AuditTab.tsx`) → none of the 5 tasks touch them. ✅

**2. Placeholder scan:** No "TBD"/"TODO"/"add validation"/"similar to Task N" patterns found — every step has full, real code or an exact runnable command.

**3. Type consistency:** `PaginationProps` (`page: number; totalPages: number; onPageChange: (page: number) => void`) is defined once in Task 2 and used identically in Tasks 3, 4, and 5 — no signature drift. `queryKeys.acl.audit` is redefined in Task 4 Step 1 and consumed in Task 4 Step 3 with matching arity `(view, page)`.
