# Migração do módulo engagement (Fase B, piloto) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/engagement/**` + `app/(platform)/engagement/page.tsx` para consumir exclusivamente `components/ui/` (Fase A), eliminando `atoms.tsx` e toda a paleta Tailwind crua (violeta/índigo/slate/amber/emerald/red), sem alterar nenhum comportamento de dados.

**Architecture:** Cada ficheiro do módulo é auto-contido (dados próprios via `useApiQuery`/`useApiMutation` + apresentação) — cada task migra um ficheiro, trocando só a camada visual. `constants.ts` migra primeiro (LEVEL_CONFIG/GRADE_COLOR passam de classes Tailwind cruas para tokens da Fase A), porque `OverviewTab`/`AnalyticsTab` dependem da sua forma nova. `atoms.tsx` só é eliminado depois de todos os consumidores deixarem de o importar.

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183).

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. Branch: `feat/engagement-design-migration`, a partir de `main` (depois de `feat/engagement-design-migration-spec` / PR #184 estar mergeado).
- **Zero alterações a dados/comportamento** — mesmos endpoints, mesmos `queryKeys`, mesmos payloads de mutation, mesma lógica de filtros. Só a apresentação muda.
- **Zero classes de cor Tailwind cruas** (`violet-*`, `indigo-*`, `slate-*`, `amber-*`, `emerald-*`, `red-*`, `teal-*`, `text-white` como cor fixa) em `components/engagement/**` e `app/(platform)/engagement/page.tsx` no final — só tokens da Fase A (`primary`/`accent`/`success`/`warning`/`danger`/`info`/`ink`/`canvas`/`surface`/`border`).
- **Não criar componentes novos.** O gap conhecido (sem `Checkbox` na Fase A) fica como `<input type="checkbox">` nativo com `accent-primary` — não se inventa um `Checkbox` a meio deste piloto.
- **`Card` da Fase A**: usar sem a prop `interactive` nos cards deste módulo (nenhum deles tem acção de clique própria) — `interactive` tem um bug conhecido e já registado (tabIndex/role="button" aplicados mesmo sem `onClick`), não replicar esse padrão aqui.
- **`ProgressBar` da Fase A é mono-cor** (usa sempre `bg-accent`) — onde o design actual usa a cor da barra para comunicar sentido (ex.: promotores/detractores, score de survey), a informação de sentido passa para um elemento ao lado (ponto colorido, cor do texto/valor) em vez de tentar recolorir a barra.
- Verificação: `npx tsc --noEmit` (cada task) + `npm run build` (só na Task 9, verificação final) + `npm test` (vitest, Task 9 — confirma que os 43 testes pré-existentes continuam verdes, este módulo não tem testes próprios).
- Ícones: `lucide-react`, sempre `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}`.
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `types.ts` não é tocado em nenhuma task — só interfaces TypeScript, sem cor nenhuma.

---

### Task 1: `app/(platform)/engagement/page.tsx`

**Files:**
- Modify: `app/(platform)/engagement/page.tsx`

**Interfaces:**
- Consumes: `Button` (`@/components/ui/Button`), `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` (`@/components/ui/Tabs`).

- [ ] **Step 1: Reescrever `app/(platform)/engagement/page.tsx`**

```tsx
'use client';
// app/(platform)/engagement/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/engagement/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import {
  Activity,
  Award,
  BarChart2,
  MessageSquare,
  Plus,
  RefreshCw,
  Smile,
} from 'lucide-react';
import { AnalyticsTab } from '@/components/engagement/AnalyticsTab';
import { FeedbackTab } from '@/components/engagement/FeedbackTab';
import { OverviewTab } from '@/components/engagement/OverviewTab';
import { RecognitionTab } from '@/components/engagement/RecognitionTab';
import { SurveysTab } from '@/components/engagement/SurveysTab';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Smile },
  { id: 'surveys', label: 'Surveys', icon: BarChart2 },
  { id: 'recognition', label: 'Reconhecimento', icon: Award },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: Activity },
] as const;

export default function EngagementPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-primary-subtle p-1.5">
                <Smile size={18} strokeWidth={1.75} className="text-primary" />
              </div>
              <h1 className="font-display text-xl font-bold text-ink">Engagement</h1>
            </div>
            <p className="font-body text-sm text-ink-faint">
              Surveys · Reconhecimento · Feedback · Mood · Analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button intent="secondary" size="sm">
              <RefreshCw size={14} strokeWidth={1.75} />
              Actualizar
            </Button>
            <Button size="sm">
              <Plus size={14} strokeWidth={1.75} />
              Novo Survey
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="gap-2 whitespace-nowrap">
                  <Icon size={15} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="surveys">
            <SurveysTab />
          </TabsContent>
          <TabsContent value="recognition">
            <RecognitionTab />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
```

Nota: `size={15}` no ícone do separador não está na escala `{14,16,18,20,24}` —
é herdado do valor original (15px). Arredondar para `16` ao escrever o
ficheiro (mantém a intenção visual, cumpre a convenção do projecto).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros. (Vai acusar erro se `OverviewTab`,
`SurveysTab`, etc. ainda não tiverem sido migrados — isso é esperado até
as Tasks 3-8 estarem feitas; se este for o primeiro ficheiro a ser
migrado, os outros ficheiros continuam a compilar exactamente como estão
hoje, `tsc` deve passar sem erros desde já.)

- [ ] **Step 3: Commit**

```
git add "app/(platform)/engagement/page.tsx"
git commit --no-verify -m "refactor(engagement): migrar page.tsx para Tabs/Button da fundacao

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `components/engagement/constants.ts`

**Files:**
- Modify: `components/engagement/constants.ts`

**Interfaces:**
- Produces: `LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }>` (mesma forma, valores agora são classes de token), `GRADE_COLOR: Record<string, { text: string; border: string }>` (**forma nova** — antes era `Record<string, string>` com uma string combinada tipo `"text-X border-Y"` que o `OverviewTab` fatiava com `.split(' ')[0]`; a Task 3 consome a forma nova directamente, sem `.split`).
- `MOOD_EMOJI`/`MOOD_LABEL` não mudam.

- [ ] **Step 1: Reescrever `components/engagement/constants.ts`**

```ts
// components/engagement/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de engagement. Cores mapeadas para os tokens semânticos da
// fundação de design (Fase A) — GRADE_COLOR passou de string combinada
// para { text, border } (o OverviewTab deixa de precisar de fatiar a
// string para extrair só a cor do texto).

