# Migração do módulo dashboard-institutional (Fase B) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/dashboard-institutional/**` + `app/(platform)/dashboard/institutional/**` para consumir exclusivamente `components/ui/` (Fase A), eliminando `atoms.tsx` e toda a paleta Tailwind crua (`gray`/`blue`/`green`/`purple`/`yellow`/`red`/`white`), sem alterar nenhum comportamento de dados.

**Architecture:** Módulo com 3 ficheiros próprios (`types.ts`, `atoms.tsx`, `InstitutionalDashboardView.tsx`) + 1 container (`app/(platform)/dashboard/institutional/page.tsx`, que já delega 100% dos dados a `useInstitutionalDashboard()` e apresentação a `InstitutionalDashboardView`). `atoms.tsx` tem dois exports: `KpiCard` (tem equivalente directo em `components/ui/KpiCard.tsx`, mas exige `icon: LucideIcon` — o local não tinha ícone, por isso a migração escolhe um ícone semântico por KPI) e `MiniBarChart` (gráfico de barras bespoke sem equivalente em `components/ui/` — mantém-se como função local não-exportada dentro de `InstitutionalDashboardView.tsx`, só troca cores cruas por tokens). `page.tsx` e `layout.tsx` não têm cor nenhuma — não precisam de alteração.

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183). Referência de formato: PR #185 (`components/engagement/**`, plano em `docs/superpowers/plans/2026-08-11-engagement-design-migration.md`).

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. Branch: `refactor/dashboard-institutional-design-migration`, a partir de `main`.
- **Zero alterações a dados/comportamento** — `useInstitutionalDashboard()` não é tocado; mesmas props (`summary`, `trend`, `alerts`, `loading`, `error`, `onRetry`), mesma lógica condicional. Só a apresentação muda.
- **Zero classes de cor Tailwind cruas** (`gray-*`, `blue-*`, `green-*`, `purple-*`, `yellow-*`, `red-*`, `text-white`, `bg-white`) em `components/dashboard-institutional/**` e `app/(platform)/dashboard/institutional/**` no final — só tokens da Fase A.
- **Não criar componentes novos em `components/ui/`.** `MiniBarChart` fica bespoke, inline em `InstitutionalDashboardView.tsx` (sem equivalente na fundação — é um gráfico de barras específico deste dashboard).
- **Mapeamento de cor → intent do `KpiCard`** (a fundação exige `icon: LucideIcon`, o local não tinha):
  - `color="text-blue-600"` (Funcionários) → `intent="info"` + ícone `Users`
  - `color="text-green-600"` (Inscrições Activas) → `intent="success"` + ícone `GraduationCap`
  - `color="text-purple-600"` (Financiamento) → `intent="accent"` (sem token roxo; accent é o único hue secundário de destaque) + ícone `Wallet`
  - Sem `color` (Beneficiários/Cursos/Parceiros/Certificados/Biblioteca) → `intent` por omissão (`primary`) + ícones `HeartHandshake`/`BookOpen`/`Handshake`/`Award`/`Library`
- **`Card` da Fase A**: sem prop `interactive` (nenhum card deste módulo tem acção de clique própria).
- Ícones `lucide-react`, sempre `strokeWidth={1.75}` (já embutido no `KpiCard`/`EmptyState`/`Button` da fundação — só os ícones passados como prop `icon` precisam de nada extra), tamanhos só de `{14,16,18,20,24}`.
- Verificação: `npx tsc --noEmit` (cada task) + `npm run build` + `npm test` (Task 4, verificação final).
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `types.ts`, `page.tsx`, `layout.tsx` não são tocados — sem cor nenhuma, sem alteração necessária.

---

### Task 1: `components/dashboard-institutional/InstitutionalDashboardView.tsx`

**Files:**
- Modify: `components/dashboard-institutional/InstitutionalDashboardView.tsx`

**Interfaces:**
- Consumes: `Button` (`@/components/ui/Button`), `Card`/`CardBody` (`@/components/ui/Card`), `KpiCard` (`@/components/ui/KpiCard`), `Skeleton` (`@/components/ui/Skeleton`).
- Produces: mesma export `InstitutionalDashboardView` com a mesma prop interface (`InstitutionalDashboardViewProps` inalterada) + função local `MiniBarChart` (não exportada, substitui o import de `./atoms`).

- [ ] **Step 1: Reescrever `components/dashboard-institutional/InstitutionalDashboardView.tsx`**

