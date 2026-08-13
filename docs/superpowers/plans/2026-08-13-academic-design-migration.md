# Migração do módulo academic — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/academic/**` + `app/(platform)/academic/**` para consumir exclusivamente `components/ui/` (Fase A), eliminando toda a paleta Tailwind crua (blue/green/yellow/red/purple/orange/gray), sem alterar nenhum comportamento de dados. Segue o mesmo padrão validado no piloto `engagement` (`docs/superpowers/plans/2026-08-11-engagement-design-migration.md`), adaptado a este módulo — que não tem `atoms.tsx`, tem um `shared.tsx` com pequenos helpers, e os mapas de cor vivem em `types.ts` (`LEVEL_COLORS`/`STATUS_COLORS`).

**Architecture:** `types.ts` migra primeiro — `LEVEL_COLORS`/`STATUS_COLORS` (strings Tailwind combinadas) passam a `LEVEL_INTENT`/`STATUS_INTENT` (`Record<string, BadgeProps['intent']>`), consumidos via `<Badge intent={...}>`. `shared.tsx` migra a seguir — `SummaryCard` é eliminado (substituído directamente por `KpiCard` no único consumidor, `TranscriptView`), `Info` fica local (sem equivalente em `components/ui/`), `CardGridSkeleton`/`DetailSkeleton` passam a compor `components/ui/Skeleton`. As 3 views (`ProgramsListView`, `ProgramDetailView`, `TranscriptView`) e as 2 `page.tsx` com estado de erro próprio (`[id]/page.tsx`, `transcript/page.tsx`) migram por último, cada uma independente.

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183).

## Global Constraints

- Repo: worktree isolado, branch `refactor/academic-design-migration` a partir de `main`.
- **Zero alterações a dados/comportamento** — mesmos endpoints/hooks (`useAcademicPrograms`, `useAcademicProgramDetail`, `useAcademicTranscript`, não tocados), mesma lógica de filtros/paginação. Só a apresentação muda.
- **Filtro de nível (`Select`)**: o `<select>` nativo tinha uma opção `value=""` ("Todos os níveis") para limpar o filtro. `components/ui/Select` (Radix) não aceita `value=""` num item — mapear localmente na view: item `ALL` no `Select`, traduzido para `''` na chamada a `onLevelFilterChange` (o hook continua a receber `''` exactamente como antes).
- **Zero classes de cor Tailwind cruas** (`blue-*`, `green-*`, `yellow-*`, `red-*`, `purple-*`, `orange-*`, `gray-*`, `text-white`) em `components/academic/**` e `app/(platform)/academic/**` no final — só tokens da Fase A.
- **Mapeamento de cor semântica** (para `LEVEL_INTENT`/`STATUS_INTENT`, sem token directo para "purple"/"orange" do design antigo):
  - Nível: `BASIC→success`, `INTERMEDIATE→info`, `ADVANCED→warning`, `EXPERT→danger` (progressão semelhante a semáforo, fácil→difícil).
  - Estado de matrícula: `PENDING→neutral`, `APPROVED→info`, `IN_PROGRESS→warning`, `COMPLETED→success`, `FAILED→danger`, `DROPPED→neutral`, `REJECTED→danger`, `SUSPENDED→warning`.
- **Não criar componentes novos.** Links estilizados como botão (`<Link href="/academic/transcript">`) usam `buttonVariants` exportado de `@/components/ui/Button` em vez de duplicar classes à mão — continua a ser um `<a>` real (navegação/keyboard/cmd-click preservados), não um `Card`/`Button` a fingir de link.
- **Cards clicáveis que são `<a>` nativos** (grelha de programas): mantidos como `<Link>` estilizado à mão com as mesmas classes token que `Card` usa internamente (`rounded-card border border-border bg-surface shadow-resting hover:shadow-hover`) — não se usa o componente `Card` (que só renderiza `<div>`) para não perder a semântica de link nem duplicar o padrão bug-prone de `interactive` em elemento errado.
- **`Card` da Fase A**: usar sem `interactive` (nenhum uso deste módulo é um `<div>` com `onClick` próprio — os cliques reais são `<a>`/`<button>` nativos dentro do Card).
- **`ProgressBar` da Fase A é mono-cor** — a barra de progresso de matrícula já não comunicava sentido por cor no design antigo (`bg-blue-500` fixo), não há informação a preservar.
- Verificação: `npx tsc --noEmit` (cada task) + `npm run build` + `npm test` (Task final).
- Ícones: `lucide-react`, sempre `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}`.
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

### Task 1: `components/academic/types.ts`

- [ ] Substituir `LEVEL_COLORS`/`STATUS_COLORS` por `LEVEL_INTENT`/`STATUS_INTENT: Record<string, BadgeProps['intent']>` (import de `type { BadgeProps } from '@/components/ui/Badge'`). Interfaces (`Program`, `AcademicClass`, `ProgramDetail`, `Grade`, `Enrollment`, `Transcript`) não mudam.
- [ ] `npx tsc --noEmit` — erros esperados em `ProgramsListView`/`ProgramDetailView`/`TranscriptView` (ainda usam os nomes antigos) até às Tasks seguintes.
- [ ] Commit: `refactor(academic): migrar types.ts para tokens da fundacao (LEVEL_INTENT/STATUS_INTENT)`

