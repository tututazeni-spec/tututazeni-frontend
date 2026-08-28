# Shared Pagination Component — Design Spec

**Date:** 2026-08-22
**Repo:** `tututazeni-frontend` (branch `refactor/shared-pagination-component`)
**Status:** Approved by user, phase = build + pilot

## Problem

Pagination is implemented ad hoc in ~25+ files across the frontend, in at
least three divergent patterns:

1. **Numeric window** (`components/employees/Pagination.tsx`) — the only
   dedicated component in the repo today. Already uses design-system tokens.
2. **Prev/next with page count text** — the majority pattern (e.g.
   `components/history/TimelineTab.tsx`, `components/courses/CatalogView.tsx`,
   `components/users/UserListView.tsx`), implemented inline per file.
3. **Broken** — `components/acl/AuditTab.tsx` renders a static "Pág. 1 / N"
   label with no `page` state and no controls at all. Page 2+ of the ACL
   audit log is permanently unreachable today.

There is no pagination primitive in `components/ui/` (the design-system
foundation). This is the gap this spec closes.

## Decisions (from brainstorming)

- **Phase scope:** build the shared component + pilot on two modules, not a
  full migration of all ~25 call sites. Mirrors the established Phase B
  pilot pattern used for the rest of the design system.
- **Canonical visual style:** numeric page-window with arrows (matches
  `employees/Pagination.tsx`, chosen over the plainer prev/next-with-count
  text style).
- **`AuditTab.tsx`'s broken pagination is fixed as part of this pass**,
  not deferred as a separate ticket.

## Architecture

Promote `components/employees/Pagination.tsx` to
`components/ui/Pagination.tsx`. This is a move, not a rewrite — the existing
implementation already uses design-system tokens (`rounded-control`,
`border-border`, `bg-primary`, `text-canvas`, `shadow-resting`,
`text-ink-muted`) and the agreed canonical style. `components/employees/`
loses its local copy; `app/(platform)/employees/page.tsx` repoints its
import. No new dependencies.

## Component API

Stays presentational — no data fetching, no knowledge of `meta`/`total`/
filter objects. This is deliberate: hook response shapes are inconsistent
across the codebase (some nest pagination metadata under `meta: {page,
total, totalPages}`, others expose `total`/`totalPages` at the top level of
the response). Normalizing that is a separate, larger problem and is
explicitly out of scope here.

```tsx
export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps)
```

Renders `null` when `totalPages <= 1` (unchanged from today). Internal
window logic (5-page slide, boundary clamping) is unchanged from
`employees/Pagination.tsx`. The only API change from the current component
is the prop rename `onPage` → `onPageChange`, for consistency with the rest
of the design system's `on<Event>` naming.

## Pilot 1 — `components/acl/AuditTab.tsx` (fixes the real bug)

Distinct from the unrelated `components/history/AuditTab.tsx` (audit
stats/upcoming widgets — not touched by this work).

Current state: `useApiQuery<AclAuditResponse>(queryKeys.acl.audit(view),
view === 'denied' ? '/acl/audit/denied' : '/acl/audit', { staleTime:
STALE_TIME.DYNAMIC })` — no `page` state, no `params`, static "Pág. 1 / N"
text.

Backend already supports pagination: `AclAuditFilterDto extends
BaseFilterDto` on both `GET /acl/audit` and `GET /acl/audit/denied` (see
`src/acl/acl.controller.ts`, `src/acl/acl.dto.ts` in the backend repo). No
backend change needed — the frontend has simply never sent a `page` param.

Changes:
- Add `const [page, setPage] = useState(1)`.
- Reset `page` to 1 when `view` changes (switching between "all"/"denied"
  must not strand the user on a page number that may not exist in the new
  list).
- Pass `{ params: { page }, staleTime: STALE_TIME.DYNAMIC }` to
  `useApiQuery`.
- Add `page` to the query key: `queryKeys.acl.audit(view)` → `queryKeys.acl.audit(view, page)`,
  updating the key definition in `lib/queryKeys.ts` accordingly. Without
  this, React Query treats every page as the same cache entry under the
  current `(view)`-only key.
- Replace the static "Pág. 1 / N" text with
  `<Pagination page={page} totalPages={data?.meta?.totalPages ?? 1} onPageChange={setPage} />`.

## Pilot 2 — `components/history/TimelineTab.tsx` (proves migration from the prev/next pattern)

Already has working `page` state and a filter object driving the query.
Only the JSX changes: the manual prev/next buttons and "`{page} /
{data.meta.totalPages}`" text are replaced with `<Pagination page={page}
totalPages={data.meta.totalPages} onPageChange={setPage} />`. No change to
data-fetching, filters, or error/loading handling. This pilot validates the
swap for the pattern shared by the majority of the remaining ~23 candidate
files (courses, users, content-library, live-classes, etc.), as opposed to
Pilot 1's "was actually broken" case.

## Testing

- New `components/ui/Pagination.test.tsx` (no test file exists for the
  component today, under either its old or new location). Covers:
  - hides when `totalPages <= 1`
  - correct 5-page window at low/mid/high page positions
  - prev/next disabled at boundaries (`page === 1`, `page === totalPages`)
  - `onPageChange` called with the correct absolute page number, both from
    numbered buttons and from the prev/next arrows
- `AuditTab.tsx` and `TimelineTab.tsx` have no existing test files; none are
  added as part of this pass beyond what the pilots themselves exercise
  manually. If broader test coverage for these two components is wanted,
  that's a separate decision, not implied by this migration.

## Explicitly out of scope

- Migrating the remaining ~23 pagination call sites (deferred to a
  follow-up decision after this pilot lands).
- Normalizing the `meta.totalPages` vs. top-level `totalPages` response
  shape inconsistency across hooks.
- Any change to `components/history/AuditTab.tsx` (the unrelated
  stats/upcoming component).
