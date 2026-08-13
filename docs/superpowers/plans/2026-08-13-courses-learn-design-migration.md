# Migração do módulo courses-learn (Vaga 2, Lote 1) — Plano

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar `components/courses-learn/**` + a rota aninhada `app/(platform)/courses/[courseId]/learn/**` para consumir exclusivamente `components/ui/` (Fase A), eliminando `atoms.tsx` e toda a paleta Tailwind crua (`gray`/`blue`/`emerald`/`amber`/`white`/`font-mono`), sem alterar nenhum comportamento de dados.

**Architecture:** 9 ficheiros: `types.ts` e `utils.ts` (sem cor, não tocados), `atoms.tsx` (3 exports a eliminar: `ProgressRing`, `Skeleton`, `ModuleStatusIcon`), 5 componentes de apresentação (`LessonRow`, `ModuleAccordion`, `ContentPlayer`, `ModuleCompletedBanner`, `ModuleBuilder` — este último auto-contido com dados próprios via `useApiQuery`/`useApiMutation`), 1 ficheiro de exemplo/documentação não-usado (`CourseAvatarReaderExample.tsx`, só 1 ocorrência de cor), e o container `app/(platform)/courses/[courseId]/learn/page.tsx` (gere modo aprender/construtor, lição/módulo activos).