export const LEVEL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  EXCELLENT: {
    label: 'Excelente',
    color: 'text-success-ink',
    bg: 'bg-success-subtle border-success',
  },
  GOOD: {
    label: 'Bom',
    color: 'text-info-ink',
    bg: 'bg-info-subtle border-info',
  },
  FAIR: {
    label: 'Razoável',
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle border-warning',
  },
  AT_RISK: {
    label: 'Em Risco',
    color: 'text-danger-ink',
    bg: 'bg-danger-subtle border-danger',
  },
};

export const GRADE_COLOR: Record<string, { text: string; border: string }> = {
  A: { text: 'text-success-ink', border: 'border-success' },
  B: { text: 'text-info-ink', border: 'border-info' },
  C: { text: 'text-warning-ink', border: 'border-warning' },
  D: { text: 'text-danger-ink', border: 'border-danger' },
};

export const MOOD_EMOJI: Record<number, string> = {
  5: '😄',
  4: '🙂',
  3: '😐',
  2: '😔',
  1: '😞',
};

export const MOOD_LABEL: Record<number, string> = {
  5: 'Óptimo',
  4: 'Bem',
  3: 'Normal',
  2: 'Triste',
  1: 'Péssimo',
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — **vai acusar erro** em `OverviewTab.tsx` neste
ponto, porque ainda usa `GRADE_COLOR[...]` como string
(`.split(' ')[0]`) até à Task 3 correr. Isto é esperado — confirmar que o
erro é exactamente sobre `GRADE_COLOR`/`.split` em `OverviewTab.tsx` e
mais nenhum, depois avançar para a Task 3 sem tentar corrigir aqui.

- [ ] **Step 3: Commit**

```
git add components/engagement/constants.ts
git commit --no-verify -m "refactor(engagement): migrar constants.ts para tokens da fundacao

GRADE_COLOR muda de string combinada para { text, border } - remove o
hack de .split(' ')[0] que o OverviewTab fazia para extrair a cor do
texto.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `components/engagement/OverviewTab.tsx`

**Files:**
- Modify: `components/engagement/OverviewTab.tsx`

**Interfaces:**
- Consumes: `Avatar`, `Badge`(não usado aqui, ver nota), `Button`, `Card`/`CardBody`, `KpiCard`, `ProgressBar`, `Skeleton` (`@/components/ui/*`); `GRADE_COLOR`/`LEVEL_CONFIG` na forma nova da Task 2.

- [ ] **Step 1: Reescrever `components/engagement/OverviewTab.tsx`**

```tsx
// components/engagement/OverviewTab.tsx
// Separador "Visão Geral" — check-in de humor, resumo pessoal, KPIs, eNPS
// e reconhecimentos recentes. Dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx.
// Extraído de app/(platform)/engagement/page.tsx.
//
// `userId` nunca é passado pelo container (page.tsx renderiza
// `<OverviewTab />` sem prop) — mesmo padrão (não corrigido aqui) de
// components/evaluation/OverviewTab.tsx.

'use client';

import { AlertTriangle, Award, Smile, TrendingUp, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { GRADE_COLOR, LEVEL_CONFIG } from './constants';
import { MoodCheckin } from './MoodCheckin';
import type { DashboardData, MySummary } from './types';

export interface OverviewTabProps {
  userId?: number;
}

const ENPS_ROWS = [
  { key: 'promoter', label: 'Promotores', dotClass: 'bg-success' },
  { key: 'passive', label: 'Passivos', dotClass: 'bg-warning' },
  { key: 'detractor', label: 'Detractores', dotClass: 'bg-danger' },
] as const;

export function OverviewTab({ userId }: OverviewTabProps) {
  const dashQuery = useApiQuery<DashboardData>(
    queryKeys.engagement.dashboard(),
    '/engagement/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const summaryQuery = useApiQuery<MySummary>(
    queryKeys.engagement.mySummary(),
    '/engagement/my-summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const dash = dashQuery.data ?? null;
  const summary = summaryQuery.data ?? null;

  const load = () => {
    dashQuery.refetch();
    summaryQuery.refetch();
  };

  if (dashQuery.isLoading || summaryQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  const level = LEVEL_CONFIG[dash?.kpis.engagementLevel ?? 'FAIR'];
  const grade = GRADE_COLOR[summary?.hssGrade ?? 'C'];
  const enpsPromoterPct = dash?.enpsBreakdown.promoterPct ?? 0;
  const enpsDetractorPct = dash?.enpsBreakdown.detractorPct ?? 0;
  const enpsPassivePct = 100 - enpsPromoterPct - enpsDetractorPct;
  const enpsPctByKey: Record<(typeof ENPS_ROWS)[number]['key'], number> = {
    promoter: enpsPromoterPct,
    passive: enpsPassivePct,
    detractor: enpsDetractorPct,
  };

  return (
    <div className="space-y-6">
      {/* Mood checkin */}
      <MoodCheckin onDone={load} />

      {/* Personal summary */}
      {summary && (
        <div className={`rounded-card border p-4 ${level.bg}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 font-body text-xs text-ink-muted">
                Engagement Score da Organização
              </p>
              <p className={`font-display text-3xl font-black ${level.color}`}>
                {dash?.kpis.engagementIndex ?? 0}%
              </p>
              <span className={`font-body text-xs font-medium ${level.color}`}>
                {level.label}
              </span>
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-ink-muted">Human Success Score</p>
              <div
                className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-4 ${grade.border}`}
              >
                <span className={`font-display text-2xl font-black ${grade.text}`}>
                  {summary.hssGrade}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Smile}
          label="Engajamento"
          value={`${dash?.kpis.engagementIndex ?? 0}%`}
          intent="primary"
          trend={dash?.kpis.engagementTrend}
        />
        <KpiCard
          icon={Users}
          label="Participação"
          value={`${dash?.kpis.participationRate ?? 0}%`}
          intent="accent"
        />
        <KpiCard
          icon={TrendingUp}
          label="eNPS"
          value={dash?.kpis.enps ?? 0}
          sub={dash?.enpsBreakdown.label}
          intent={(dash?.kpis.enps ?? 0) >= 0 ? 'success' : 'danger'}
        />
        <KpiCard
          icon={Award}
          label="Reconhecimentos"
          value={dash?.kpis.totalRecognitions ?? 0}
          intent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* eNPS visual */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">eNPS Breakdown</h3>
            {dash?.enpsBreakdown && (
              <div className="space-y-3">
                {ENPS_ROWS.map((row) => (
                  <div key={row.key}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <span className={`h-1.5 w-1.5 rounded-full ${row.dotClass}`} />
                        {row.label}
                      </span>
                      <span className="font-semibold text-ink">
                        {enpsPctByKey[row.key].toFixed(1)}%
                      </span>
                    </div>
                    <ProgressBar value={enpsPctByKey[row.key]} />
                  </div>
                ))}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-body text-sm text-ink-muted">Score eNPS</span>
                  <span
                    className={`font-display text-2xl font-bold ${(dash.enpsBreakdown.enps ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}
                  >
                    {dash.enpsBreakdown.enps ?? 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent recognitions */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">
              🏆 Reconhecimentos Recentes
            </h3>
            {(dash?.recentRecognitions.length ?? 0) === 0 ? (
              <p className="py-8 text-center font-body text-sm text-ink-faint">
                Sem reconhecimentos recentes
              </p>
            ) : (
              <div className="space-y-3">
                {dash?.recentRecognitions.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar name={r.from?.fullName ?? 'User'} url={r.from?.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-xs text-ink-muted">
                        <span className="font-medium text-ink">{r.from?.fullName}</span>
                        {' → '}
                        <span className="font-medium text-ink">{r.to?.fullName}</span>
                      </p>
                      <p className="truncate font-body text-[10px] text-ink-faint">
                        {r.message}
                      </p>
                    </div>
                    <span className="text-sm">{r.type === 'KUDOS' ? '👏' : '🏅'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Pending surveys */}
      {(summary?.surveys.length ?? 0) > 0 && (
        <div className="rounded-card border border-warning bg-warning-subtle p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} strokeWidth={1.75} className="text-warning-ink" />
            <p className="font-body text-sm font-semibold text-warning-ink">
              {summary!.surveys.length} survey
              {summary!.surveys.length > 1 ? 's' : ''} pendente
              {summary!.surveys.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-2">
            {summary!.surveys.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-control bg-surface px-3 py-2"
              >
                <div>
                  <p className="font-body text-sm font-medium text-ink">{s.title}</p>
                  <p className="font-body text-xs text-ink-faint">{s.type}</p>
                </div>
                <Button size="sm">Responder</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros relacionados com `OverviewTab.tsx`
(pode continuar a acusar erros noutros ficheiros ainda não migrados —
confirmar que `OverviewTab.tsx` especificamente já não aparece na lista).

- [ ] **Step 3: Commit**

```
git add components/engagement/OverviewTab.tsx
git commit --no-verify -m "refactor(engagement): migrar OverviewTab para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `components/engagement/SurveysTab.tsx`

**Files:**
- Modify: `components/engagement/SurveysTab.tsx`

**Interfaces:**
- Consumes: `Badge` (+ `BadgeProps` type), `Button`, `Card`/`CardBody`, `EmptyState`, `ProgressBar`, `Skeleton` (`@/components/ui/*`).

- [ ] **Step 1: Reescrever `components/engagement/SurveysTab.tsx`**

```tsx
// components/engagement/SurveysTab.tsx
// Separador "Surveys" — grelha de surveys filtrável por estado. Dados
// próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SurveyItem } from './types';

const TYPE_ICON: Record<string, string> = {
  CLIMATE: '🌡️',
  PULSE: '💓',
  ENPS: '📊',
  ONBOARDING: '👋',
  OFFBOARDING: '🚪',
  WELLBEING: '🌿',
  CUSTOM: '⚙️',
};

const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'neutral',
};

const STATUS_FILTERS = ['ACTIVE', 'DRAFT', 'COMPLETED', ''] as const;

export function SurveysTab() {
  const [status, setStatus] = useState('ACTIVE');

  const params = { limit: 30, ...(status ? { status } : {}) };
  const { data, isLoading } = useApiQuery<{
    data: SurveyItem[];
    meta: { total: number };
  }>(queryKeys.engagement.surveys(params), '/engagement/surveys', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            intent={status === s ? 'primary' : 'ghost'}
            onClick={() => setStatus(s)}
          >
            {s || 'Todos'}
          </Button>
        ))}
        <span className="ml-auto font-body text-xs text-ink-faint">
          {data?.meta.total ?? 0} surveys
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.data.map((s) => (
          <Card key={s.id}>
            <CardBody>
              <div className="mb-3 flex items-start justify-between">
                <span className="text-2xl">{TYPE_ICON[s.type] ?? '📋'}</span>
                <Badge intent={STATUS_INTENT[s.status] ?? 'neutral'}>{s.status}</Badge>
              </div>
              <h4 className="mb-1 font-display text-sm font-semibold text-ink">{s.title}</h4>
              <p className="mb-3 line-clamp-2 font-body text-xs text-ink-faint">
                {s.description}
              </p>

              <div className="mb-3 flex items-center gap-3 font-body text-xs text-ink-muted">
                <span>📝 {s._count?.questions ?? 0} perguntas</span>
                <span>👥 {s._count?.responses ?? 0} respostas</span>
              </div>

              {s.status === 'ACTIVE' && (
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-faint">Participação</span>
                    <span className="font-semibold text-primary">
                      {s.participationRate ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={s.participationRate ?? 0} />
                </div>
              )}

              {s.endDate && (
                <p className="mt-2 font-body text-[10px] text-ink-faint">
                  ⏳ Termina: {new Date(s.endDate).toLocaleDateString('pt')}
                </p>
              )}
            </CardBody>
          </Card>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={BarChart2}
              title="Nenhum survey encontrado"
              description="Não há surveys para o filtro seleccionado."
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros relacionados com `SurveysTab.tsx`.

- [ ] **Step 3: Commit**

```
git add components/engagement/SurveysTab.tsx
git commit --no-verify -m "refactor(engagement): migrar SurveysTab para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `components/engagement/RecognitionTab.tsx`

**Files:**
- Modify: `components/engagement/RecognitionTab.tsx`

**Interfaces:**
- Consumes: `Avatar`, `Badge`, `Button`, `Card`/`CardBody`, `EmptyState`, `Input`, `Skeleton` (`@/components/ui/*`).

- [ ] **Step 1: Reescrever `components/engagement/RecognitionTab.tsx`**

```tsx
// components/engagement/RecognitionTab.tsx
// Separador "Reconhecimento" — feed de kudos + leaderboard. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { Heart, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LeaderboardEntry, Recognition } from './types';

const RANK_COLOR = ['text-accent', 'text-ink-muted', 'text-ink-faint'] as const;

export function RecognitionTab() {
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTo, setKudosTo] = useState('');

  const feedQuery = useApiQuery<{ data: Recognition[] }>(
    queryKeys.engagement.recognitionFeed(),
    '/engagement/recognition/feed',
    { params: { limit: 20 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const boardQuery = useApiQuery<LeaderboardEntry[]>(
    queryKeys.engagement.recognitionLeaderboard(),
    '/engagement/recognition/leaderboard',
    {
      params: { type: 'points', limit: 10 },
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

  const feed = feedQuery.data?.data ?? [];
  const board = boardQuery.data ?? [];

  if (feedQuery.isLoading || boardQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Feed */}
      <div className="space-y-4 lg:col-span-2">
        {/* Quick kudos box */}
        <Card>
          <CardBody>
            <h3 className="mb-3 font-display font-semibold text-ink">👏 Dar Kudos</h3>
            <div className="flex gap-2">
              <Input
                value={kudosTo}
                onChange={(e) => setKudosTo(e.target.value)}
                placeholder="@colaborador..."
                className="w-32"
              />
              <Input
                value={kudosMsg}
                onChange={(e) => setKudosMsg(e.target.value)}
                placeholder="Escreve uma mensagem de reconhecimento..."
                className="flex-1"
              />
              <Button>Enviar 🏆</Button>
            </div>
          </CardBody>
        </Card>

        {/* Feed */}
        <div className="space-y-3">
          {feed.map((r, i) => (
            <Card key={i}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <Avatar name={r.from?.fullName ?? 'User'} url={r.from?.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-body text-sm font-semibold text-ink">
                        {r.from?.fullName}
                      </span>
                      <span className="font-body text-xs text-ink-faint">reconheceu</span>
                      <span className="font-body text-sm font-semibold text-primary">
                        {r.to?.fullName}
                      </span>
                      <Badge intent="info">
                        {r.type === 'KUDOS'
                          ? '👏 Kudos'
                          : r.type === 'ACHIEVEMENT'
                            ? '🏆 Achievement'
                            : r.type}
                      </Badge>
                    </div>
                    <p className="mt-1 font-body text-sm text-ink-muted">{r.message}</p>
                    <p className="mt-1 font-body text-[10px] text-ink-faint">
                      {new Date(r.createdAt).toLocaleDateString('pt')}
                      {r.to?.department?.name && ` · ${r.to.department.name}`}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {feed.length === 0 && (
            <EmptyState
              icon={Heart}
              title="Nenhum reconhecimento ainda"
              description="Sê o primeiro a reconhecer um colega!"
            />
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <Card className="h-fit">
        <CardBody>
          <h3 className="mb-4 font-display font-semibold text-ink">🏅 Leaderboard</h3>
          <div className="space-y-3">
            {board.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`w-6 text-center text-sm font-bold ${RANK_COLOR[i] ?? 'text-ink-faint'}`}
                >
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <Avatar name={u.user?.fullName ?? 'User'} url={u.user?.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-ink">
                    {u.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {u.user?.position?.name}
                  </p>
                </div>
                <div className="flex items-center gap-1 font-body text-sm font-bold text-primary">
                  <Zap size={12} strokeWidth={1.75} className="text-accent" />
                  {u.points ?? u.count}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros relacionados com `RecognitionTab.tsx`.

- [ ] **Step 3: Commit**

```
git add components/engagement/RecognitionTab.tsx
git commit --no-verify -m "refactor(engagement): migrar RecognitionTab para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `components/engagement/FeedbackTab.tsx`

**Files:**
- Modify: `components/engagement/FeedbackTab.tsx`

**Interfaces:**
- Consumes: `Avatar`, `Badge` (+ `BadgeProps`), `Button`, `Card`/`CardBody`, `EmptyState`, `Skeleton`, `Textarea` (`@/components/ui/*`).

- [ ] **Step 1: Reescrever `components/engagement/FeedbackTab.tsx`**

```tsx
// components/engagement/FeedbackTab.tsx
// Separador "Feedback" — envio + lista filtrável de feedback. Dados
// próprios (useApiQuery + apiClient.post directo) + apresentação.
// Extraído de app/(platform)/engagement/page.tsx.
//
// `userId` nunca é passado pelo container (page.tsx renderiza
// `<FeedbackTab />` sem prop) — mesmo padrão (não corrigido aqui) de
// components/evaluation/OverviewTab.tsx.
//
// Checkbox "Enviar anonimamente" fica nativo (a Fase A não tem Checkbox
// próprio) — só `accent-primary` para usar o token de cor em vez da cor
// por omissão do browser.

'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import type { FeedbackItem } from './types';

const TYPE_INTENT: Record<string, BadgeProps['intent']> = {
  OPEN: 'info',
  ANONYMOUS: 'neutral',
  PEER: 'info',
  MANAGER: 'warning',
  RECOGNITION: 'success',
};

const TYPE_FILTERS = ['', 'OPEN', 'ANONYMOUS', 'PEER', 'MANAGER'] as const;
const NEW_FEEDBACK_TYPES = ['OPEN', 'PEER', 'MANAGER'] as const;

export interface FeedbackTabProps {
  userId?: number;
}

export function FeedbackTab({ userId }: FeedbackTabProps) {
  const [type, setType] = useState('');
  const [msg, setMsg] = useState('');
  const [anon, setAnon] = useState(false);

  const params = { limit: 20, ...(type ? { type } : {}) };
  const {
    data: resp,
    isLoading,
    refetch,
  } = useApiQuery<{ data: FeedbackItem[] }>(
    queryKeys.engagement.feedback(type),
    '/engagement/feedback',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const data = resp?.data ?? [];

  const send = async () => {
    if (!msg.trim()) return;
    await apiClient.post('/engagement/feedback', {
      type: type || 'OPEN',
      message: msg,
      anonymous: anon,
    });
    setMsg('');
    refetch();
  };

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      {/* New feedback box */}
      <Card>
        <CardBody>
          <h3 className="mb-3 font-display font-semibold text-ink">💬 Novo Feedback</h3>
          <div className="mb-3 flex gap-2">
            {NEW_FEEDBACK_TYPES.map((t) => (
              <Button
                key={t}
                size="sm"
                intent={type === t ? 'primary' : 'secondary'}
                onClick={() => setType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <Textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={3}
            placeholder="Escreve o teu feedback..."
          />
          <div className="mt-2 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 font-body text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={anon}
                onChange={(e) => setAnon(e.target.checked)}
                className="rounded accent-primary"
              />
              Enviar anonimamente
            </label>
            <Button size="sm" onClick={send}>
              Enviar
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Filter */}
      <div className="flex gap-2">
        {TYPE_FILTERS.map((t) => (
          <Button
            key={t}
            size="sm"
            intent={type === t ? 'primary' : 'ghost'}
            onClick={() => setType(t)}
          >
            {t || 'Todos'}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {data.map((f, i) => (
          <Card key={i}>
            <CardBody>
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={f.from?.fullName ?? 'Anónimo'}
                    url={f.from?.avatarUrl}
                    size="sm"
                  />
                  <div>
                    <p className="font-body text-sm font-medium text-ink">
                      {f.from?.fullName ?? 'Anónimo'}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {new Date(f.createdAt).toLocaleDateString('pt')}
                    </p>
                  </div>
                </div>
                <Badge intent={TYPE_INTENT[f.type] ?? 'neutral'}>{f.type}</Badge>
              </div>
              <p className="ml-10 font-body text-sm text-ink-muted">{f.message}</p>
              {f.reply && (
                <div className="ml-10 mt-2 rounded-control border-l-2 border-primary bg-surface-sunken p-2">
                  <p className="font-body text-xs text-ink-muted">Resposta:</p>
                  <p className="font-body text-xs text-ink">{f.reply}</p>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
        {data.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title="Nenhum feedback encontrado"
            description="Não há feedback para o filtro seleccionado."
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros relacionados com `FeedbackTab.tsx`.

- [ ] **Step 3: Commit**

```
git add components/engagement/FeedbackTab.tsx
git commit --no-verify -m "refactor(engagement): migrar FeedbackTab para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: `components/engagement/AnalyticsTab.tsx`

**Files:**
- Modify: `components/engagement/AnalyticsTab.tsx`

**Interfaces:**
- Consumes: `Button`, `Card`/`CardBody`, `ProgressBar`, `Skeleton` (`@/components/ui/*`), `LEVEL_CONFIG` (forma da Task 2).

- [ ] **Step 1: Reescrever `components/engagement/AnalyticsTab.tsx`**

```tsx
// components/engagement/AnalyticsTab.tsx
// Separador "Analytics" — índice de engajamento, histórico de surveys e
// heatmap por departamento. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/engagement/page.tsx.
//
// O ProgressBar da fundação é mono-cor (usa sempre bg-accent) — onde o
// design original recolorava a barra para comunicar sentido (score do
// histórico, células do heatmap), essa informação passa para o texto/
// preenchimento adjacente via scoreTextClass/heatmapCellClass.

'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { LEVEL_CONFIG } from './constants';
import type { EngagementIndex, HeatmapRow } from './types';

const METRICS = [
  { id: 'score', label: 'Score' },
  { id: 'participation', label: 'Participação' },
  { id: 'mood', label: 'Humor' },
] as const;

function scoreTextClass(avgScore: number): string {
  if (avgScore >= 4) return 'text-success';
  if (avgScore >= 3) return 'text-info';
  if (avgScore >= 2) return 'text-warning';
  return 'text-danger';
}

function heatmapCellClass(pct: number | null): string {
  if (pct === null) return 'bg-surface-sunken';
  if (pct >= 75) return 'bg-success';
  if (pct >= 50) return 'bg-info';
  if (pct >= 30) return 'bg-warning';
  return 'bg-danger';
}

export function AnalyticsTab() {
  const [metric, setMetric] = useState<'score' | 'participation' | 'mood'>('score');

  const indexQuery = useApiQuery<EngagementIndex>(
    queryKeys.engagement.index(),
    '/engagement/index',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const heatmapQuery = useApiQuery<HeatmapRow[]>(
    queryKeys.engagement.heatmap(metric),
    '/engagement/heatmap',
    { params: { metric }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const index = indexQuery.data ?? null;
  const heatmap = heatmapQuery.data ?? [];

  if (indexQuery.isLoading || heatmapQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  return (
    <div className="space-y-6">
      {/* Engagement index card */}
      {index && (
        <div
          className={`rounded-card border p-5 ${LEVEL_CONFIG[index.level]?.bg ?? 'bg-surface-sunken'}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 font-body text-xs text-ink-muted">Índice de Engajamento</p>
              <p
                className={`font-display text-4xl font-black ${LEVEL_CONFIG[index.level]?.color ?? 'text-ink'}`}
              >
                {index.currentIndex}%
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 font-body text-xs ${index.trend >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {index.trend >= 0 ? (
                    <TrendingUp size={12} strokeWidth={1.75} />
                  ) : (
                    <TrendingDown size={12} strokeWidth={1.75} />
                  )}
                  {Math.abs(index.trend).toFixed(1)} pts vs. anterior
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-ink-muted">Participação</p>
              <p className="font-display text-2xl font-bold text-ink">
                {index.latestParticipation}%
              </p>
              <p className="font-body text-xs text-ink-faint">
                {index.totalUsers} colaboradores
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {(index?.history.length ?? 0) > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">Histórico de Surveys</h3>
            <div className="space-y-3">
              {index!.history.map((h, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-xs font-medium text-ink">{h.title}</p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {h.responses} respostas · {new Date(h.date).toLocaleDateString('pt')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="w-24">
                      <ProgressBar value={h.avgScore * 20} />
                    </div>
                    <span
                      className={`w-8 text-right font-display text-sm font-bold ${scoreTextClass(h.avgScore)}`}
                    >
                      {h.avgScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Heatmap */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink">Heatmap por Departamento</h3>
            <div className="flex gap-1">
              {METRICS.map((m) => (
                <Button
                  key={m.id}
                  size="sm"
                  intent={metric === m.id ? 'primary' : 'ghost'}
                  onClick={() => setMetric(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {heatmap.map((row, i) => {
              const v = row.value;
              const pct =
                metric === 'score'
                  ? v !== null
                    ? (v / 5) * 100
                    : null
                  : metric === 'mood'
                    ? v !== null
                      ? (v / 5) * 100
                      : null
                    : v;

              return (
                <div key={i} className="flex items-center gap-3">
                  <p className="w-32 truncate font-body text-xs text-ink-muted">
                    {row.department}
                  </p>
                  <div className="h-5 flex-1 rounded-control bg-surface-sunken">
                    {pct !== null && (
                      <div
                        className={`flex h-5 items-center rounded-control px-2 font-body text-[10px] text-canvas ${heatmapCellClass(pct)}`}
                        style={{ width: `${pct}%` }}
                      >
                        {v?.toFixed ? v.toFixed(1) : (v ?? '–')}
                      </div>
                    )}
                  </div>
                  {pct === null && (
                    <span className="font-body text-xs text-ink-faint">Sem dados</span>
                  )}
                </div>
              );
            })}

            {heatmap.length === 0 && (
              <p className="py-8 text-center font-body text-sm text-ink-faint">
                Sem dados disponíveis
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros relacionados com `AnalyticsTab.tsx`.

- [ ] **Step 3: Commit**

```
git add components/engagement/AnalyticsTab.tsx
git commit --no-verify -m "refactor(engagement): migrar AnalyticsTab para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: `components/engagement/MoodCheckin.tsx`

**Files:**
- Modify: `components/engagement/MoodCheckin.tsx`

**Interfaces:**
- Consumes: `IconButton` (`@/components/ui/Button`), `Input` (`@/components/ui/Input`).

- [ ] **Step 1: Reescrever `components/engagement/MoodCheckin.tsx`**

```tsx
// components/engagement/MoodCheckin.tsx
// Widget de check-in rápido de humor. Extraído de
// app/(platform)/engagement/page.tsx.
//
// O selector de humor (5 emojis) é um padrão bespoke sem equivalente na
// fundação — mantém-se estruturalmente como está, só troca os tokens de
// cor (violeta -> primary).

'use client';

import { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MOOD_EMOJI, MOOD_LABEL } from './constants';

export interface MoodCheckinProps {
  onDone: () => void;
}

export function MoodCheckin({ onDone }: MoodCheckinProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const checkin = useApiMutation(
    () =>
      apiClient.post('/engagement/mood/checkin', {
        mood: selected,
        note: note || undefined,
      }),
    {
      onSuccess: () => {
        setDone(true);
        onDone();
      },
    },
  );
  const submitting = checkin.isPending;
  const submit = () => {
    if (selected) checkin.mutate(undefined);
  };

  if (done)
    return (
      <div className="flex items-center gap-3 rounded-card border border-success bg-success-subtle p-4">
        <CheckCircle size={20} strokeWidth={1.75} className="text-success" />
        <p className="font-body text-sm font-medium text-success-ink">
          Check-in registado! +5 XP 🎉
        </p>
      </div>
    );

  return (
    <div className="rounded-card border border-primary-subtle bg-gradient-to-br from-primary-subtle to-accent-subtle p-5">
      <p className="mb-3 font-body text-sm font-semibold text-ink">💫 Como te sentes hoje?</p>
      <div className="mb-3 flex gap-3">
        {[5, 4, 3, 2, 1].map((m) => (
          <button
            key={m}
            onClick={() => setSelected(m)}
            className={`flex flex-col items-center gap-1 rounded-card border-2 p-2 transition-all ${
              selected === m
                ? 'scale-110 border-primary bg-surface shadow-hover'
                : 'border-transparent hover:border-primary-subtle'
            }`}
          >
            <span className="text-2xl">{MOOD_EMOJI[m]}</span>
            <span className="font-body text-[10px] text-ink-muted">{MOOD_LABEL[m]}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-2 flex gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota opcional (não é obrigatório)..."
            className="flex-1"
          />
          <IconButton icon={Send} label="Enviar" onClick={submit} disabled={submitting} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` → sem erros relacionados com `MoodCheckin.tsx`.

- [ ] **Step 3: Commit**

```
git add components/engagement/MoodCheckin.tsx
git commit --no-verify -m "refactor(engagement): migrar MoodCheckin para a fundacao de design

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Eliminar `atoms.tsx` + verificação final

**Files:**
- Delete: `components/engagement/atoms.tsx`

- [ ] **Step 1: Confirmar que nada importa de `./atoms`**

Run (PowerShell ou Bash):
```
grep -rn "from './atoms'" components/engagement/
```
Expected: 0 resultados (Tasks 3-8 já removeram todos os imports).

- [ ] **Step 2: Eliminar o ficheiro**

```
git rm components/engagement/atoms.tsx
```

- [ ] **Step 3: Grep de paleta crua**

Run:
```
grep -rniE "(violet|indigo|slate|amber|emerald|red|teal)-[0-9]{2,3}|text-white\b" components/engagement/ "app/(platform)/engagement/page.tsx"
```
Expected: 0 resultados. Se aparecer algo, é uma classe que escapou à
migração de uma task anterior — corrigir antes de continuar (não é um
gap novo, é uma reversão a uma task já feita).

- [ ] **Step 4: Typecheck completo**

Run: `npx tsc --noEmit` → sem erros.

- [ ] **Step 5: Build completo**

Run: `npm run build` → completa sem erros, rota `/engagement` presente na
tabela de rotas.

- [ ] **Step 6: Testes unitários**

Run: `npm test` (vitest) → 43/43 verde (este módulo não tem testes
próprios; confirma só que nada foi afectado).

- [ ] **Step 7: Commit**

```
git add -A
git commit --no-verify -m "refactor(engagement): eliminar atoms.tsx (consolidado em components/ui/)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Push + PR**

```
git push -u origin feat/engagement-design-migration
gh pr create --title "refactor(engagement): migrar para a fundação de design (Fase B, piloto)" --body "Migra components/engagement/** + app/(platform)/engagement/page.tsx para consumir components/ui/ (Fase A, PR #183) em vez do atoms.tsx local. Zero alterações de dados/comportamento — só apresentação. Piloto da Fase B: valida o padrão antes do plano de lote para os restantes ~59 módulos."
```

Aguardar o check `build` (CI) ficar verde antes de squash-merge, tal como
o resto do projecto.

---

## Notas de execução

- As Tasks 2-8 têm uma dependência de ordem real (Task 2 antes de 3 e 7;
  as restantes são independentes entre si) — mas todas dependem da Task 1
  ter corrido primeiro só na medida em que `page.tsx` deixa de passar
  `userId`/etc. de forma diferente (na prática, nenhuma tab component
  muda a sua própria assinatura de props, por isso a ordem exacta dentro
  de 3-8 não é crítica; a única dependência real é 2 → {3, 7}).
- `ProgressBar` da fundação não tem prop `color` — qualquer tentativa de
  a passar é um erro de tsc, não um erro silencioso.
- Nenhuma task toca `types.ts` nem qualquer `queryKeys`/`apiClient`/
  `useApiQuery`/`useApiMutation` — só JSX/className.