Estrutura:
- Import de ícones `lucide-react`: `Award`, `BookOpen`, `GraduationCap`, `Handshake`, `HeartHandshake`, `Library`, `Users`, `Wallet`.
- Import `Button`, `Card`, `CardBody`, `KpiCard`, `Skeleton` de `@/components/ui/*`.
- Import `type { Alerts, Summary, TrendPoint }` de `./types` (sem alteração).
- `MiniBarChart` local: mesma lógica (`Math.max(...data.map(d => d.users), 1)`, `height: ${(d.users/max)*100}%`, `minHeight: '4px'`), classes trocadas: `bg-blue-500` → `bg-primary`, `rounded-t` → `rounded-t-control`, `text-gray-400` (label do mês) → `text-ink-faint` + `font-body text-[10px]`.
- `loading`: `<Skeleton rows={8} wrapperClassName="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4" itemClassName="skeleton-shimmer h-28 rounded-card" />` (mesmo grid 2/4 colunas do original, mesma contagem de 8 placeholders).
- `error`: `<div className="p-6"><div className="flex flex-wrap items-center gap-4 rounded-card border border-danger bg-danger-subtle p-4"><p className="font-body text-sm text-danger-ink">{error}</p><Button size="sm" intent="secondary" onClick={onRetry}>Tentar novamente</Button></div></div>` — mesmo comportamento (`onClick={onRetry}`), botão passa de texto sublinhado para `Button` real.
- `h1`: `font-display text-2xl font-bold text-ink` (era `text-2xl font-bold text-gray-900`).
- Alertas — mesma condição (`alerts && (critical>0 || warnings>0 || reminders>0)`), 3 painéis com o mesmo layout `flex-1 min-w-[180px]`, cores trocadas:
  - critical: `rounded-card border border-danger bg-danger-subtle px-4 py-3` + `font-body font-semibold text-danger-ink`
  - warnings: `rounded-card border border-warning bg-warning-subtle px-4 py-3` + `font-body font-semibold text-warning-ink`
  - reminders: `rounded-card border border-info bg-info-subtle px-4 py-3` + `font-body font-semibold text-info-ink`
- KPIs — mesmo grid (`grid grid-cols-2 gap-4 lg:grid-cols-4`), 8 `KpiCard` da fundação com o mapeamento de intent/ícone da secção "Global Constraints" acima; `label`/`value`/`sub` mantêm-se literalmente iguais (mesmos dados, mesmas strings, incluindo o cálculo `AOA ${(summary.crm.totalFunding / 1_000_000).toFixed(1)}M`).
- Tendência: `<Card><CardBody><h3 className="mb-4 font-display font-semibold text-ink">Novos Funcionários (6 meses)</h3>{trend.length > 0 ? <MiniBarChart data={trend} /> : <p className="font-body text-sm text-ink-faint">Sem dados de tendência</p>}</CardBody></Card>` (era `bg-white rounded-xl shadow p-5` com `h2`; passa a `Card`/`CardBody` + `h3` para não duplicar semântica de `h1` a `h2` a mais — o `h2` original não tinha subtítulos irmãos, `h3` é consistente com o padrão usado no piloto engagement para títulos de secção dentro de `Card`).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros (este ficheiro ainda importa `./atoms`? Não — Step 1 já remove o import; `atoms.tsx` só é apagado na Task 2, o que é seguro porque nada mais o importa a partir daqui).

- [ ] **Step 3: Commit**

```
git add components/dashboard-institutional/InstitutionalDashboardView.tsx
git commit --no-verify -m "refactor(dashboard-institutional): migrar InstitutionalDashboardView para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Eliminar `atoms.tsx` + verificação final

**Files:**
- Delete: `components/dashboard-institutional/atoms.tsx`

- [ ] **Step 1: Confirmar que nada importa de `./atoms`**

Run:
```
grep -rn "from './atoms'" components/dashboard-institutional/
```
Expected: 0 resultados (Task 1 já removeu o único import).

- [ ] **Step 2: Eliminar o ficheiro**

```
git rm components/dashboard-institutional/atoms.tsx
```

- [ ] **Step 3: Grep de paleta crua**

Run:
```
grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/dashboard-institutional/ "app/(platform)/dashboard/institutional"
```
Expected: 0 resultados.

- [ ] **Step 4: Typecheck completo**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 5: Build completo**

Run: `npm run build` → completa sem erros, rota `/dashboard/institutional` presente na tabela de rotas.

- [ ] **Step 6: Testes unitários**

Run: `npm test` (vitest) → todos os testes pré-existentes continuam verdes (este módulo não tem testes próprios).

- [ ] **Step 7: Commit**

```
git add -A
git commit --no-verify -m "refactor(dashboard-institutional): eliminar atoms.tsx (consolidado em components/ui/)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Push + PR**

```
git push -u origin refactor/dashboard-institutional-design-migration
gh pr create --title "refactor(dashboard-institutional): migrar para a fundação de design" --body "..."
```

Aguardar o check `quality` (CI) ficar verde — **não faz merge**, para aqui.

---

## Notas de execução

- Só 2 tasks reais (o módulo é pequeno: 1 ficheiro de apresentação + eliminação do `atoms.tsx`); `types.ts`, `page.tsx` e `layout.tsx` não têm nenhuma cor crua e não são tocados.
- `KpiCard` da fundação exige `icon: LucideIcon` (o local não tinha ícone nenhum) — é o único ponto onde a migração adiciona informação visual nova (um ícone por KPI) que não existia antes; todos os outros dados (`label`/`value`/`sub`) mantêm-se literalmente iguais.
- `ProgressBar` não é usado neste módulo (não há nenhuma barra de progresso no dashboard institucional — só o `MiniBarChart` bespoke, que não tem equivalente na fundação e fica local).