**Tech Stack:** Next.js 15.3, React 19.2, TypeScript 5, Tailwind v4, `components/ui/` (Fase A, PR #183). Referência de formato: PR #185 (`components/engagement/**`) e PR #194 (`components/dashboard-institutional/**`, plano em `docs/superpowers/plans/2026-08-13-dashboard-institutional-design-migration.md`).

## Global Constraints

- Repo: `C:\Users\PLÁCIDO COSTA\innova\frontend`. Branch: `refactor/courses-learn-design-migration`, a partir de `main`.
- **Zero alterações a dados/comportamento** — `useApiQuery`/`useApiMutation`, `useParams`, toda a lógica de selecção de lição/módulo e de `handleMarkComplete`/`handleContinueAfterModule` mantêm-se literalmente iguais. Só a apresentação muda.
- **Zero classes de cor Tailwind cruas** (`gray-*`, `blue-*`, `emerald-*`, `amber-*`, `text-white`, `bg-white`, `font-mono`) em `components/courses-learn/**` e `app/(platform)/courses/[courseId]/learn/**` no final — só tokens da Fase A.
- **Não criar componentes novos em `components/ui/`.**
- **Mapeamento dos 3 exports de `atoms.tsx`** (não há ficheiro `atoms.tsx` de substituição — cada export é migrado para o seu único consumidor):
  - `ProgressRing` (usado só em `page.tsx`) → sem equivalente directo (nenhum "ring" na fundação); substituído pelo `ProgressBar` (`@/components/ui/ProgressBar`) linear já usado no resto da app para indicar progresso.
  - `Skeleton` local (wrapper com `itemClassName="h-12 bg-gray-100 rounded-xl"`) → chamada directa ao `Skeleton` partilhado (`@/components/ui/Skeleton`) com `itemClassName="skeleton-shimmer h-12 rounded-card"` (convenção já usada em `components/engagement/OverviewTab.tsx`), nos 2 consumidores (`page.tsx`, `ModuleBuilder.tsx`).
  - `ModuleStatusIcon` (usado só em `ModuleAccordion.tsx`) → lógica inline no único consumidor, com ícones `lucide-react` (`Lock`/`CheckCircle2`/`PlayCircle`/`Circle`) coloridos por token (`text-ink-faint`/`text-success-ink`/`text-accent`) em vez de emoji + `text-gray-*`.
- **Área escura do player/celebração** (`bg-gray-950`/`text-white` em `ContentPlayer`, `ModuleCompletedBanner`, e o placeholder "sem lição seleccionada" em `page.tsx`): substituída por `bg-ink` + `text-canvas` (`text-canvas/NN` para texto secundário) — mesmo padrão já usado em `components/ui/Tooltip.tsx` (`bg-ink`) e `components/ui/Modal.tsx` (`bg-ink/40`) para superfícies escuras da fundação; qualquer CTA sobre esse fundo usa `Button intent="secondary"` (pílula clara com boa legibilidade sobre `bg-ink`).
- **Toggle "Aprender/Construtor"** no topbar de `page.tsx`: `bg-gray-100 rounded-lg p-1` + botões manuais → `Tabs`/`TabsList`/`TabsTrigger` (`@/components/ui/Tabs`) controlado por `value={mode} onValueChange={...}`, sem `TabsContent` (o resto do layout mantém-se com os condicionais `mode === 'learn' | 'build'` já existentes — mesmo padrão de "selector controlado sem Content" é seguro em Radix Tabs).
- **`Card` da Fase A**: sem prop `interactive` salvo os cartões de módulo do `ModuleBuilder` não terem acção de clique própria (não usar `interactive`).
- Ícones `lucide-react`, sempre `strokeWidth={1.75}`, tamanhos só de `{14,16,18,20,24}`.
- Verificação: `npx tsc --noEmit` (cada task) + `npm run build` + `npm test` (última task).
- Commits: `git commit --no-verify`, mensagem termina sempre com `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.
- `types.ts`, `utils.ts` não são tocados — sem cor nenhuma.
- Não tocar `components/courses/**` nem `components/courses-modulos/**` (módulos irmãos fora de escopo).

---

### Task 1: `CourseAvatarReaderExample.tsx` (1 ocorrência, isolado)

- [ ] **Step 1:** `text-gray-800` → `text-ink` no `<div className="prose prose-sm max-w-none ...">`.
- [ ] **Step 2:** `npx tsc --noEmit`.
- [ ] **Step 3:** Commit `refactor(courses-learn): migrar CourseAvatarReaderExample para tokens`.

### Task 2: `LessonRow.tsx`

- [ ] **Step 1:** Reescrever com tokens: `border-gray-100` → `border-border`; `bg-blue-50`/`hover:bg-gray-50` → `bg-primary-subtle`/`hover:bg-surface-sunken`; indicador de conclusão `bg-emerald-100 text-emerald-700` → `bg-success-subtle text-success-ink`, `bg-blue-600 text-white` → `bg-primary text-canvas`, `bg-gray-100 text-gray-400` → `bg-surface-sunken text-ink-faint`; título `text-blue-800`/`text-gray-500`/`text-gray-700` → `text-primary`/`text-ink-muted`/`text-ink`; duração `text-gray-400` → `text-ink-faint`; cadeado `text-gray-300` (emoji 🔒) → ícone `Lock` (`lucide-react`, size 14, `text-ink-faint`); check de conclusão (glyph `✓`) → ícone `Check` (size 14) dentro do indicador.
- [ ] **Step 2:** `npx tsc --noEmit`.
- [ ] **Step 3:** Commit `refactor(courses-learn): migrar LessonRow para tokens + icones lucide`.

### Task 3: `ModuleAccordion.tsx`

- [ ] **Step 1:** Remover `import { ModuleStatusIcon } from './atoms'`; inline de um pequeno helper local (não exportado) que replica a lógica (`locked`→`Lock` `text-ink-faint`, `completed`→`CheckCircle2` `text-success-ink`, `pct>0`→`PlayCircle` `text-accent`, senão `Circle` `text-ink-faint`), ícones size 16.
- [ ] **Step 2:** Resto dos tokens: `border-gray-100` → `border-border`; header `bg-gray-50`/`hover:bg-gray-50` → `bg-surface-sunken`/`hover:bg-surface-sunken`; título `text-gray-400`/`text-gray-800` → `text-ink-faint`/`text-ink`; badge "Opcional" (`bg-blue-50 text-blue-600`) → `Badge` (`@/components/ui/Badge`) `intent="info"`; label do tipo `text-gray-400` → `text-ink-faint`; barra de progresso do módulo (`bg-gray-200`/`bg-blue-500`) → `ProgressBar` (`@/components/ui/ProgressBar`) `value={mod.pct}`; contagem `text-gray-400` → `text-ink-faint`; `lockedReason` `text-amber-600` → `text-warning-ink`; chevron `text-gray-400` → `text-ink-faint`; materiais: cabeçalho `bg-gray-50 border-gray-100` → `bg-surface-sunken border-border`, label `text-gray-400` → `text-ink-faint`, link `text-blue-600 hover:text-blue-800` → `text-primary hover:text-primary-hover`, tipo de ficheiro `text-gray-400` → `text-ink-faint`.
- [ ] **Step 3:** `npx tsc --noEmit`.
- [ ] **Step 4:** Commit `refactor(courses-learn): migrar ModuleAccordion (elimina uso de atoms)`.

### Task 4: `ContentPlayer.tsx`

- [ ] **Step 1:** Breadcrumb: `border-gray-100 bg-gray-50 text-gray-500` → `border-border bg-surface-sunken text-ink-muted`; separador `text-gray-300` → `text-ink-faint`. Área do player: `bg-gray-950`/`text-white` → `bg-ink`/`text-canvas`; subtítulos `text-gray-400`/`text-gray-300` → `text-canvas/70`/`text-canvas/80`; link PDF `text-blue-400 hover:text-blue-300` → `text-accent hover:text-accent-hover`. Barra inferior: `border-gray-200 bg-white` → `border-border bg-surface`; título `text-gray-900` → `text-ink`; duração `text-gray-400` → `text-ink-faint`; botão "Marcar como concluída"/"Concluída" (`bg-emerald-50 text-emerald-700 border-emerald-200` / `bg-blue-700 text-white hover:bg-blue-800`) → `Button` (`@/components/ui/Button`), `intent="secondary"` quando `lesson.completed` (com ícone `Check` size 16) e `intent="primary"` (default) caso contrário.
- [ ] **Step 2:** `npx tsc --noEmit`.
- [ ] **Step 3:** Commit `refactor(courses-learn): migrar ContentPlayer para tokens (bg-ink no player)`.

### Task 5: `ModuleCompletedBanner.tsx`

- [ ] **Step 1:** `bg-gray-950`/`text-white` → `bg-ink`/`text-canvas`; título `font-display text-2xl font-bold`; parágrafo `text-gray-300` → `text-canvas/80` `font-body`; botão "Continuar" (`bg-blue-600 hover:bg-blue-700 text-white`) → `Button intent="secondary"`.
- [ ] **Step 2:** `npx tsc --noEmit`.
- [ ] **Step 3:** Commit `refactor(courses-learn): migrar ModuleCompletedBanner para tokens`.

### Task 6: `ModuleBuilder.tsx`

- [ ] **Step 1:** `import { Skeleton } from './atoms'` → `import { Skeleton } from '@/components/ui/Skeleton'`, chamada com `itemClassName="skeleton-shimmer h-12 rounded-card"`.
- [ ] **Step 2:** Cabeçalho: label `text-gray-400` → `text-ink-faint`; botão "+ Adicionar módulo" → `Button size="sm"` com ícone `Plus` (size 14).
- [ ] **Step 3:** Formulário de criação: wrapper `bg-blue-50 border-blue-100 rounded-xl` → `rounded-card border border-primary bg-primary-subtle`; título `text-blue-700` → `text-primary`; `<input>` → `Input` (`@/components/ui/Input`); botões "Criar"/"Cancelar" → `Button size="sm"` (`intent="primary"` / `intent="secondary"`).
- [ ] **Step 4:** Lista de módulos: cartão `bg-white border-gray-200 rounded-xl` → `Card` (`@/components/ui/Card`) `className="overflow-hidden"`; drag handle `text-gray-300` → `text-ink-faint`; índice `bg-gray-100 text-gray-500 font-mono` → `bg-surface-sunken text-ink-muted font-data`; input de edição inline → `Input`; título `text-gray-900` → `text-ink`; badge de estado (`bg-emerald-50 text-emerald-700` / `bg-gray-100 text-gray-500`) → `Badge intent={mod.status === 'PUBLISHED' ? 'success' : 'neutral'}`; badge "Opcional" → `Badge intent="info"` (mesmo padrão do Task 3); tipo `text-gray-400` → `text-ink-faint`; contagem/drip/progressão `text-gray-400` → `text-ink-faint`; acções (editar/publicar/eliminar) → `IconButton` (`@/components/ui/Button`) `intent="ghost"`, ícones `Pencil`/`Upload`/`Trash2` (size 18 default do `IconButton`), publicar e eliminar com `className="hover:bg-success-subtle hover:text-success-ink"` / `className="hover:bg-danger-subtle hover:text-danger"` (mesmo padrão de `components/automation/RulesTab.tsx`); pré-visualização de lições: divisor `border-gray-100` → `border-border`, texto `text-gray-500` → `text-ink-muted`, duração `text-gray-300` → `text-ink-faint`, "+N mais aulas" `text-gray-400` → `text-ink-faint`.
- [ ] **Step 5:** Estado vazio (`py-12 text-center text-gray-400 border-dashed border-gray-200 rounded-xl`) → `EmptyState` (`@/components/ui/EmptyState`) `icon={Layers}` `title="Sem módulos"` `description="Adicione o primeiro módulo acima."`.
- [ ] **Step 6:** `npx tsc --noEmit`.
- [ ] **Step 7:** Commit `refactor(courses-learn): migrar ModuleBuilder para tokens (elimina uso de atoms)`.

### Task 7: Eliminar `atoms.tsx`

- [ ] **Step 1:** Confirmar `grep -rn "from './atoms'" components/courses-learn/` → 0 resultados (Tasks 3 e 6 já removeram os 2 imports internos ao módulo).
- [ ] **Step 2:** `git rm components/courses-learn/atoms.tsx`.
- [ ] **Step 3:** Commit `refactor(courses-learn): eliminar atoms.tsx (consolidado em components/ui/)`.

### Task 8: `app/(platform)/courses/[courseId]/learn/page.tsx`

- [ ] **Step 1:** Import: remover `ProgressRing, Skeleton` de `@/components/courses-learn/atoms`; adicionar `Skeleton` de `@/components/ui/Skeleton`, `ProgressBar` de `@/components/ui/ProgressBar`, `Tabs, TabsList, TabsTrigger` de `@/components/ui/Tabs`, `Button` de `@/components/ui/Button`, ícones `lucide-react` (`ArrowLeft`, `PanelLeft`).
- [ ] **Step 2:** Container raiz `bg-white` → `bg-canvas`. Topbar `border-gray-200 bg-white` → `border-border bg-surface`. "← Voltar" (`text-gray-500 hover:text-gray-800`) → `Button intent="ghost" size="sm"` com ícone `ArrowLeft` (size 16). Título `text-gray-900` → `text-ink` `font-body`; subtítulo `text-gray-400` → `text-ink-faint` `font-body`.
- [ ] **Step 3:** `ProgressRing` → `ProgressBar value={overallPct} className="w-20"`; `%` `font-mono text-gray-600` → `font-data text-ink-muted`.
- [ ] **Step 4:** Toggle de modo (`bg-gray-100 rounded-lg p-1` + botões) → `<Tabs value={mode} onValueChange={(v) => setMode(v as PageMode)}><TabsList><TabsTrigger value="learn">Aprender</TabsTrigger><TabsTrigger value="build">Construtor</TabsTrigger></TabsList></Tabs>` — sem `TabsContent`; `mode` continua a ser o único estado, `setMode` é a mesma função já existente.
- [ ] **Step 5:** Botão sidebar (`text-gray-500 hover:text-gray-800 border-gray-200`) → `Button intent="secondary" size="sm"` com ícone `PanelLeft` (size 16) + texto `{sidebarOpen ? 'Ocultar' : 'Estrutura'}`.
- [ ] **Step 6:** Sidebar wrapper `border-gray-200 bg-white` → `border-border bg-surface`. Cabeçalho sidebar `border-gray-100 bg-gray-50` → `border-border bg-surface-sunken`; label `text-gray-500` → `text-ink-muted`; barra `bg-gray-200`/`bg-blue-600` → `ProgressBar value={overallPct} className="flex-1"`; `%` `font-mono text-gray-500` → `font-data text-ink-muted`.
- [ ] **Step 7:** `<Skeleton />` local → `<Skeleton itemClassName="skeleton-shimmer h-12 rounded-card" />` de `@/components/ui/Skeleton`.
- [ ] **Step 8:** Placeholder "sem lição seleccionada" (`bg-gray-950 text-white`) → `bg-ink text-canvas`; subtítulo `text-gray-400` → `text-canvas/70`.
- [ ] **Step 9:** `npx tsc --noEmit`.
- [ ] **Step 10:** Commit `refactor(courses-learn): migrar page.tsx para tokens (Tabs + ProgressBar)`.

### Task 9: Verificação final

- [ ] **Step 1:** `grep -rn "from './atoms'" components/courses-learn/` → 0.
- [ ] **Step 2:**
```
grep -rniE "(violet|indigo|slate|amber|emerald|red|teal|purple|blue|green|yellow|orange|gray|zinc|neutral|stone|cyan|sky|rose|pink|fuchsia|lime)-[0-9]{2,3}|text-white\b" components/courses-learn/ "app/(platform)/courses/[courseId]/learn"
```
→ 0 resultados.
- [ ] **Step 3:** `npx tsc --noEmit` → sem erros.
- [ ] **Step 4:** `npm run build` → sem erros, rota `/courses/[courseId]/learn` presente.
- [ ] **Step 5:** `npm test` → 43/43 verde.
- [ ] **Step 6:** Push + `gh pr create --title "refactor(courses-learn): migrar para a fundação de design" --body "..."` referenciando PR #183/#185, Vaga 2 Lote 1.

Aguardar o check `quality` (CI) ficar verde — **não faz merge**, para aqui.

---

## Notas de execução

- `types.ts` e `utils.ts` não têm nenhuma cor crua e não são tocados.
- `CourseAvatarReaderExample.tsx` não é usado por nenhuma rota real (documentação/exemplo) mas está dentro do escopo do módulo — migrado por completude e para zerar o grep.
- `atoms.tsx` não tem substituto 1:1 em `components/ui/`; os seus 3 exports são absorvidos pelos únicos consumidores (ver "Mapeamento" acima), não por um novo ficheiro `atoms.tsx` local.
