# Migração do módulo notifications (Fase B, Vaga 1) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/notifications/**` + `app/(platform)/notifications/page.tsx` para consumir exclusivamente `components/ui/` (Fase A), eliminando toda a paleta Tailwind crua (~48 ocorrências em `components/notifications/`, +32 em `page.tsx`), sem alterar nenhum comportamento de dados/filtros. `components/notifications/types.ts` e `app/(platform)/notifications/layout.tsx` não têm cor nenhuma — não são tocados.

Nota: não foi encontrado `docs/superpowers/plans/2026-08-13-design-system-rollout-fase-b.md` no repositório (branch nem histórico) — este plano segue a recipe genérica inferida do piloto já mergeado, `docs/superpowers/plans/2026-08-11-engagement-design-migration.md` / `components/engagement/**` (PR #185), único precedente real disponível.

**Architecture:** Módulo já separado em apresentação (`AdminView.tsx`, `InboxView.tsx`) + partilhado (`shared.tsx`: `CATEGORY_CFG`/`Skeleton`) + container (`app/(platform)/notifications/page.tsx`, que também contém `PreferencesView`/`AdminView`/`InboxView` locais que só orquestram hooks + delegam apresentação). `shared.tsx` migra primeiro (consumido por `AdminView`/`InboxView`/`PreferencesView`).

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183).

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend` (worktree isolado). Branch: a partir de `main`.
- **Zero alterações a dados/comportamento** — mesmos endpoints, mesmos `queryKeys`, mesma lógica de filtros (`category`/`readFilter`/`disabledCategories`/etc.). Cuidado especial: não tocar em `hooks/useNotificationsInbox.ts` / `hooks/useNotificationsAdmin.ts` (fora do escopo) nem na lógica de `unread`/booleans.
- **Zero classes Tailwind cruas** em `components/notifications/**` e `app/(platform)/notifications/**` no final.
- **Não criar componentes novos.** Onde não há primitivo Fase A exacto (selector de categoria nativo, selects de hora, interruptor de canal on/off, chips de categoria silenciada), mantém-se a estrutura bespoke actual, só troca tokens de cor/forma (mesmo padrão do `MoodCheckin`/checkbox nativo no piloto).
- **`Card`**: sem prop `interactive` (nenhum destes cards tem `onClick` próprio).
- **`ProgressBar`**: não usado neste módulo (não há barras de progresso).
- Ícones `lucide-react`: `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}` (não aplicável onde o ícone é emoji — mantém-se emoji, não são cor Tailwind).
- Verificação: `npx tsc --noEmit` a cada task; `npm run build` + `npm test` só na task final.
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

### Task 1: `components/notifications/shared.tsx`

- [ ] Reescrever `CATEGORY_CFG[*].cls` de classes cruas (`bg-blue-50 text-blue-700`, etc.) para combos de tokens semânticos (`bg-info-subtle text-info-ink`, `bg-primary-subtle text-primary`, `bg-warning-subtle text-warning-ink`, `bg-success-subtle text-success-ink`, `bg-danger-subtle text-danger-ink`, `bg-accent-subtle text-accent`, `bg-surface-sunken text-ink-muted`).
- [ ] `Skeleton` local: `itemClassName` de `h-16 bg-gray-100 rounded-xl` para `h-16 bg-surface-sunken rounded-card`.
- [ ] Typecheck, commit.

### Task 2: `components/notifications/InboxView.tsx`

- [ ] `PRIORITY_CFG` para tokens (`text-ink-faint`/`border-border`, `text-info`/`border-info-subtle`, `text-warning`/`border-warning-subtle`, `text-danger`/`border-danger`).
- [ ] `NotifItem`: linha (`border-border`, `hover:bg-surface-sunken`, unread tint `bg-primary-subtle/40`, borda esquerda crítica `border-l-danger`), título/mensagem (`text-ink`/`text-ink-muted`/`text-ink-faint`), dot de não-lida `bg-primary`, tag de categoria (`rounded-pill`, `catCfg.cls` já tokenizado), link de acção `text-primary hover:underline`, acções hover `text-primary hover:text-primary-hover` / `text-ink-faint hover:text-ink-muted`.
- [ ] Toolbar: `<select>` de categoria mantém-se nativo, restilizado como `Input`/`Select` trigger (`rounded-control border-[1.5px] border-border-strong bg-surface … focus:border-accent focus:ring-accent-subtle`); filtro de lidas (`all/unread/read`) passa a usar `Button` (`intent="primary"` activo / `intent="ghost"` inactivo, `size="sm"`) dentro de um wrapper `bg-surface-sunken p-1 rounded-control` (mesmo padrão do `SurveysTab`/`FeedbackTab` do piloto); "Marcar todas como lidas" mantém-se link bespoke (`text-primary hover:text-primary-hover`).
- [ ] Lista: wrapper `Card` (sem `interactive`) em vez de `bg-white border border-gray-200 rounded-xl`; cabeçalhos de grupo (`Hoje`/`Ontem`/…) tokenizados; estado vazio via `EmptyState` (`icon={Bell}`).
- [ ] Typecheck, commit.

### Task 3: `components/notifications/AdminView.tsx`

- [ ] 4 stats (`Total enviadas`/`Lidas`/`Não lidas`/`Taxa de abertura`) passam a `KpiCard` (ícones lucide `Send`/`CheckCircle2`/`BellRing`/`Percent`; intent `primary`/`success`/`unread>100 ? 'danger':'warning'`/`info` — preserva a condição original `stats.unread > 100`).
- [ ] "Por categoria": wrapper `Card`, cabeçalho tokenizado, linhas tokenizadas, contagem em `font-data` (não `font-mono`).
- [ ] "Enviar a todos": wrapper `Card`; título/mensagem via `Input`/`Textarea`; botão via `Button` (`className="w-full"`, `disabled={sending}`, texto condicional mantido).
- [ ] Typecheck, commit.

### Task 4: `app/(platform)/notifications/page.tsx`

- [ ] Badge de não-lidas junto ao `<h1>`: tokens (`bg-primary text-canvas rounded-pill`).
- [ ] Navegação de vistas (`inbox`/`preferences`/`admin`) migra para `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (Radix, controlado por `view`/`setView`, mesmo padrão do piloto `app/(platform)/engagement/page.tsx`); badge de não-lidas no trigger do inbox mantém-se.
- [ ] `PreferencesView`: os 4 blocos (`bg-white border border-gray-200 rounded-xl p-5`) passam a `<Card className="p-5">`; toggles de canal mantêm-se bespoke (sem `Switch` na Fase A) só com tokens (`bg-primary`/`bg-border-strong`, `rounded-pill`); selects de hora mantêm-se nativos, restilizados; chips de digest via `Button` (`primary`/`ghost`); chips de categorias silenciadas mantêm-se bespoke tokenizados (`bg-danger-subtle text-danger-ink line-through` vs `bg-surface-sunken text-ink-muted`); botão guardar via `Button` (estado "guardado" via `className` `bg-success`).
- [ ] Typecheck, commit.

### Task 5: Verificação final

- [ ] `npx tsc --noEmit` → sem erros.
- [ ] Grep de paleta crua em `components/notifications/` e `app/(platform)/notifications` → 0 resultados.
- [ ] `npm run build` → sem erros.
- [ ] `npm test` → verde.
- [ ] Commit final (se sobrar algo), push, `gh pr create`.

---

## Notas de execução

- Task 1 é pré-requisito de 2 e 3 (ambas importam `CATEGORY_CFG`/`Skeleton` de `shared.tsx`). Task 4 (page.tsx) importa `InboxView`/`AdminView`/`shared` já migrados — corre por último entre as tasks de conteúdo.
- Nenhuma task toca `types.ts`, `layout.tsx`, `hooks/useNotificationsInbox.ts`, `hooks/useNotificationsAdmin.ts` — só JSX/className dos 4 ficheiros listados.