### Task 2: `components/academic/shared.tsx`

- [ ] `Info`: retoken (`text-gray-400`→`text-ink-faint`, `text-gray-800`→`text-ink`).
- [ ] `SummaryCard`: eliminado (o único consumidor, `TranscriptView`, passa a usar `KpiCard` directamente na Task 5).
- [ ] `CardGridSkeleton`/`DetailSkeleton`: passam a compor `@/components/ui/Skeleton` (`itemClassName="skeleton-shimmer ... rounded-card"`), mantendo a mesma assinatura/export (consumidores não mudam).
- [ ] `npx tsc --noEmit` — erro esperado em `TranscriptView` (`SummaryCard` deixou de existir) até à Task 5.
- [ ] Commit: `refactor(academic): migrar shared.tsx para a fundacao de design`

### Task 3: `components/academic/ProgramsListView.tsx`

- [ ] Erro → `EmptyState` (`icon={AlertCircle}`, `action.onClick=onRetry`).
- [ ] Header: `h1`/`p` retoken; link "A minha transcrição" → `<Link className={buttonVariants({ intent: 'secondary', size: 'sm' })}>`.
- [ ] Pesquisa → `Input`; filtro de nível → `Select` com mapeamento `ALL↔''` (ver Global Constraints).
- [ ] Grelha vazia → `EmptyState`.
- [ ] Card de programa → `<Link>` estilizado à mão com classes token de `Card` (ver Global Constraints); `Badge intent={LEVEL_INTENT[p.level]}` para o nível; código do programa `text-accent font-data` (substitui `font-mono text-blue-600`).
- [ ] Paginação → `Button` (`intent="secondary" size="sm"`).
- [ ] `npx tsc --noEmit` sem erros novos neste ficheiro.
- [ ] Commit: `refactor(academic): migrar ProgramsListView para a fundacao de design`

### Task 4: `components/academic/ProgramDetailView.tsx`

- [ ] "← Voltar" → `button` retoken (`text-primary hover:underline`).
- [ ] Bloco principal → `Card`/`CardBody`; badge de nível → `Badge intent={LEVEL_INTENT[...]}`; botão "Matricular-me" → `Button`.
- [ ] Lista de turmas → `Card` com `divide-y divide-border`; acção "Inscrever" por turma → `Button size="sm" intent="ghost"`.
- [ ] `npx tsc --noEmit` sem erros novos neste ficheiro.
- [ ] Commit: `refactor(academic): migrar ProgramDetailView para a fundacao de design`

### Task 5: `components/academic/TranscriptView.tsx`

- [ ] Resumo (4 cartões) → `KpiCard` (ícones: GPA=`GraduationCap` intent `primary`, Horas=`Clock` intent `accent`, Concluídos=`CheckCircle2` intent `success`, Em curso=`Hourglass` intent `warning`; `className="w-full"` para preencher a coluna da grid).
- [ ] Lista de matrículas vazia → `EmptyState`.
- [ ] Cada matrícula → `Card`/`CardBody`; badge de estado → `Badge intent={STATUS_INTENT[e.status]}`; código → `font-data`; barra de progresso → `ProgressBar`; chips de notas → token classes (`border-border bg-surface-sunken text-ink-muted rounded-control`).
- [ ] `npx tsc --noEmit` sem erros novos neste ficheiro.
- [ ] Commit: `refactor(academic): migrar TranscriptView para a fundacao de design`

### Task 6: `app/(platform)/academic/programs/[id]/page.tsx` + `app/(platform)/academic/transcript/page.tsx`

- [ ] Ambos: bloco de erro local (`bg-red-50 border-red-200 text-red-700` + botão "Voltar"/"Tentar novamente") → `EmptyState` (`icon={AlertCircle}`).
- [ ] `npx tsc --noEmit` sem erros novos.
- [ ] Commit: `refactor(academic): migrar paginas de erro (detalhe/transcricao) para EmptyState`

### Task 7: Verificação final

- [ ] Grep: `grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/academic/ "app/(platform)/academic"` → 0.
- [ ] `npx tsc --noEmit` → sem erros.
- [ ] `npm run build` → sem erros.
- [ ] `npm test` → verde.
- [ ] Push + `gh pr create` (título `refactor(academic): migrar para a fundação de design`, corpo referenciando PR #183/#185, Vaga 1).

---

## Notas de execução

- `types.ts` → `shared.tsx` têm dependência de ordem real (`shared.tsx`/views usam `LEVEL_INTENT`/`STATUS_INTENT`; `TranscriptView` usa `KpiCard` só depois de `SummaryCard` sair de `shared.tsx`). As Tasks 3/4/5/6 são independentes entre si.
- Nenhuma task toca hooks (`useAcademicPrograms`, `useAcademicProgramDetail`, `useAcademicTranscript`) nem `queryKeys`/`apiClient` — só JSX/className/imports de apresentação.
